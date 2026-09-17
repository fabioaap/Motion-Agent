import {mkdtemp, rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import sharp from "sharp";
import {comparePngs, findRepoRoot, ingestAssets} from "../src/index.js";

const temp = await mkdtemp(join(tmpdir(), "motion-node-tools-"));
try {
  const reference = join(temp, "reference.png");
  const actual = join(temp, "actual.png");
  const diff = join(temp, "diff.png");
  await sharp({create: {width: 64, height: 64, channels: 4, background: {r: 10, g: 20, b: 30, alpha: 1}}}).png().toFile(reference);
  await sharp(reference).toFile(actual);
  const result = await comparePngs(reference, actual, diff);
  if (result.diffRatio !== 0) throw new Error(`Expected zero diff, got ${result.diffRatio}`);

  const root = await findRepoRoot();
  const ingested = await ingestAssets(
    "smoke_ingest",
    [join(root, "apps", "remotion-studio", "public", "demo", "dashboard.svg")],
    root
  );
  if (ingested.length !== 1 || !ingested[0]?.previewPath || !ingested[0]?.sha256) {
    throw new Error("Asset ingestion smoke test failed");
  }
  console.log(JSON.stringify({diff_ratio: result.diffRatio, ingested: ingested[0].publicSource}, null, 2));
} finally {
  await rm(temp, {recursive: true, force: true});
}
