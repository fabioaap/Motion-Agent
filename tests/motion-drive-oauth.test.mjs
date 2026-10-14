import test from "node:test";
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {createPkce,oauthLink,redeemCode,parseArguments} from "../bin/motion-drive-oauth.mjs";
test("OAuth URLs use loopback PKCE, state and exact consent scope", () => {
  const {verifier,challenge}=createPkce();
  assert.equal(createHash("sha256").update(verifier).digest("base64url"), challenge);
  const link=new URL(oauthLink({
    clientId:"test.apps.googleusercontent.com",
    redirectUri:"http://127.0.0.1:6543/oauth/callback",
    scope:"drive",challenge,state:"random123"
  }));
  assert.equal(link.searchParams.get("response_type"),"code");
  assert.equal(link.searchParams.get("state"),"random123");
  assert.equal(link.searchParams.get("scope"),"https://www.googleapis.com/auth/drive");
  assert.equal(link.searchParams.get("code_challenge_method"),"S256");
  assert.equal(link.searchParams.get("access_type"),"online");
  assert.throws(() => oauthLink({clientId:"x", redirectUri:"loopback", scope:"all", challenge:"x", state:"x"}),/Unsupported OAuth scope/);
});
test("token is obtained without persisting or printing it", async () => {
  const fakeFetch=async (url, options) => {
    assert.equal(url,"https://oauth2.googleapis.com/token");
    assert.equal(options.method,"POST");
    const body=new URLSearchParams(options.body);
    assert.equal(body.get("code_verifier"),"verifier");
    assert.equal(body.get("grant_type"),"authorization_code");
    return {ok:true,json:async()=>({access_token:"fake_token",expires_in:3600})};
  };
  const result=await redeemCode({clientId:"example",redirectUri:"http://127.0.0.1:3/oauth/callback",verifier:"verifier",code:"code",fetcher:fakeFetch});
  assert.equal(result.accessToken,"fake_token");
  await assert.rejects(()=>redeemCode({clientId:"example",redirectUri:"loopback",verifier:"x",code:"c",fetcher:async()=>({ok:false,status:403})}),/exchange failed/);
});
test("OAuth wrapper restricts argument delimiter and arbitrary Node flags", () => {
  assert.deepEqual(parseArguments(["--","status","--folder","123"]),["status","--folder","123"]);
  assert.throws(()=>parseArguments(["status","--folder","123"]),/after --/);
  assert.throws(()=>parseArguments(["--","-c","process.exit()"]),/Arbitrary Node execution/);
});
