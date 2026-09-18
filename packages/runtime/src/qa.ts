import {
  QAReportSchema,
  type JobContext,
  type QAReport,
  type QAIssue
} from "./contracts.js";


export function requiresLayerability(context: JobContext): boolean {
  return Boolean(
    context.brief.component_motion_required ||
    context.decomposition?.elements.some((element) => element.requires_animation)
  );
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
