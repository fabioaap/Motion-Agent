import type {AgentHandler, AgentResult} from "./agents.js";
import {JobContextSchema, type JobContext, type QAIssue, type QAReport} from "./contracts.js";

type VisualQARecord = {
  diff_ratio?: unknown;
  threshold?: unknown;
  identity_mismatches?: unknown;
  reference_path?: unknown;
  actual_path?: unknown;
  diff_path?: unknown;
};

function visualRecord(context: JobContext): VisualQARecord | null {
  const raw = context.metadata.visual_qa;
  if (!raw || typeof raw !== "object") return null;
  return raw as VisualQARecord;
}

export class VisualFidelityCriticHandler implements AgentHandler {
  readonly name = "visual_fidelity_critic" as const;

  async run(context: JobContext): Promise<AgentResult> {
    const visual = visualRecord(context);
    const issues: QAIssue[] = [];

    if (!visual) {
      issues.push({
        issue_id: `visual_fidelity:${context.scene_id}:missing_evidence`,
        scene_id: context.scene_id,
        frame_start: null,
        frame_end: null,
        category: "FIDELITY",
        severity: "CRITICAL",
        element_id: null,
        expected: "Visual QA evidence generated after preview render",
        observed: "Visual QA metadata is missing",
        responsible_agent: "remotion_specialist",
        recommended_action: "Render reference and actual QA frames before visual review",
        blocks_delivery: true
      });
    } else {
      const mismatches = Array.isArray(visual.identity_mismatches)
        ? visual.identity_mismatches.map(String)
        : [];
      if (mismatches.length > 0) {
        issues.push({
          issue_id: `visual_fidelity:${context.scene_id}:asset_identity`,
          scene_id: context.scene_id,
          frame_start: 0,
          frame_end: 0,
          category: "FIDELITY",
          severity: "CRITICAL",
          element_id: null,
          expected: "Strict layers must preserve the exact original asset identity",
          observed: mismatches.join("; "),
          responsible_agent: "source_asset_agent",
          recommended_action: "Restore the original asset source and rebuild the preview",
          blocks_delivery: true
        });
      }

      const ratio = typeof visual.diff_ratio === "number" ? visual.diff_ratio : 1;
      const threshold = typeof visual.threshold === "number" ? visual.threshold : 0.005;
      if (ratio > threshold) {
        issues.push({
          issue_id: `visual_fidelity:${context.scene_id}:pixel_diff`,
          scene_id: context.scene_id,
          frame_start: 0,
          frame_end: 0,
          category: "FIDELITY",
          severity: ratio > Math.max(0.05, threshold * 10) ? "CRITICAL" : "MAJOR",
          element_id: null,
          expected: `Static fidelity diff ratio at or below ${threshold}`,
          observed: `Static fidelity diff ratio is ${ratio}`,
          responsible_agent: "ui_react_specialist",
          recommended_action: "Compare reference, actual and diff frames and correct the smallest mismatching scope",
          blocks_delivery: true
        });
      }
    }

    const report: QAReport = {
      job_id: context.job_id,
      scene_id: context.scene_id,
      critic: this.name,
      result: issues.length === 0 ? "PASS" : "FAIL",
      critical_issues: issues.filter((issue) => issue.severity === "CRITICAL").length,
      major_issues: issues.filter((issue) => issue.severity === "MAJOR").length,
      minor_issues: issues.filter((issue) => issue.severity === "MINOR").length,
      issues
    };

    const next = structuredClone(context);
    next.qa_reports = [
      ...next.qa_reports.filter((existing) => existing.critic !== this.name),
      report
    ];
    return {context: JobContextSchema.parse(next)};
  }
}
