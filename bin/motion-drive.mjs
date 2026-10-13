#!/usr/bin/env node
/**
 * Motion OS Drive first worker entrypoint. No Git checkout is required for a client job.
 * Runtime prerequisites: Node 22+, a short lived OAuth access token scoped to Drive.
 * This module never executes downloaded scripts or makes files public.
 */
import {createHash} from "node:crypto";
import {readFile, writeFile, mkdir} from "node:fs/promises";
import {basename, extname, join, resolve} from "node:path";
import {spawnSync} from "node:child_process";
import {pathToFileURL} from "node:url";

const API = "https://www.googleapis.com/drive/v3";
const UPLOAD = "https://www.googleapis.com/upload/drive/v3";
const FOLDER_MIME = "application/vnd.google-apps.folder";
const STATES = new Set(["DRAFT", "WAITING_STORYBOARD_APPROVAL", "STORYBOARD_APPROVED", "QUALITY_REVIEW", "READY_FOR_HUMAN", "FINAL_APPROVED", "DELIVERED"]);
const MIME_JSON = "application/json";
const STAGE_FOLDER = {storyboard: "02_storyboard", preview: "03_previews", final: "04_finals", source: "05_sources", qa: "06_qa"};
const MAX_ASSET_BYTES = 150 * 1024 * 1024;

function assert(ok, message) { if (!ok) throw new Error(message); }
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
function safeName(value) {
  assert(typeof value === "string" && value.trim().length > 0, "Filename is required");
  const name = value.normalize("NFKC").replace(/[^a-zA-Z0-9._-]/g, "_").replace(/^\.+/, "_");
  assert(name.length > 0 && name !== "." && name !== "..", "Unsafe filename");
  return name.slice(0, 140);
}
function requiredText(obj, key) { assert(typeof obj?.[key] === "string" && obj[key].trim(), "Missing required field: " + key); }
function inputHasPin(input) { return Boolean(input.checksum || input.expected_version); }
export function validateManifest(m) {
  assert(m && typeof m === "object", "Manifest must be an object");
  assert(m.schema_version === "motion-job.v1", "Unsupported schema_version");
  for (const key of ["job_id", "brand_id", "project_name", "state"]) requiredText(m, key);
  assert(/^[a-z0-9][a-z0-9_-]{2,63}$/.test(m.job_id), "Unsafe job_id");
  assert(/^[a-z0-9][a-z0-9_-]{1,63}$/.test(m.brand_id), "Unsafe brand_id");
  assert(STATES.has(m.state) || m.state.startsWith("BLOCKED_"), "Invalid job state");
  for (const key of ["objective", "audience", "message", "cta"]) requiredText(m.brief, key);
  assert(Array.isArray(m.deliverables) && m.deliverables.length, "At least one deliverable is required");
  for (const d of m.deliverables) {
    assert(["9:16", "16:9", "1:1", "4:5"].includes(d.aspect_ratio), "Unsupported aspect_ratio");
    assert(Number.isInteger(d.fps) && d.fps > 0 && Number.isInteger(d.width) && d.width > 0 && Number.isInteger(d.height) && d.height > 0 && d.duration_seconds > 0, "Invalid deliverable dimensions, fps or duration");
  }
  requiredText(m.brand, "drive_folder_id");
  assert(Array.isArray(m.brand.logo_file_ids) && m.brand.logo_file_ids.length, "Brand must reference original logo files");
  requiredText(m.brand, "palette_reference");
  requiredText(m.brand, "typography_reference");
  assert(Array.isArray(m.inputs) && m.inputs.length, "No source assets supplied");
  const sources = new Set();
  for (const input of m.inputs) {
    for (const key of ["role", "drive_file_id", "mime_type", "rights_status"]) requiredText(input, key);
    assert(["owned", "licensed", "authorized"].includes(input.rights_status), "Asset rights unconfirmed: " + input.role);
    assert(inputHasPin(input), "Input must pin checksum or expected_version: " + input.role);
    assert(!sources.has(input.drive_file_id), "Duplicate input Drive file id");
    sources.add(input.drive_file_id);
  }
  for (const id of m.brand.logo_file_ids) assert(sources.has(id), "Original logo is not included in inputs: " + id);
  assert(m.creative?.storyboard_required === true, "Storyboard approval cannot be disabled");
  assert(["auto", "remotion", "human-motion-design"].includes(m.engine?.preferred), "Unsupported engine");
  assert(m.approval && typeof m.approval === "object", "Approval fields missing");
  assert(m.output && typeof m.output === "object", "Output fields missing");
  return m;
}

