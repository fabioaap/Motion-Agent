#!/usr/bin/env node
/**
 * Send ephemeral renders to Google Drive with user-authorized OAuth.
 * Files are private by default; no Actions Storage artifacts are created.
 */
import {createHash} from "node:crypto";
import {readFile, stat, appendFile} from "node:fs/promises";
import {basename, resolve} from "node:path";
import {pathToFileURL} from "node:url";
import {DriveClient} from "../bin/motion-drive.mjs";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const MAX_FILE_SIZE = 512 * 1024 * 1024;
const MIMES = Object.freeze({
  ".mp4": "video/mp4", ".webm": "video/webm", ".json": "application/json",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".svg": "image/svg+xml"
});
function assert(ok, msg) {if (!ok) throw new Error(msg);}

export async function refreshAccessToken({clientId, clientSecret, refreshToken, fetcher=globalThis.fetch}) {
  assert(clientId && clientSecret && refreshToken, "Missing Google OAuth secrets (client ID, client secret or refresh token)");
  const response = await fetcher(TOKEN_URL, {
    method: "POST",
    headers: {"Content-Type": "application/x-www-form-urlencoded"},
    body: new URLSearchParams({
      client_id: clientId, client_secret: clientSecret,
      refresh_token: refreshToken, grant_type: "refresh_token"
    }).toString()
  });
  // Never include response bodies, tokens or credentials in GitHub logs.
  assert(response.ok, "Google OAuth refresh failed: HTTP " + response.status + ". Check refresh token, publishing status and scopes.");
  const result = await response.json();
  assert(typeof result.access_token === "string" && result.access_token.length > 0, "Google OAuth did not return an access token");
  return result.access_token;
}

function mimeType(name) {
  const suffix = name.slice(name.lastIndexOf(".")).toLowerCase();
  assert(Object.hasOwn(MIMES, suffix), "Unsupported output format: " + suffix);
  return MIMES[suffix];
}
export function safeRunFolder({workflow, quality, runId, runAttempt}) {
  assert(/^[a-zA-Z0-9_]{3,70}$/.test(workflow), "Invalid workflow ID");
  assert(/^[a-zA-Z0-9_]{2,30}$/.test(quality), "Invalid output quality");
  assert(/^\d{3,30}$/.test(String(runId)), "Invalid GitHub run ID");
  assert(/^\d{1,5}$/.test(String(runAttempt)), "Invalid GitHub run attempt");
  return workflow + "-" + quality + "-run-" + runId + "-attempt-" + runAttempt;
}

export async function uploadBundle({client, parentFolderId, folderName, paths}) {
  assert(typeof parentFolderId === "string" && parentFolderId.trim(), "MOTION_OS_DRIVE_FOLDER_ID must be configured");
  assert(Array.isArray(paths) && paths.length > 0 && paths.length <= 30, "Select between 1 and 30 output files");
  const entries = [], seen = new Set();
  for (const path of paths) {
    const name = basename(path), type = mimeType(name);
    assert(!seen.has(name), "Duplicate output filename: " + name);
    seen.add(name);
    const meta = await stat(resolve(path));
    assert(meta.isFile() && meta.size > 0 && meta.size <= MAX_FILE_SIZE, "Invalid or oversized output: " + name);
    entries.push({path, name, type, size: meta.size});
  }
  // Check all output files before making any changes in the destination.
  const folder = await client.ensureFolder(parentFolderId, folderName);
  const files = [];
  for (const entry of entries) {
    const bytes = await readFile(resolve(entry.path));
    assert(bytes.length === entry.size, "Output changed during upload: " + entry.name);
    const checksum = createHash("sha256").update(bytes).digest("hex");
    const created = await client.createFile(folder, entry.name, bytes, entry.type);
    const info = await client.metadata(created.id);
    assert(String(info.size) === String(bytes.length) && info.description === "sha256:" + checksum,
      "Drive did not verify upload: " + entry.name);
    files.push({name: entry.name, file_id: created.id, size_bytes: bytes.length, sha256: checksum,
      url: created.webViewLink || info.webViewLink || null});
  }
  return {folder_id: folder, folder_url: "https://drive.google.com/drive/folders/" + folder, files};
}

export async function main(argv, env=process.env, fetcher=globalThis.fetch) {
  assert(env.MOTION_OS_DRIVE_FOLDER_ID, "Missing MOTION_OS_DRIVE_FOLDER_ID repository variable");
  const name = safeRunFolder({
    workflow: env.MOTION_WORKFLOW_ID, quality: env.MOTION_RENDER_QUALITY,
    runId: env.GITHUB_RUN_ID, runAttempt: env.GITHUB_RUN_ATTEMPT
  });
  const token = await refreshAccessToken({
    clientId: env.GOOGLE_OAUTH_CLIENT_ID, clientSecret: env.GOOGLE_OAUTH_CLIENT_SECRET,
    refreshToken: env.GOOGLE_OAUTH_REFRESH_TOKEN, fetcher
  });
  const result = await uploadBundle({
    client: new DriveClient(token, fetcher), parentFolderId: env.MOTION_OS_DRIVE_FOLDER_ID,
    folderName: name, paths: argv
  });
  console.log(JSON.stringify(result, null, 2));
  if (env.GITHUB_STEP_SUMMARY) {
    await appendFile(env.GITHUB_STEP_SUMMARY,
      "### Motion OS Google Drive delivery\n\n" + result.files.length
      + " files verified in [private Drive folder](" + result.folder_url
      + "). No GitHub Actions artifact was created.\n");
  }
  return result;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main(process.argv.slice(2)).catch(error => {
    console.error("Motion OS Drive delivery failed: " + error.message);
    process.exitCode = 1;
  });
}
