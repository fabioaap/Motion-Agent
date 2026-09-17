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
