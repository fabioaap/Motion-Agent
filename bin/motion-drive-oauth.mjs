#!/usr/bin/env node
/**
 * Short-lived Google Desktop OAuth consent for Motion OS.
 * No Google tokens, refresh tokens, client secrets or user files are written to disk.
 * Usage:
 *   GOOGLE_OAUTH_CLIENT_ID=... node bin/motion-drive-oauth.mjs -- doctor
 *   GOOGLE_OAUTH_CLIENT_ID=... node bin/motion-drive-oauth.mjs -- init --manifest job.json --parent FOLDER_ID
 *
 * Requires a Google Cloud OAuth client of application type "Desktop app".
 * Scopes are intentionally explicit. The current pre-existing Motion OS Drive folder
 * requires the user's consent to broad 'drive' scope until Drive Picker is supported.
 */
import {createHash, randomBytes} from "node:crypto";
import {createServer} from "node:http";
import {spawn} from "node:child_process";
import {dirname, join, resolve} from "node:path";
import {fileURLToPath} from "node:url";
const SELF = dirname(fileURLToPath(import.meta.url));
const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const DRIVE_SCOPES = Object.freeze({
  "drive": "https://www.googleapis.com/auth/drive",
  "drive.file": "https://www.googleapis.com/auth/drive.file",
  "drive.readonly": "https://www.googleapis.com/auth/drive.readonly"
});
export const createPkce = () => {
  const verifier = randomBytes(48).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return {verifier, challenge};
};
export function oauthLink({clientId, redirectUri, scope, challenge, state}) {
  if (!clientId || !redirectUri || !challenge || !state) throw new Error("OAuth parameters missing");
  if (!Object.hasOwn(DRIVE_SCOPES, scope)) throw new Error("Unsupported OAuth scope");
  const url = new URL(AUTH_URL);
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", DRIVE_SCOPES[scope]);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("state", state);
  url.searchParams.set("access_type", "online");
  url.searchParams.set("include_granted_scopes", "false");
  return url.toString();
}
export async function redeemCode({clientId, clientSecret, redirectUri, verifier, code, fetcher = globalThis.fetch}) {
  if (![clientId, redirectUri, verifier, code].every(Boolean)) throw new Error("OAuth code exchange incomplete");
  const body = new URLSearchParams({
    client_id: clientId, redirect_uri: redirectUri, code,
    code_verifier: verifier, grant_type: "authorization_code"
  });
  if (clientSecret) body.set("client_secret", clientSecret);
  const response = await fetcher(TOKEN_URL, {
    method: "POST", headers: {"Content-Type": "application/x-www-form-urlencoded"},
    body: body.toString()
  });
  if (!response.ok) throw new Error("OAuth token exchange failed (HTTP " + response.status + ")");
  const data = await response.json();
  if (typeof data.access_token !== "string" || !data.access_token) throw new Error("Google did not return an access token");
  return {accessToken: data.access_token, expiresIn: data.expires_in};
}
export function parseArguments(argv) {
  const sep = argv.indexOf("--");
  if (sep < 0 || sep === argv.length - 1) throw new Error("Pass a Motion OS command after -- (for example: -- status --folder ID)");
  const cmdArgs = argv.slice(sep + 1);
  if (cmdArgs.some(x => ["-c", "--eval", "--require"].includes(x))) throw new Error("Arbitrary Node execution is not supported");
  return cmdArgs;
}
export async function authorize({clientId, clientSecret, scope, port = 0, timeoutMs = 180000}) {
  if (!clientId || !clientId.endsWith(".apps.googleusercontent.com")) throw new Error("Set GOOGLE_OAUTH_CLIENT_ID from Google Cloud Desktop OAuth credentials");
  if (!Object.hasOwn(DRIVE_SCOPES, scope)) throw new Error("Set GOOGLE_DRIVE_SCOPE to drive, drive.readonly, or drive.file");
  const {verifier, challenge} = createPkce();
  const state = randomBytes(32).toString("base64url");
  let resolveGrant;
  let rejectGrant;
  const grant = new Promise((resolve, reject) => {resolveGrant = resolve; rejectGrant = reject;});
  let settled = false;
  const server = createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://127.0.0.1");
    if (url.pathname !== "/oauth/callback") {
      res.writeHead(404, {"Content-Type": "text/plain"}); res.end("Not found"); return;
    }
    const incomingState = url.searchParams.get("state");
    if (incomingState !== state) {
      res.writeHead(403, {"Content-Type": "text/plain"}); res.end("OAuth state mismatch"); return;
    }
    const error = url.searchParams.get("error");
    const code = url.searchParams.get("code");
    if (error || !code) {
      res.writeHead(400, {"Content-Type": "text/plain"}); res.end("Access not granted");
      if (!settled) {settled = true; rejectGrant(new Error("Google consent was denied or cancelled"));}
      return;
    }
    res.writeHead(200, {"Content-Type": "text/html; charset=utf-8","Cache-Control":"no-store"});
    res.end("<!doctype html><html lang=\"pt-BR\"><meta charset=\"utf-8\"><title>Motion OS</title><body>Autorização recebida. Você pode fechar esta janela e voltar ao terminal.</body></html>");
    if (!settled) {settled = true; resolveGrant(code);}
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", resolve);
  });
  const address = server.address();
  const redirectUri = "http://127.0.0.1:" + address.port + "/oauth/callback";
  const timer = setTimeout(() => {
    if (!settled) {settled = true; rejectGrant(new Error("OAuth timeout; login must be completed within three minutes"));}
  }, timeoutMs);
  try {
    console.error("Open this Google OAuth URL in the browser on this computer:\n" + oauthLink({clientId,redirectUri,scope,challenge,state}));
    if (scope === "drive") console.error("IMPORTANT: This grants broad Drive file access for this one session; review the consent screen.");
    const code = await grant;
    return redeemCode({clientId,clientSecret,redirectUri,verifier,code});
  } finally {
    clearTimeout(timer);
    server.close();
  }
}
async function main(argv) {
  const cmdArgs = parseArguments(argv);
  // doctor does not need any Google credentials.
  if (cmdArgs[0] === "doctor") {
    return new Promise((resolve, reject) => {
      const child = spawn(process.execPath,[join(SELF,"motion-drive.mjs"),...cmdArgs],{stdio:"inherit"});
      child.on("exit", code => code === 0 ? resolve() : reject(new Error("Motion doctor failed")));
      child.on("error", reject);
    });
  }
  const scope = process.env.GOOGLE_DRIVE_SCOPE ?? "drive";
  const {accessToken} = await authorize({
    clientId: process.env.GOOGLE_OAUTH_CLIENT_ID,
    clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    scope
  });
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath,[join(SELF,"motion-drive.mjs"),...cmdArgs],{
      env:{...process.env, GOOGLE_DRIVE_ACCESS_TOKEN:accessToken},
      stdio:"inherit"
    });
    child.on("error",reject);
    child.on("exit",(code) => code === 0 ? resolve() : reject(new Error("Motion Drive command exited with code " + code)));
  });
}
if (process.argv[1] && import.meta.url === new URL("file://" + resolve(process.argv[1])).href) {
  main(process.argv.slice(2)).catch(e => {console.error("Motion OS OAuth: " + e.message); process.exitCode=1;});
}
