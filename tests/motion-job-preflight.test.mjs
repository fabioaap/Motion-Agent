import test from "node:test";
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {mkdtemp,writeFile,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {preflight} from "../bin/motion-job-preflight.mjs";
const original=Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'/>");
const sha=buf=>createHash("sha256").update(buf).digest("hex");
function manifest(){return{
 schema_version:"motion-job.v1",job_id:"preflight_test_01",brand_id:"samplebrand",project_name:"Test job",
 brief:{objective:"Present the product",audience:"Buyers",message:"Value",cta:"Learn more"},
 deliverables:[{aspect_ratio:"9:16",width:1080,height:1920,fps:30,duration_seconds:15}],
 inputs:[{role:"original_logo",drive_file_id:"original_logo_id",mime_type:"image/svg+xml",rights_status:"owned",checksum:sha(original)}],
 brand:{drive_folder_id:"brand_folder",logo_file_ids:["original_logo_id"],palette_reference:"palette",typography_reference:"type"},
 creative:{storyboard_required:true},engine:{preferred:"remotion",fallback_allowed:false},
 approval:{storyboard_approved_by:null,storyboard_approved_at:null,final_approved_by:null,final_approved_at:null},
 output:{drive_folder_id:"job",preview_file_ids:[],final_file_ids:[],source_archive_id:null,QA_report_id:null},state:"DRAFT"
};}
function audit(){return{
 job_id:"preflight_test_01",passed:true,state:"ASSET_AUDIT_PASSED",blockers:[],
 assets:[{role:"original_logo",drive_file_id:"original_logo_id",name:"001_original_logo_logo.svg",sha256:sha(original)}]
};}
async function fixture(fn){
 const workspace=await mkdtemp(join(tmpdir(),"motion-os-preflight-"));
 const m=manifest(),a=audit();
 const save=async()=>{await writeFile(join(workspace,"motion-job.json"),JSON.stringify(m));await writeFile(join(workspace,"audit.json"),JSON.stringify(a));};
 try{await writeFile(join(workspace,a.assets[0].name),original);await save();await fn({workspace,m,a,save});}
 finally{await rm(workspace,{recursive:true,force:true});}
}
test("verified Drive inputs permit storyboard review, but tampering blocks it",()=>fixture(async({workspace,a,save})=>{
 const result=await preflight({workspace,stage:"storyboard"});
 assert.equal(result.result,"READY_FOR_RENDER");assert.equal(result.assets_verified,1);
 await writeFile(join(workspace,a.assets[0].name),"tampered");
 await assert.rejects(preflight({workspace,stage:"storyboard"}),/changed since Drive audit/);
 a.assets[0].name="../escape.svg";await save();
 await assert.rejects(preflight({workspace,stage:"storyboard"}),/Unsafe asset filename/);
}));
test("stale or blocked audits cannot authorize rendering",()=>fixture(async({workspace,m,a,save})=>{
 a.job_id="other";await save();
 await assert.rejects(preflight({workspace}),/another job/);
 a.job_id=m.job_id;a.passed=false;await save();
 await assert.rejects(preflight({workspace}),/blocked or incomplete/);
 a.passed=true;a.assets[0].drive_file_id="different";await save();
 await assert.rejects(preflight({workspace}),/mismatched audited asset/);
}));
test("preview and final require explicit approval and QA evidence",()=>fixture(async({workspace,m,save})=>{
 await assert.rejects(preflight({workspace,stage:"preview"}),/storyboard approval/);
 m.state="STORYBOARD_APPROVED";m.approval.storyboard_approved_by="reviewer@example.com";m.approval.storyboard_approved_at="2026-10-14T11:00:00Z";await save();
 assert.equal((await preflight({workspace,stage:"preview"})).result,"READY_FOR_RENDER");
 await assert.rejects(preflight({workspace,stage:"final"}),/final approval/);
 m.state="FINAL_APPROVED";m.approval.final_approved_by="reviewer@example.com";m.approval.final_approved_at="2026-10-14T12:00:00Z";await save();
 await assert.rejects(preflight({workspace,stage:"final"}),/Preview, QA/);
 m.output.QA_report_id="qa";m.output.source_archive_id="source";m.output.preview_file_ids=["preview"];await save();
 assert.equal((await preflight({workspace,stage:"final"})).assets_verified,1);
}));
