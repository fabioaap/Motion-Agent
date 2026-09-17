import { AttemptMemorySchema, type AttemptMemory, type QAIssue } from "./contracts.js";

export class AttemptStore {
  private attempts = new Map<string, AttemptMemory[]>();

  record(input: AttemptMemory): void {
    const parsed = AttemptMemorySchema.parse(input);
    const list = this.attempts.get(parsed.issue_id) ?? [];
    list.push(parsed);
    this.attempts.set(parsed.issue_id, list);
  }

  forIssue(issueId: string): AttemptMemory[] {
    return [...(this.attempts.get(issueId) ?? [])];
  }

  countFailures(issueId: string): number {
    return this.forIssue(issueId).filter((entry) => entry.result === "FAIL").length;
  }

  shouldEscalate(issue: QAIssue): boolean {
    return this.countFailures(issue.issue_id) >= 3;
  }

  techniqueAlreadyFailed(issueId: string, technique: string): boolean {
    return this.forIssue(issueId).some(
      (entry) => entry.technique === technique && entry.result === "FAIL"
    );
  }
}
