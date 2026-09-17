import { randomUUID } from "node:crypto";
import { z } from "zod";
import {
  JobContextSchema,
  type JobContext
} from "./contracts.js";
import { MotionOrchestrator } from "./orchestrator.js";

export const MotionAttachmentSchema = z.object({
  name: z.string().min(1),
  path: z.string().default(""),
  mime_type: z.string().default("application/octet-stream"),
  source: z.string().default("user")
});
export type MotionAttachment = z.infer<typeof MotionAttachmentSchema>;

export const MotionCommandSchema = z.object({
  command: z.literal("@motion"),
  raw_message: z.string(),
  request: z.string(),
  mode: z.enum(["INTERACTIVE", "AUTONOMOUS", "CONTEXTUAL"]).default("CONTEXTUAL"),
  attachments: z.array(MotionAttachmentSchema).default([]),
  job_id: z.string().min(1),
  scene_id: z.string().min(1).default("scene_01")
});
export type MotionCommand = z.infer<typeof MotionCommandSchema>;

export type ParseMotionCommandOptions = {
  attachments?: MotionAttachment[];
  jobId?: string;
  sceneId?: string;
};

/**
 * Accepted forms:
 *
 * @motion
 * @motion quero animar esse dashboard
 * @motion --auto quero uma abertura premium
 * @motion --interactive quero explorar opções para esse logo
 */
export function parseMotionCommand(
  input: string,
  options: ParseMotionCommandOptions = {}
): MotionCommand | null {
  const trimmed = input.trim();
  const match = trimmed.match(/^@motion\b/i);
  if (!match) return null;

  let remainder = trimmed.slice(match[0].length).trim();
  let mode: MotionCommand["mode"] = "CONTEXTUAL";

  if (/^--auto\b/i.test(remainder)) {
    mode = "AUTONOMOUS";
    remainder = remainder.replace(/^--auto\b/i, "").trim();
  } else if (/^--interactive\b/i.test(remainder)) {
    mode = "INTERACTIVE";
    remainder = remainder.replace(/^--interactive\b/i, "").trim();
  }

  return MotionCommandSchema.parse({
    command: "@motion",
    raw_message: trimmed,
    request: remainder,
    mode,
    attachments: options.attachments ?? [],
    job_id: options.jobId ?? `motion_${randomUUID()}`,
    scene_id: options.sceneId ?? "scene_01"
  });
}

function extension(name: string): string {
  const part = name.split(".").pop();
  return part && part !== name ? part.toUpperCase() : "UNKNOWN";
}

export function createInitialContextFromCommand(command: MotionCommand): JobContext {
  const request = command.request.trim();
  const hasRequest = request.length > 0;
  const attachmentNames = command.attachments.map((attachment) => attachment.name);

  return JobContextSchema.parse({
    job_id: command.job_id,
    scene_id: command.scene_id,
    state: "INTAKE",
    brief: {
      job_id: command.job_id,
      objective: hasRequest
        ? request
        : "Discover the user's intent and define the motion project interactively",
      message: "",
      materials: attachmentNames,
      user_direction_level:
        command.mode === "AUTONOMOUS"
          ? hasRequest ? "HIGH" : "LOW"
          : hasRequest ? "MEDIUM" : "LOW"
    },
    assets: command.attachments.length
      ? {
          job_id: command.job_id,
          assets: command.attachments.map((attachment, index) => ({
            asset_id: `asset_${String(index + 1).padStart(3, "0")}`,
            name: attachment.name,
            type: extension(attachment.name),
            source: attachment.path || attachment.source,
            is_original_source: attachment.source === "user",
            can_reuse_directly: true,
            notes: `Received through ${command.command}`
          }))
        }
      : undefined,
    metadata: {
      invocation: {
        command: command.command,
        mode: command.mode,
        raw_message: command.raw_message,
        request: command.request
      },
      intake_policy: {
        max_questions_per_round: 4,
        suggest_directions_before_asking_how_to_animate: true,
        do_not_repeat_known_information: true
      }
    }
  });
}

export class MotionCommandGateway {
  constructor(private readonly orchestrator: MotionOrchestrator) {}

  canHandle(input: string): boolean {
    return /^\s*@motion\b/i.test(input);
  }

  async invoke(
    input: string,
    options: ParseMotionCommandOptions = {}
  ): Promise<JobContext> {
    const command = parseMotionCommand(input, options);
    if (!command) {
      throw new Error("Message is not a @motion command");
    }

    const initial = createInitialContextFromCommand(command);
    return this.orchestrator.run(initial);
  }
}
