import {
  QAReportSchema,
  type JobContext,
  type QAReport,
  type QAIssue
} from "./contracts.js";

export type LayerabilityGateStatus =
  | "NOT_REQUIRED"
  | "LAYERED_READY"
  | "RECONSTRUCTION_READY"
  | "BLOCKED_MISSING_ASSETS"
  | "FLAT_MOTION_ONLY";

export type LayerabilityGateResult = {
  pass: boolean;
  status: LayerabilityGateStatus;
  reasons: string[];
  missingAssets: string[];
  reconstructableElements: string[];
};

export function explicitFlatMotionAuthorization(context: JobContext): boolean {
  return context.metadata.explicit_flat_motion_authorization === true ||
    context.metadata.flat_motion_authorized === true;
}

export function requiresLayerability(context: JobContext): boolean {
  return Boolean(
    context.brief.component_motion_required ||
    context.decomposition?.elements.some((element) => element.requires_animation)
  );
}

export function assessLayerability(context: JobContext): LayerabilityGateResult {
  const missingAssets: string[] = [];
  const reconstructableElements: string[] = [];
  const reasons: string[] = [];

  if (!requiresLayerability(context)) {
    return {pass: true, status: "NOT_REQUIRED", reasons, missingAssets, reconstructableElements};
  }

  const decomposition = context.decomposition;
  const animated = decomposition?.elements.filter((element) => element.requires_animation) ?? [];
  if (!decomposition) {
    return {
      pass: false,
      status: explicitFlatMotionAuthorization(context) ? "FLAT_MOTION_ONLY" : "BLOCKED_MISSING_ASSETS",
      reasons: ["Missing scene decomposition for component-level motion"],
      missingAssets: animated.map((element) => element.name),
      reconstructableElements
    };
  }

  const flattened = decomposition.full_scene_flattened_foreground ||
    decomposition.layer_map.some((layer) => layer.source_kind === "FLATTENED_STYLEFRAME");
  if (flattened && !explicitFlatMotionAuthorization(context)) {
    return {
      pass: false,
      status: "FLAT_MOTION_ONLY",
      reasons: ["The supplied scene is flattened; explicit authorization is required for an animatic/flat motion treatment"],
      missingAssets,
      reconstructableElements
    };
  }

  if (explicitFlatMotionAuthorization(context) &&
      flattened) {
    return {
      pass: true,
      status: "FLAT_MOTION_ONLY",
      reasons: ["Explicit user authorization limits this job to an animatic/flat motion treatment"],
      missingAssets,
      reconstructableElements
    };
  }

  if (!["LAYERED_READY", "RECONSTRUCTION_READY"].includes(decomposition.layerability_status)) {
    reasons.push(`Layerability status is ${decomposition.layerability_status}`);
  }

  if (decomposition.full_scene_flattened_foreground) {
    reasons.push("Flattened full-scene foreground detected");
  }
  if (!decomposition.layer_map_verified) reasons.push("Layer Map is not verified");

  const assets = new Map((context.assets?.assets ?? []).map((asset) => [asset.asset_id, asset]));
  const layers = new Map(decomposition.layer_map.map((layer) => [layer.element_id, layer]));
  for (const element of animated) {
    const asset = assets.get(element.source_asset_id);
    const layer = layers.get(element.element_id);
    if (!asset) missingAssets.push(`${element.name} (${element.source_asset_id})`);
    if (!layer) {
      missingAssets.push(`${element.name} Layer Map entry`);
      continue;
    }
    if (!layer.independently_addressable || layer.source_kind === "FLATTENED_STYLEFRAME") {
      const canReconstruct = element.reconstruction_allowed &&
        ["REBUILD_REACT", "REBUILD_SVG"].includes(element.strategy) &&
        layer.source_kind !== "FLATTENED_STYLEFRAME";
      if (canReconstruct && layer.independently_addressable) reconstructableElements.push(element.element_id);
      else reasons.push(`Animated element ${element.element_id} is not independently addressable`);
    }
  }

  if (missingAssets.length) {
    return {pass: false, status: "BLOCKED_MISSING_ASSETS", reasons, missingAssets, reconstructableElements};
  }
  if (reasons.length) {
    return {pass: false, status: "BLOCKED_MISSING_ASSETS", reasons, missingAssets, reconstructableElements};
  }
  return {
    pass: true,
    status: reconstructableElements.length ? "RECONSTRUCTION_READY" : "LAYERED_READY",
    reasons,
    missingAssets,
    reconstructableElements
  };
}

export function buildMissingAssetResponse(
  context: JobContext,
  gate: LayerabilityGateResult
) {
  const animated = context.decomposition?.elements.filter((element) => element.requires_animation) ?? [];
  const available = new Set(context.assets?.assets.map((asset) => asset.name) ?? []);
  return {
    what_i_understood: context.brief.objective,
    what_needs_to_move_separately: animated.map((element) => element.name),
    what_i_already_have: [...available],
    what_i_can_reconstruct: gate.reconstructableElements,
    what_is_missing: gate.missingAssets,
    blocked_without_it: gate.reasons,
    next_step: gate.status === "BLOCKED_MISSING_ASSETS"
      ? "Provide the missing independent assets or authorize an explicit flat-motion animatic."
      : gate.status === "FLAT_MOTION_ONLY"
        ? "Explicitly authorize an animatic/flat-motion treatment or provide independent layers."
        : "Materialize the approved reconstruction before building."
  };
}

export type AggregatedQA = {
  pass: boolean;
  criticalIssues: number;
  majorIssues: number;
  minorIssues: number;
  openIssues: QAIssue[];
  requiredCriticsMissing: string[];
};

export function aggregateQA(
  reports: QAReport[],
  requiredCritics: string[]
): AggregatedQA {
  const parsed = reports.map((report) => QAReportSchema.parse(report));
  const critics = new Set(parsed.map((report) => report.critic));
  const requiredCriticsMissing = requiredCritics.filter((critic) => !critics.has(critic));
  const openIssues = parsed.flatMap((report) => report.issues);
  const criticalIssues = openIssues.filter((issue) => issue.severity === "CRITICAL").length;
  const majorIssues = openIssues.filter((issue) => issue.severity === "MAJOR").length;
  const minorIssues = openIssues.filter((issue) => issue.severity === "MINOR").length;
  const mandatoryFailed = parsed.some(
    (report) => requiredCritics.includes(report.critic) && report.result === "FAIL"
  );

  return {
    pass:
      requiredCriticsMissing.length === 0 &&
      !mandatoryFailed &&
      criticalIssues === 0 &&
      majorIssues === 0,
    criticalIssues,
    majorIssues,
    minorIssues,
    openIssues,
    requiredCriticsMissing
  };
}

export function requiredCriticsFor(context: JobContext): string[] {
  const critics = ["fidelity_critic"];
  if (requiresLayerability(context)) {
    critics.push("layerability_critic");
  }
  if (context.metadata.visual_qa && typeof context.metadata.visual_qa === "object") {
    critics.push("visual_fidelity_critic");
  }
  critics.push("motion_critic", "composition_critic");
  if (context.brief.brand_context) critics.push("brand_critic");
  critics.push("technical_validator");
  if (context.metadata.regression_qa && typeof context.metadata.regression_qa === "object") {
    critics.push("regression_checker");
  }
  return critics;
}
