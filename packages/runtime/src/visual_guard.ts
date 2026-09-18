import type {AgentHandler, AgentResult} from "./agents.js";
import {JobContextSchema, type JobContext, type QAIssue, type QAReport} from "./contracts.js";

type VisualQARecord = {
  diff_ratio?: unknown;
  threshold?: unknown;
  identity_mismatches?: unknown;
  reference_path?: unknown;
  actual_path?: unknown;
  diff_path?: unknown;
  motion_keyframes?: unknown;
};

type RegressionQARecord = {
  mismatches?: unknown;
  locked_elements?: unknown;
  baseline_available?: unknown;
  cycle?: unknown;
};

function visualRecord(context: JobContext): VisualQARecord | null {
  const raw = context.metadata.visual_qa;
  if (!raw || typeof raw !== "object") return null;
  return raw as VisualQARecord;
}

function regressionRecord(context: JobContext): RegressionQARecord | null {
  const raw = context.metadata.regression_qa;
  if (!raw || typeof raw !== "object") return null;
  return raw as RegressionQARecord;
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


export class LayerabilityCriticHandler implements AgentHandler {
  readonly name = "layerability_critic" as const;

  async run(context: JobContext): Promise<AgentResult> {
    const issues: QAIssue[] = [];
    const decomposition = context.decomposition;

    if (!decomposition) {
      issues.push({
        issue_id: `layerability:${context.scene_id}:missing_decomposition`,
        scene_id: context.scene_id,
        frame_start: null,
        frame_end: null,
        category: "LAYERABILITY",
        severity: "CRITICAL",
        element_id: null,
        expected: "Component motion has an explicit decomposition and layer map",
        observed: "No decomposition is present for a component-motion scene",
        responsible_agent: "decomposition_agent",
        recommended_action: "Run Scene Topology Audit and produce a verified Layer Map before building",
        blocks_delivery: true
      });
    } else {
      if (decomposition.layerability_status !== "LAYERED_READY") {
        issues.push({
          issue_id: `layerability:${context.scene_id}:status`,
          scene_id: context.scene_id,
          frame_start: null,
          frame_end: null,
          category: "LAYERABILITY",
          severity: "CRITICAL",
          element_id: null,
          expected: "Layerability status is LAYERED_READY before component motion is delivered",
          observed: `Layerability status is ${decomposition.layerability_status}`,
          responsible_agent: "decomposition_agent",
          recommended_action: "Return to decomposition or source resolution until every major moving foreground object is independently addressable",
          blocks_delivery: true
        });
      }

      if (!decomposition.layer_map_verified) {
        issues.push({
          issue_id: `layerability:${context.scene_id}:unverified_map`,
          scene_id: context.scene_id,
          frame_start: null,
          frame_end: null,
          category: "LAYERABILITY",
          severity: "CRITICAL",
          element_id: null,
          expected: "Layer Map is verified against the approved source and implementation",
          observed: "Layer Map is not verified",
          responsible_agent: "decomposition_agent",
          recommended_action: "Verify source, role and independent addressability for every major animated layer",
          blocks_delivery: true
        });
      }

      if (decomposition.full_scene_flattened_foreground) {
        issues.push({
          issue_id: `layerability:${context.scene_id}:flattened_foreground`,
          scene_id: context.scene_id,
          frame_start: null,
          frame_end: null,
          category: "LAYERABILITY",
          severity: "CRITICAL",
          element_id: null,
          expected: "Major foreground animation is composed from independent layers",
          observed: "A flattened full-scene foreground is still being used",
          responsible_agent: "decomposition_agent",
          recommended_action: "Separate or faithfully reconstruct the foreground before adding motion",
          blocks_delivery: true
        });
      }

      const layerMap = new Map(decomposition.layer_map.map((layer) => [layer.element_id, layer]));
      for (const element of decomposition.elements.filter((item) => item.requires_animation)) {
        const layer = layerMap.get(element.element_id);
        if (!layer || !layer.independently_addressable || layer.source_kind === "FLATTENED_STYLEFRAME") {
          issues.push({
            issue_id: `layerability:${context.scene_id}:${element.element_id}`,
            scene_id: context.scene_id,
            frame_start: null,
            frame_end: null,
            category: "LAYERABILITY",
            severity: "CRITICAL",
            element_id: element.element_id,
            expected: "Every major animated element is independently addressable",
            observed: layer
              ? `Layer source is ${layer.source_kind} with independently_addressable=${layer.independently_addressable}`
              : "Animated element is missing from the Layer Map",
            responsible_agent: "decomposition_agent",
            recommended_action: "Provide an independent component, SVG, transparent asset, cutout, React/SVG reconstruction or verified mask for this element",
            blocks_delivery: true
          });
        }
      }
    }

    if (context.build_result?.flattened_foreground_used) {
      issues.push({
        issue_id: `layerability:${context.scene_id}:build_flattened_foreground`,
        scene_id: context.scene_id,
        frame_start: null,
        frame_end: null,
        category: "LAYERABILITY",
        severity: "CRITICAL",
        element_id: null,
        expected: "Build result does not use a flattened foreground as a substitute for independent component motion",
        observed: "Build result reports flattened_foreground_used=true",
        responsible_agent: "remotion_specialist",
        recommended_action: "Replace the flattened foreground with independently addressable layers and rebuild",
        blocks_delivery: true
      });
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

export class RegressionCheckerHandler implements AgentHandler {
  readonly name = "regression_checker" as const;

  async run(context: JobContext): Promise<AgentResult> {
    const regression = regressionRecord(context);
    const mismatches = regression && Array.isArray(regression.mismatches)
      ? regression.mismatches.map(String)
      : [];
    const issues: QAIssue[] = mismatches.map((mismatch, index) => ({
      issue_id: `regression:${context.scene_id}:${index}`,
      scene_id: context.scene_id,
      frame_start: null,
      frame_end: null,
      category: "REGRESSION",
      severity: "CRITICAL",
      element_id: null,
      expected: "Locked scene scope remains byte and geometry stable across correction cycles",
      observed: mismatch,
      responsible_agent: "composition_agent",
      recommended_action: "Revert changes outside the active issue scope and reapply the smallest correction",
      blocks_delivery: true
    }));

    const report: QAReport = {
      job_id: context.job_id,
      scene_id: context.scene_id,
      critic: this.name,
      result: issues.length === 0 ? "PASS" : "FAIL",
      critical_issues: issues.length,
      major_issues: 0,
      minor_issues: 0,
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