export class DriveClient {
  constructor(token, fetcher = globalThis.fetch) {
    assert(typeof token === "string" && token.trim(), "Set GOOGLE_DRIVE_ACCESS_TOKEN from an authorized Google OAuth session");
    this.token = token;
    this.fetcher = fetcher;
  }
  async request(path, {method = "GET", body, contentType, raw = false} = {}) {
    let result;
    for (let attempt = 0; attempt < 3; attempt++) {
      result = await this.fetcher(path.startsWith("https://") ? path : API + path, {
        method,
        headers: {Authorization: "Bearer " + this.token, ...(contentType ? {"Content-Type": contentType} : {})},
        body
      });
      if (![429, 500, 502, 503, 504].includes(result.status) || attempt === 2) break;
      await new Promise((r) => setTimeout(r, 250 * (2 ** attempt)));
    }
    if (!result.ok) throw new Error("Drive API failed: HTTP " + result.status + " (" + method + ")"); // never expose tokens or private API messages
    if (raw) return Buffer.from(await result.arrayBuffer());
    return result.status === 204 ? {} : result.json();
  }
  async list(parent, name) {
    const quote = (v) => v.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
    const q = "'" + quote(parent) + "' in parents and name = '" + quote(name) + "' and trashed = false";
    const params = new URLSearchParams({q, fields: "nextPageToken,files(id,name,mimeType,description,version,webViewLink)", pageSize: "100"});
    return (await this.request("/files?" + params)).files || [];
  }
  async metadata(id) {
    return this.request("/files/" + encodeURIComponent(id) + "?fields=id,name,mimeType,size,version,webViewLink,description,parents");
  }
  async ensureFolder(parent, name) {
    const matches = await this.list(parent, name);
    assert(matches.every((f) => f.mimeType === FOLDER_MIME), "Name occupied by a non-folder: " + name);
    assert(matches.length <= 1, "Duplicate job folders: " + name);
    if (matches.length) return matches[0].id;
    const created = await this.request("/files?fields=id,name", {method: "POST", contentType: MIME_JSON, body: JSON.stringify({name, mimeType: FOLDER_MIME, parents: [parent]})});
    return created.id;
  }
  async createFile(parent, name, bytes, mimeType = "application/octet-stream") {
    const checksum = hash(bytes);
    const matches = await this.list(parent, name);
    assert(matches.length <= 1, "Multiple files already use name " + name);
    if (matches.length) {
      assert(matches[0].description === "sha256:" + checksum, "Existing file differs: " + name + " (non-destructive upload blocked)");
      return matches[0];
    }
    const boundary = "motion_" + checksum.slice(0, 24);
    const metadata = {name, parents: [parent], mimeType, description: "sha256:" + checksum};
    const header = Buffer.from("--" + boundary + "\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n" + JSON.stringify(metadata) + "\r\n--" + boundary + "\r\nContent-Type: " + mimeType + "\r\n\r\n");
    const footer = Buffer.from("\r\n--" + boundary + "--\r\n");
    return this.request(UPLOAD + "/files?uploadType=multipart&fields=id,name,mimeType,webViewLink,description", {method: "POST", contentType: "multipart/related; boundary=" + boundary, body: Buffer.concat([header, bytes, footer])});
  }
  async replaceManifest(fileId, manifest) {
    return this.request(UPLOAD + "/files/" + encodeURIComponent(fileId) + "?uploadType=media&fields=id,version", {method: "PATCH", contentType: MIME_JSON, body: Buffer.from(JSON.stringify(manifest, null, 2) + "\n")});
  }
  async download(id) { return this.request("/files/" + encodeURIComponent(id) + "?alt=media", {raw: true}); }
  async about() { return this.request("/about?fields=user(emailAddress,displayName)"); }
}

