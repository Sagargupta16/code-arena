import type { Language, SubmissionResult } from "../types";
import type { DemoProblem } from "./problems";

/** Sample cases plus hidden ones, as the real judge would report them. */
export const DEMO_TOTAL_CASES = 12;

export interface DemoSubmission {
  code: string;
  language: Language;
  demo: DemoProblem;
  /** Earlier submissions by this player that returned a value. */
  priorAttempts: number;
}

const squash = (s: string) => s.replace(/\s+/g, "");

/**
 * Simulated verdicts: no code runs in the browser. Code that never returns a
 * value (an untouched starter, say) fails every case; the first real attempt is a
 * near miss and the next one is accepted, so a visitor sees each result screen.
 */
export function judgeDemo({ code, language, demo, priorAttempts }: DemoSubmission): SubmissionResult {
  const { problem, nearMiss } = demo;
  const first = problem.sample_cases[0];
  const runtime = 30 + (squash(code).length % 40);
  const memory = language === "cpp" ? 9.8 : 16.9;

  if (!returnsValue(code)) {
    return {
      result: "wrong_answer",
      test_cases_passed: 0,
      total_test_cases: DEMO_TOTAL_CASES,
      execution_time_ms: runtime,
      memory_used_mb: memory,
      expected: first?.expected_output,
      got: language === "python" ? "None" : "(no return value)",
    };
  }

  if (priorAttempts === 0) {
    return {
      result: "wrong_answer",
      test_cases_passed: DEMO_TOTAL_CASES - 3,
      total_test_cases: DEMO_TOTAL_CASES,
      execution_time_ms: runtime,
      memory_used_mb: memory,
      expected: first?.expected_output,
      got: nearMiss,
    };
  }

  return {
    result: "accepted",
    test_cases_passed: DEMO_TOTAL_CASES,
    total_test_cases: DEMO_TOTAL_CASES,
    execution_time_ms: runtime,
    memory_used_mb: memory,
  };
}

/** True when the submission returned something, so it counts toward the near-miss step. */
export function returnsValue(code: string): boolean {
  return /\breturn\b/.test(code);
}
