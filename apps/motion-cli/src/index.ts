import {randomUUID} from "node:crypto";
import {mkdir, writeFile} from "node:fs/promises";
import {dirname, join, resolve} from "node:path";
import {
  MotionOrchestrator,
  createInitialContextFromCommand,
  createSceneJob,
  parseMotionCommand,
  type JobContext
} from "@motion-agent/runtime";
import {createOpenAIAgentRegistry} from "@motion-agent/openai-agents";
import {
  applyIngestedAssetMetadata,
  createRemotionPreviewHook,
  findRepoRoot,
  ingestAssets,
  renderSceneVideo
} from "@motion-agent/node-tools";

type CliOptions = {
  command: string;
  assets: string[];
  approve: boolean;
  output: string | null;
  model: string | null;
  maxDiffRatio: number | null;
};

function parseArgs(args: string[]): CliOptions {
  const assets: string[] = [];
  const commandParts: string[] = [];
  let approve = false;
  let output: string | null = null;
  let model: string | null = null;
  let maxDiffRatio: number | null = null;

  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];
    if (value === "--asset") {
      const next = args[++index];
      if (!next) throw new Error("--asset requires a path");
      assets.push(next);
      continue;
    }
    if (value === "--approve") {
      approve = true;
      continue;
    }
    if (value === "--out") {
      const next = args[++index];
      if (!next) throw new Error("--out requires a path");
      output = next;
      continue;
    }
    if (value === "--model") {
      const next = args[++index];
      if (!next) throw new Error("--model requires a model name");
      model = next;
      continue;
    }
    if (value === "--max-diff") {
      const next = Number(args[++index]);
      if (!Number.isFinite(next) || next < 0 || next > 1) throw new Error("--max-diff must be between 0 and 1");
      maxDiffRatio = next;
      continue;
    }
    commandParts.push(value);
  }

  const command = commandParts.join(" ").trim();
  if (!command.toLowerCase().startsWith("@motion")) {
    throw new Error("The command must start with @motion");
  }
  return {command, assets, approve, output, model, maxDiffRatio};
}

async function persistContext(root: string, context: JobContext): Promise<string> {
  const safeJob = context.job_id.replace(/[^a-zA-Z0-9._-]+/g, "-");
  const target = join(root, "apps", "remotion-studio", "jobs", "generated", `${safeJob}.context.json`);
  await mkdir(dirname(target), {recursive: true});
  await writeFile(target, `${JSON.stringify(context, null, 2)}\n`, "utf8");
  return target;
}

const options = parseArgs(process.argv.slice(2));
const root = await findRepoRoot();
const jobId = `motion_${randomUUID()}`;
const ingested = await ingestAssets(jobId, options.assets, root);
const parsedCommand = parseMotionCommand(options.command, {
  jobId,
  attachments: ingested.map((item) => item.attachment)
});
if (!parsedCommand) throw new Error("Could not parse @motion command");

let initial = createInitialContextFromCommand(parsedCommand);
initial = applyIngestedAssetMetadata(initial, ingested);

const registry = createOpenAIAgentRegistry({
  model: options.model ?? undefined
});
const previewHook = createRemotionPreviewHook({
  repoRoot: root,
  maxDiffRatio: options.maxDiffRatio ?? Number(process.env.MOTION_VISUAL_MAX_DIFF ?? 0.005)
});
const orchestrator = new MotionOrchestrator(registry, {
  requireHumanApproval: true,
  previewHook,
  maxQaCycles: Number(process.env.MOTION_MAX_QA_CYCLES ?? 6),
  maxEquivalentFailures: Number(process.env.MOTION_MAX_EQUIVALENT_FAILURES ?? 3)
});

let context = await orchestrator.run(initial);
let previewVideo: string | null = null;

if (["READY_FOR_HUMAN", "HUMAN_APPROVED", "DELIVERED"].includes(context.state)) {
  const scene = createSceneJob(context);
  const defaultOutput = join(root, "apps", "remotion-studio", "out", "jobs", `${jobId}-preview.mp4`);
  previewVideo = await renderSceneVideo(scene, options.output ? resolve(options.output) : defaultOutput, root);
}

if (options.approve && context.state === "READY_FOR_HUMAN") {
  context = await orchestrator.approveAndRender(context);
}

const contextPath = await persistContext(root, context);
const visual = context.metadata.visual_qa && typeof context.metadata.visual_qa === "object"
  ? context.metadata.visual_qa as Record<string, unknown>
  : null;

console.log(JSON.stringify({
  job_id: context.job_id,
  state: context.state,
  qa_cycle: context.metadata.qa_cycle ?? null,
  preview_video: previewVideo,
  context_file: contextPath,
  visual_qa: visual ? {
    diff_ratio: visual.diff_ratio ?? null,
    threshold: visual.threshold ?? null,
    reference_path: visual.reference_path ?? null,
    actual_path: visual.actual_path ?? null,
    diff_path: visual.diff_path ?? null
  } : null,
  open_issues: context.open_issues.map((issue) => ({
    id: issue.issue_id,
    category: issue.category,
    severity: issue.severity,
    observation: issue.observed
  }))
}, null, 2));
