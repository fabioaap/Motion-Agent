import test from "node:test";
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {mkdtemp, writeFile, rm, readFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {validateManifest, initJob, loadJob, auditAndPull, publish, approve} from "../bin/motion-drive.mjs";

const digest = (x) => createHash("sha256").update(x).digest("hex");
const logo = Buffer.from("<svg><title>Logo authorized</title></svg>");
function fixture() {
  return {
    schema_version: "motion-job.v1",
    job_id: "test_job_001", brand_id: "samplebrand", project_name: "Test Motion",
    brief: {objective: "Product demo", audience: "Designers", message: "See the product", cta: "Learn more"},
    deliverables: [{aspect_ratio: "9:16", width: 1080, height: 1920, fps: 30, duration_seconds: 15}],
    inputs: [{role: "logo", drive_file_id: "source_logo", mime_type: "image/svg+xml", rights_status: "owned", checksum: digest(logo)}],
    brand: {drive_folder_id: "brand_assets", logo_file_ids: ["source_logo"], palette_reference: "brand kit", typography_reference: "brand kit"},
    creative: {storyboard_required: true, narrative_idea: "Brand introduction", motion_reference_ids: []},
    engine: {preferred: "remotion", fallback_allowed: false},
    approval: {storyboard_approved_by: null, storyboard_approved_at: null, final_approved_by: null, final_approved_at: null},
    output: {drive_folder_id: "", preview_file_ids: [], final_file_ids: [], source_archive_id: null, QA_report_id: null},
    state: "DRAFT"
  };
}
class MemoryDrive {
  constructor() {
    this.files = new Map([["source_logo", {id: "source_logo", parent: "brand_assets", name: "brand.svg", mimeType: "image/svg+xml", size: logo.length, version: "1", bytes: logo}]]);
    this.index = 0;
  }
  async list(parent, name) { return [...this.files.values()].filter(x => x.parent === parent && x.name === name); }
  async ensureFolder(parent, name) {
    const existing = await this.list(parent, name);
    if (existing.length) return existing[0].id;
    const id = "folder_" + ++this.index;
    this.files.set(id, {id, parent, name, mimeType: "application/vnd.google-apps.folder"});
    return id;
  }
  async createFile(parent, name, bytes, mimeType = "application/octet-stream") {
    const existing = await this.list(parent, name);
    if (existing.length) {
      assert.equal(existing[0].description, "sha256:" + digest(bytes));
      return existing[0];
    }
    const id = "file_" + ++this.index;
    const obj = {id, parent, name, mimeType, version: "1", description: "sha256:" + digest(bytes), bytes, size: bytes.length, webViewLink: "https://drive.google.com/file/d/" + id};
    this.files.set(id, obj); return obj;
  }
  async replaceManifest(id, manifest) {
    const f = this.files.get(id);
    f.bytes = Buffer.from(JSON.stringify(manifest));
    f.version = String(Number(f.version) + 1);
    f.description = "sha256:" + digest(f.bytes);
    return {id};
  }
  async download(id) { assert(this.files.has(id)); return this.files.get(id).bytes; }
  async metadata(id) { assert(this.files.has(id)); return this.files.get(id); }
  async about() { return {user: {emailAddress: "owner@example.com"}}; }
}
test("manifest rejects unknown asset rights, unsigned assets and cross-brand logo references", () => {
  const good = fixture();
  assert.equal(validateManifest(good).job_id, "test_job_001");
  good.inputs[0].rights_status = "unknown";
  assert.throws(() => validateManifest(good), /rights unconfirmed/);
  good.inputs[0].rights_status = "owned";
  delete good.inputs[0].checksum;
  assert.throws(() => validateManifest(good), /pin checksum/);
  good.inputs[0].checksum = digest(logo);
  good.brand.logo_file_ids = ["another_brand_logo"];
  assert.throws(() => validateManifest(good), /not included in inputs/);
});
test("Drive job creation is idempotent and asset audit verifies sha256", async () => {
  const client = new MemoryDrive();
  const one = await initJob(client, "parent_folder", fixture());
  const two = await initJob(client, "parent_folder", fixture());
  assert.equal(one.folder, two.folder);
  assert.equal(two.reused, true);
  const dir = await mkdtemp(join(tmpdir(), "motion-os-"));
  try {
    const fetched = await loadJob(client, one.folder);
    const audit = await auditAndPull(client, fetched.manifest, dir);
    assert.equal(audit.report.passed, true);
    assert.equal(audit.report.assets.length, 1);
    assert.equal(audit.report.assets[0].sha256, digest(logo));
    const saved = JSON.parse(await readFile(join(audit.workspace, "audit.json"), "utf8"));
    assert.equal(saved.state, "ASSET_AUDIT_PASSED");
    client.files.get("source_logo").bytes = Buffer.from("tampered");
    const second = await auditAndPull(client, fetched.manifest, dir);
    assert.equal(second.report.passed, false);
    assert.match(second.report.blockers[0].reason, /SHA256 mismatch/);
  } finally {await rm(dir, {recursive: true, force: true});}
});
test("storyboard, QA and verified human approvals gate final delivery", async () => {
  const client = new MemoryDrive();
  const {folder} = await initJob(client, "parent_folder", fixture());
  const dir = await mkdtemp(join(tmpdir(), "motion-os-"));
  try {
    const storyboard = join(dir, "board.txt");
    const preview = join(dir, "preview.mp4");
    const source = join(dir, "editable.zip");
    const qa = join(dir, "qa.json");
    const final = join(dir, "final.mp4");
    await writeFile(storyboard, "Storyboard approved visually by reviewer");
    await writeFile(preview, "preview fixture");
    await writeFile(source, "editable fixture");
    await writeFile(qa, JSON.stringify({job_id: "test_job_001", passed: true}));
    await writeFile(final, "final fixture");
    await assert.rejects(publish(client, folder, "final", final), /Storyboard needs human approval/);
    await publish(client, folder, "storyboard", storyboard);
    await assert.rejects(publish(client, folder, "preview", preview), /Storyboard needs human approval/);
    await approve(client, folder, "storyboard");
    await publish(client, folder, "preview", preview);
    await assert.rejects(approve(client, folder, "final"), /passing QA required/);
    await publish(client, folder, "qa", qa);
    await approve(client, folder, "final");
    await assert.rejects(publish(client, folder, "final", final), /QA and editable source are required/);
    await publish(client, folder, "source", source);
    const done = await publish(client, folder, "final", final);
    assert.equal(done.state, "DELIVERED");
    assert.equal((await loadJob(client, folder)).manifest.approval.final_approved_by, "owner@example.com");
    await assert.rejects(publish(client, folder, "preview", preview), /immutable/);
  } finally {await rm(dir, {recursive: true, force: true});}
});
