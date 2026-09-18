import type { JobContext, QAIssue } from "./contracts.js";
import type { AggregatedQA } from "./qa.js";

export type SupervisorDecision = {
  approved: boolean;
  reasons: string[];
};

export class Supervisor {
  review(context: JobContext, qa: AggregatedQA): SupervisorDecision {
    const reasons: string[] = [];

    if (!qa.pass) reasons.push("QA graph did not converge");
    if (qa.requiredCriticsMissing.length > 0) {
      reasons.push(`Missing critics: ${qa.requiredCriticsMissing.join(", ")}`);
    }
    if (qa.criticalIssues > 0) reasons.push("Critical issues are still open");
    if (qa.majorIssues > 0) reasons.push("Major issues are still open");

    const wrongOriginals = context.open_issues.filter((issue) =>
      isOriginalAssetViolation(issue)
    );
    if (wrongOriginals.length > 0) {
      reasons.push("Original asset fidelity violation detected");
    }

    if (context.brief.component_motion_required) {
      if (!context.decomposition) {
        reasons.push("Component motion requires a decomposition and verified Layer Map");
      } else {
        if (context.decomposition.layerability_status !== "LAYERED_READY") {
          reasons.push("Layerability Gate has not reached LAYERED_READY");
        }
        if (!context.decomposition.layer_map_verified) {
          reasons.push("Layer Map is not verified");
        }
        if (context.decomposition.full_scene_flattened_foreground) {
          reasons.push("Flattened full-scene foreground is still present");
        }
      }
    }

    if (!context.template_selection) {
      reasons.push("Official Remotion template resolution has not been recorded");
    } else {
      if (!context.template_selection.preserves_host_project) {
        reasons.push("Selected template does not preserve the host project");
      }
      if (!context.template_selection.layerability_gate_unchanged) {
        reasons.push("Selected template attempts to bypass or weaken the Layerability Gate");
      }
      if (context.template_selection.catalog_source !== "https://www.remotion.dev/templates") {
        reasons.push("Template selection is not bound to the official Remotion catalog");
      }
    }

    return { approved: reasons.length === 0, reasons };
  }
}

function isOriginalAssetViolation(issue: QAIssue): boolean {
  if (issue.category !== "FIDELITY") return false;
  const text = `${issue.expected} ${issue.observed}`.toLowerCase();
  return (
    text.includes("original") ||
    text.includes("icon") ||
    text.includes("logo") ||
    text.includes("font")
  );
}
