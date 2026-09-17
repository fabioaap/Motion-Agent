import {createHash} from "node:crypto";
import {access, copyFile, mkdir, readFile} from "node:fs/promises";
import {basename, dirname, extname, join, resolve} from "node:path";
import sharp from "sharp";
import {
  JobContextSchema,
  type JobContext,
  type MotionAttachment
} from "@motion-agent/runtime";

export type IngestedAsset = {
  originalPath: string;
  absolutePublicPath: string;
  publicSource: string;
  previewPath: string | null;
  attachment: MotionAttachment;
  sha256: string;
  width: number | null;
  height: number | null;
  hasTransparency: boolean;
  type: string;
};

export async function findRepoRoot(start = process.cwd()): Promise<string> {
  let current = resolve(start);
  while (true) {
    try {
      await access(join(current, "pnpm-workspace.yaml"));
      return current;
    } catch {
      const parent = dirname(current);
      if (parent === current) throw new Error("Could not locate Motion-Agent workspace root");
      current = parent;
    }
  }
}

function safeFileName(value: string): string {
  const clean = value.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
  return clean || "asset";
}

function assetType(filePath: string): string {
  const ext = extname(filePath).slice(1).toUpperCase();
  if (ext === "JPEG") return "JPG";
  return ext || "UNKNOWN";
}

function mimeFor(type: string): string {
  const value = type.toUpperCase();
  if (value === "PNG") return "image/png";
  if (value === "JPG" || value === "JPEG") return "image/jpeg";
  if (value === "WEBP") return "image/webp";
  if (value === "GIF") return "image/gif";
  if (value === "SVG") return "image/svg+xml";
  if (value === "MP4") return "video/mp4";
  if (value === "WEBM") return "video/webm";
  return "application/octet-stream";
}

function isSharpReadable(type: string): boolean {
  return ["PNG", "JPG", "JPEG", "WEBP", "GIF", "SVG", "AVIF", "TIFF"].includes(type.toUpperCase());
}

export async function ingestAssets(
  jobId: string,
  inputPaths: string[],
  repoRoot = process.cwd()
): Promise<IngestedAsset[]> {
  const root = await findRepoRoot(repoRoot);
  const publicDir = join(root, "apps", "remotion-studio", "public", "jobs", safeFileName(jobId));
  await mkdir(publicDir, {recursive: true});

  const results: IngestedAsset[] = [];
  for (const [index, input] of inputPaths.entries()) {
    const originalPath = resolve(input);
    const originalName = safeFileName(basename(originalPath));
    const fileName = `${String(index + 1).padStart(2, "0")}-${originalName}`;
    const destination = join(publicDir, fileName);
    await copyFile(originalPath, destination);

    const bytes = await readFile(destination);
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    const type = assetType(destination);
    let width: number | null = null;
    let height: number | null = null;
    let hasTransparency = false;
    let previewPath: string | null = null;

    if (isSharpReadable(type)) {
      const metadata = await sharp(destination).metadata();
      width = metadata.width ?? null;
      height = metadata.height ?? null;
      hasTransparency = metadata.hasAlpha ?? false;
      if (type === "SVG") {
        previewPath = `${destination}.preview.png`;
        await sharp(destination, {density: 144})
          .resize({width: 1600, withoutEnlargement: true})
          .png()
          .toFile(previewPath);
      } else {
        previewPath = destination;
      }
    }

    const publicSource = `jobs/${safeFileName(jobId)}/${fileName}`;
    results.push({
      originalPath,
      absolutePublicPath: destination,
      publicSource,
      previewPath,
      attachment: {
        name: fileName,
        path: publicSource,
        mime_type: mimeFor(type),
        source: "user"
      },
      sha256,
      width,
      height,
      hasTransparency,
      type
    });
  }
  return results;
}

export function applyIngestedAssetMetadata(context: JobContext, ingested: IngestedAsset[]): JobContext {
  const next = structuredClone(context);
  const assets = next.assets?.assets ?? [];
  for (const [index, item] of ingested.entries()) {
    const asset = assets[index];
    if (!asset) continue;
    asset.source = item.publicSource;
    asset.width = item.width;
    asset.height = item.height;
    asset.has_transparency = item.hasTransparency;
    asset.is_original_source = true;
    asset.can_reuse_directly = true;
    asset.notes = `sha256=${item.sha256}; original=${item.originalPath}`;
  }
  next.metadata = {
    ...next.metadata,
    asset_preview_paths: ingested.map((item) => item.previewPath).filter((value): value is string => Boolean(value)),
    ingested_assets: ingested.map((item, index) => ({
      asset_id: assets[index]?.asset_id ?? `asset_${index + 1}`,
      original_path: item.originalPath,
      public_source: item.publicSource,
      sha256: item.sha256,
      width: item.width,
      height: item.height,
      type: item.type
    }))
  };
  return JobContextSchema.parse(next);
}
