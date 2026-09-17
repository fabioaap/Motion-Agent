import type { AssetStrategy, QAIssue } from "./contracts.js";

export type Specialist =
  | "source_asset_agent"
  | "ui_react_specialist"
  | "svg_motion_specialist"
  | "motion_specialist"
  | "composition_agent"
  | "remotion_specialist"
  | "brand_system_specialist"
  | "regression_checker";

export function routeIssue(issue: QAIssue): Specialist {
  if (issue.category === "REGRESSION") return "regression_checker";
  if (issue.category === "MOTION") return "motion_specialist";
  if (issue.category === "COMPOSITION") return "composition_agent";
  if (issue.category === "BRAND") return "brand_system_specialist";
  if (issue.category === "TECHNICAL") return "remotion_specialist";

  const text = `${issue.expected} ${issue.observed}`.toLowerCase();
  if (text.includes("icon") || text.includes("asset") || text.includes("svg")) {
    return "source_asset_agent";
  }
  if (text.includes("component") || text.includes("layout") || text.includes("react")) {
    return "ui_react_specialist";
  }
  return "ui_react_specialist";
}

const fallbackMap: Partial<Record<AssetStrategy, AssetStrategy[]>> = {
  REBUILD_REACT: ["HYBRID", "USE_ORIGINAL", "REQUEST_SOURCE"],
  REBUILD_SVG: ["REUSE_SVG", "OVERLAY", "REQUEST_SOURCE"],
  SEGMENT_ORIGINAL: ["MASK", "HYBRID", "USE_ORIGINAL"],
  MASK: ["HYBRID", "USE_ORIGINAL", "REQUEST_SOURCE"],
  OVERLAY: ["HYBRID", "USE_ORIGINAL", "REQUEST_SOURCE"]
};

export function chooseFallback(
  current: AssetStrategy,
  previouslyTried: AssetStrategy[]
): AssetStrategy | null {
  const options = fallbackMap[current] ?? [];
  return options.find((option) => !previouslyTried.includes(option)) ?? null;
}
