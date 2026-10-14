#!/usr/bin/env node
/** Fail-closed local render gate after motion-drive pull. No network or mutation. */
import {createHash} from "node:crypto";
import {readFile,lstat} from "node:fs/promises";
import {resolve,join,basename,sep} from "node:path";
import {pathToFileURL} from "node:url";
import {validateManifest} from "./motion-drive.mjs";
const assert=(ok,msg)=>{if(!ok) throw new Error(msg);};
const hash=(bytes)=>createHash("sha256").update(bytes).digest("hex");
function checkStage(m,stage) {
  assert(["storyboard","preview","final"].includes(stage),"Unsupported render stage");
  if(stage==="storyboard"){
    assert(["DRAFT","WAITING_STORYBOARD_APPROVAL"].includes(m.state),"Storyboard state does not permit review render");
    return;
  }
  assert(typeof m.approval.storyboard_approved_by==="string" && m.approval.storyboard_approved_by.includes("@") && m.approval.storyboard_approved_at,"Human storyboard approval missing");
  assert(["STORYBOARD_APPROVED","QUALITY_REVIEW","READY_FOR_HUMAN","FINAL_APPROVED"].includes(m.state),"Job state blocks preview");
  if(stage==="final"){
    assert(m.state==="FINAL_APPROVED" && typeof m.approval.final_approved_by==="string" && m.approval.final_approved_by.includes("@") && m.approval.final_approved_at,"Human final approval missing");
    assert(m.output.QA_report_id && m.output.source_archive_id && m.output.preview_file_ids?.length,"Preview, QA and editable source required for final");
  }
}
export async function preflight({workspace,stage="storyboard"}) {
  assert(typeof workspace==="string" && workspace.trim(),"Missing workspace");
  const root=resolve(workspace);
  const m=validateManifest(JSON.parse(await readFile(join(root,"motion-job.json"),"utf8")));
  const a=JSON.parse(await readFile(join(root,"audit.json"),"utf8"));
  assert(a.job_id===m.job_id,"Asset audit belongs to another job");
  assert(a.passed===true && a.state==="ASSET_AUDIT_PASSED" && Array.isArray(a.blockers) && a.blockers.length===0,"Asset audit blocked or incomplete");
  assert(Array.isArray(a.assets) && a.assets.length===m.inputs.length,"Asset audit coverage incomplete");
  checkStage(m,stage);
  const map=new Map();
  for(const item of a.assets){
    assert(typeof item.drive_file_id==="string" && !map.has(item.drive_file_id),"Duplicate or invalid audit entry");
    map.set(item.drive_file_id,item);
  }
  for(const input of m.inputs){
    const item=map.get(input.drive_file_id);
    assert(item && item.role===input.role,"Missing or mismatched audited asset: "+input.role);
    const name=item.name;
    assert(typeof name==="string" && /^[a-zA-Z0-9._-]{1,240}$/.test(name) && name!=="." && name!==".." && basename(name)===name,"Unsafe asset filename");
    const path=resolve(root,name);
    assert(path.startsWith(root+sep),"Asset escaped workspace");
    const stat=await lstat(path);
    assert(stat.isFile() && !stat.isSymbolicLink(),"Not a regular asset: "+input.role);
    const actual=hash(await readFile(path));
    assert(actual===item.sha256,"Local asset changed since Drive audit: "+input.role);
    if(input.checksum) assert(actual===input.checksum.replace(/^sha256:/,"").toLowerCase(),"Pinned checksum mismatch: "+input.role);
  }
  return {job_id:m.job_id,stage,result:"READY_FOR_RENDER",assets_verified:m.inputs.length};
}
if(process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  const args=process.argv.slice(2);
  if(args.length!==4 || args[0]!=="--workspace" || args[2]!=="--stage"){
    console.error("Usage: node bin/motion-job-preflight.mjs --workspace JOB_FOLDER --stage storyboard|preview|final");
    process.exitCode=2;
  }else{
    preflight({workspace:args[1],stage:args[3]}).then(result=>console.log(JSON.stringify(result,null,2)))
      .catch(error=>{console.error("Motion OS render blocked: "+error.message);process.exitCode=1;});
  }
}