export async function loadJob(client, folder) {
  const matches = await client.list(folder, "motion-job.json");
  assert(matches.length === 1, "Expected one motion-job.json in job folder");
  const manifest = validateManifest(JSON.parse((await client.download(matches[0].id)).toString("utf8")));
  assert(manifest.job_folder_id === folder, "Job folder does not match manifest");
  return {manifest, fileId: matches[0].id};
}
export async function initJob(client, parent, manifest) {
  validateManifest(manifest);
  assert(manifest.state === "DRAFT", "Job must start in DRAFT");
  const folder = await client.ensureFolder(parent, safeName(manifest.job_id));
  const sections = {};
  for (const name of ["01_inputs", ...Object.values(STAGE_FOLDER)]) sections[name] = await client.ensureFolder(folder, name);
  const existing = await client.list(folder, "motion-job.json");
  if (existing.length) {
    const old = await loadJob(client, folder);
    assert(old.manifest.job_id === manifest.job_id && old.manifest.brand_id === manifest.brand_id, "Folder already belongs to another job");
    return {folder, manifest: old.manifest, reused: true};
  }
  const next = {...manifest, job_folder_id: folder, folders: sections, output: {...manifest.output, drive_folder_id: sections["04_finals"], storyboard_file_ids: [], preview_file_ids: [], final_file_ids: []}};
  await client.createFile(folder, "motion-job.json", Buffer.from(JSON.stringify(next, null, 2) + "\n"), MIME_JSON);
  return {folder, manifest: next, reused: false};
}
export async function auditAndPull(client, manifest, target) {
  validateManifest(manifest);
  const workspace = join(resolve(target), safeName(manifest.job_id));
  await mkdir(workspace, {recursive: true});
  const report = {job_id: manifest.job_id, passed: true, assets: [], blockers: []};
  for (let i = 0; i < manifest.inputs.length; i++) {
    const item = manifest.inputs[i];
    try {
      const meta = await client.metadata(item.drive_file_id);
      assert(meta.mimeType === item.mime_type, "MIME type mismatch for " + item.role);
      if (item.expected_version) assert(String(meta.version) === String(item.expected_version), "Version mismatch for " + item.role);
      assert(Number(meta.size || 0) <= MAX_ASSET_BYTES, "Asset too large for local pull");
      const bytes = await client.download(item.drive_file_id);
      assert(bytes.length <= MAX_ASSET_BYTES, "Asset too large");
      const checksum = hash(bytes);
      if (item.checksum) assert(checksum === item.checksum.replace(/^sha256:/, ""), "SHA256 mismatch for " + item.role);
      if (item.expected_version) {
        const after = await client.metadata(item.drive_file_id);
        assert(String(meta.version) === String(after.version), "Asset changed during download");
      }
      const localFile = String(i + 1).padStart(3, "0") + "_" + safeName(item.role) + "_" + safeName(meta.name || item.drive_file_id);
      await writeFile(join(workspace, localFile), bytes, {flag: "wx"}).catch(async (e) => {
        if (e.code !== "EEXIST") throw e;
        const existing = await readFile(join(workspace, localFile));
        assert(hash(existing) === checksum, "Workspace file differs; refusing overwrite: " + localFile);
      });
      report.assets.push({role: item.role, name: localFile, sha256: checksum, drive_file_id: item.drive_file_id});
    } catch (e) { report.passed = false; report.blockers.push({role: item.role, reason: e.message}); }
  }
  report.state = report.passed ? "ASSET_AUDIT_PASSED" : "BLOCKED_MISSING_ASSETS";
  await writeFile(join(workspace, "audit.json"), JSON.stringify(report, null, 2) + "\n");
  if (report.passed) await writeFile(join(workspace, "motion-job.json"), JSON.stringify(manifest, null, 2) + "\n");
  return {workspace, report};
}
export async function publish(client, folder, stage, path) {
  assert(stage in STAGE_FOLDER, "Unknown delivery stage");
  const {manifest, fileId} = await loadJob(client, folder);
  assert(manifest.state !== "DELIVERED", "Delivered jobs are immutable");
  if (stage === "preview" || stage === "qa" || stage === "source" || stage === "final") {
    assert(manifest.approval.storyboard_approved_by, "Storyboard needs human approval");
  }
  if (stage === "qa") assert(manifest.output.preview_file_ids?.length, "Upload preview before QA");
  if (stage === "final") {
    assert(manifest.state === "FINAL_APPROVED" && manifest.approval.final_approved_by, "Final approval missing");
    assert(manifest.output.QA_report_id && manifest.output.source_archive_id, "QA and editable source are required");
  }
  const bytes = await readFile(resolve(path));
  const name = safeName(basename(path));
  if (stage === "qa") {
    const qa = JSON.parse(bytes.toString("utf8"));
    assert(qa.job_id === manifest.job_id && qa.passed === true, "QA report must pass and match job");
  }
  const dir = manifest.folders[STAGE_FOLDER[stage]];
  assert(dir, "Job stage folder missing");
  const result = await client.createFile(dir, name, bytes, stage === "qa" ? MIME_JSON : "application/octet-stream");
  const updated = structuredClone(manifest);
  if (stage === "storyboard") {
    updated.output.storyboard_file_ids ??= [];
    if (!updated.output.storyboard_file_ids.includes(result.id)) updated.output.storyboard_file_ids.push(result.id);
    updated.state = "WAITING_STORYBOARD_APPROVAL";
  } else if (stage === "preview") {
    updated.output.preview_file_ids ??= [];
    if (!updated.output.preview_file_ids.includes(result.id)) updated.output.preview_file_ids.push(result.id);
    updated.state = "QUALITY_REVIEW";
  } else if (stage === "qa") {
    updated.output.QA_report_id = result.id;
    updated.state = "READY_FOR_HUMAN";
  } else if (stage === "source") updated.output.source_archive_id = result.id;
  else if (stage === "final") {
    updated.output.final_file_ids ??= [];
    if (!updated.output.final_file_ids.includes(result.id)) updated.output.final_file_ids.push(result.id);
    updated.state = "DELIVERED";
  }
  await client.replaceManifest(fileId, updated);
  return {job_id: updated.job_id, state: updated.state, file_id: result.id, url: result.webViewLink || null};
}
export async function approve(client, folder, stage) {
  assert(["storyboard", "final"].includes(stage), "Approval stage must be storyboard or final");
  const {manifest, fileId} = await loadJob(client, folder);
  const info = await client.about();
  const actor = info.user?.emailAddress;
  assert(actor && actor.includes("@"), "Could not establish approver identity from Drive OAuth");
  const updated = structuredClone(manifest);
  if (stage === "storyboard") {
    assert(manifest.state === "WAITING_STORYBOARD_APPROVAL" && manifest.output.storyboard_file_ids?.length, "Storyboard files must exist before approval");
    updated.approval.storyboard_approved_by = actor;
    updated.approval.storyboard_approved_at = new Date().toISOString();
    updated.state = "STORYBOARD_APPROVED";
  } else {
    assert(manifest.state === "READY_FOR_HUMAN" && manifest.output.QA_report_id && manifest.output.preview_file_ids?.length, "Preview and passing QA required before final approval");
    updated.approval.final_approved_by = actor;
    updated.approval.final_approved_at = new Date().toISOString();
    updated.state = "FINAL_APPROVED";
  }
  await client.replaceManifest(fileId, updated);
  return {job_id: updated.job_id, state: updated.state, approved_by: actor};
}
function options(args) {
  const positional = [];
  const flags = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--")) {
      const k = args[i].slice(2);
      assert(["manifest", "parent", "folder", "out", "stage", "file"].includes(k), "Unknown flag: " + k);
      flags[k] = args[++i];
      assert(flags[k] && !flags[k].startsWith("--"), "Missing value for --" + k);
    } else positional.push(args[i]);
  }
  return {command: positional[0] || "help", flags, extra: positional.slice(1)};
}
async function main(args) {
  const {command, flags, extra} = options(args);
  if (command === "doctor") {
    const check = (name, argv = ["--version"]) => {
      const r = spawnSync(name, argv, {encoding: "utf8", shell: false});
      return {available: r.status === 0, version: (r.stdout || "").trim().split("\n")[0] || null};
    };
    const checks = {node: process.version, pnpm: check("pnpm"), ffmpeg: check("ffmpeg", ["-version"]), chromium: check("chromium"), drive_oauth_token_present: Boolean(process.env.GOOGLE_DRIVE_ACCESS_TOKEN)};
    console.log(JSON.stringify(checks, null, 2));
    return;
  }
  if (command === "help") {
    console.log("Motion OS Drive adapter (Node 22+)\n  doctor\n  init --manifest job.json --parent DRIVE_FOLDER_ID\n  pull --folder JOB_FOLDER_ID --out ./workspace\n  push --folder JOB_FOLDER_ID --stage storyboard|preview|qa|source|final --file PATH\n  approve --folder JOB_FOLDER_ID --stage storyboard|final\n  status --folder JOB_FOLDER_ID\nSet GOOGLE_DRIVE_ACCESS_TOKEN in the environment. Job folders do not need Git.");
    return;
  }
  const client = new DriveClient(process.env.GOOGLE_DRIVE_ACCESS_TOKEN);
  let result;
  if (command === "init") result = await initJob(client, flags.parent, JSON.parse(await readFile(resolve(flags.manifest), "utf8")));
  else if (command === "pull") {
    const {manifest} = await loadJob(client, flags.folder);
    result = await auditAndPull(client, manifest, flags.out);
    if (!result.report.passed) process.exitCode = 2;
  } else if (command === "status") result = (await loadJob(client, flags.folder)).manifest;
  else if (command === "push") result = await publish(client, flags.folder, flags.stage, flags.file);
  else if (command === "approve") result = await approve(client, flags.folder, flags.stage);
  else throw new Error("Unknown command: " + command);
  console.log(JSON.stringify(result, null, 2));
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main(process.argv.slice(2)).catch((err) => {console.error("Motion OS: " + err.message); process.exitCode = 1;});
}
