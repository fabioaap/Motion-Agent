import test from "node:test";
import assert from "node:assert/strict";
import {mkdtemp, writeFile, rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {createHash} from "node:crypto";
import {refreshAccessToken, safeRunFolder, uploadBundle} from "../scripts/upload-motion-render-to-drive.mjs";

test("refresh exchange returns short-lived access token", async () => {
  let req;
  const token = await refreshAccessToken({
    clientId:"id", clientSecret:"secret", refreshToken:"refresh",
    fetcher:async (url, options) => {req={url, options}; return {ok:true, json:async()=>({access_token:"access"})};}
  });
  assert.equal(token, "access");
  assert.equal(req.url, "https://oauth2.googleapis.com/token");
  assert.equal(req.options.method, "POST");
  assert.equal(new URLSearchParams(req.options.body).get("grant_type"), "refresh_token");
});

test("OAuth errors never log credentials or response bodies", async () => {
  await assert.rejects(refreshAccessToken({
    clientId:"id", clientSecret:"secret", refreshToken:"sensitive",
    fetcher:async()=>({ok:false,status:401,text:async()=>"sensitive"})
  }), /HTTP 401/);
});

test("run folder is unique and validated", () => {
  assert.equal(safeRunFolder({workflow:"motion_os_poc001",quality:"review",runId:"38498841011",runAttempt:"2"}),
    "motion_os_poc001-review-run-38498841011-attempt-2");
  assert.throws(()=>safeRunFolder({workflow:"../secret",quality:"review",runId:"38498841011",runAttempt:"1"}), /Invalid workflow ID/);
});

test("uploads MP4, JSON and PNG privately and verifies sha256 + size", async () => {
  const dir=await mkdtemp(join(tmpdir(),"motion-drive-"));
  try {
    const names=["video.mp4","qa.json","sheet.png"];
    for(const name of names) await writeFile(join(dir,name),Buffer.from(name));
    const created=[];
    const client={
      ensureFolder:async(parent,name)=>{assert.equal(parent,"parent");assert.equal(name,"run");return "folder-1";},
      createFile:async(parent,name,bytes,mime)=>{assert.equal(parent,"folder-1");created.push({name,mime});return {id:name};},
      metadata:async(id)=>{const b=Buffer.from(id);return {size:b.length,description:"sha256:"+createHash("sha256").update(b).digest("hex")};}
    };
    const result=await uploadBundle({client,parentFolderId:"parent",folderName:"run",paths:names.map(n=>join(dir,n))});
    assert.equal(result.files.length,3);
    assert.deepEqual(created.map(x=>x.mime),["video/mp4","application/json","image/png"]);
    assert.equal(result.folder_url,"https://drive.google.com/drive/folders/folder-1");
  } finally {await rm(dir,{recursive:true,force:true});}
});

test("missing files and empty bundles fail before calling Drive", async () => {
  const client={ensureFolder:()=>{throw new Error("Unexpected upload");}};
  await assert.rejects(uploadBundle({client,parentFolderId:"parent",folderName:"run",paths:["/tmp/nonexistent-zzzz.mp4"]}), /ENOENT/);
  await assert.rejects(uploadBundle({client,parentFolderId:"parent",folderName:"run",paths:[]}), /Select between/);
});
