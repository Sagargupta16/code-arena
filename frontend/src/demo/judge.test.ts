import { describe, expect, it } from "vitest";
import { DEMO_TOTAL_CASES, judgeDemo } from "./judge";
import { DEMO_PROBLEMS } from "./problems";

const twoSum = DEMO_PROBLEMS[0];
const solved = "class Solution:\n    def twoSum(self, nums, target):\n        return [0, 1]\n";

describe("judgeDemo", () => {
  it("fails every case when the code never returns a value", () => {
    const starter = twoSum.problem.code_snippets.python;
    const verdict = judgeDemo({ code: starter, language: "python", demo: twoSum, priorAttempts: 0 });
    expect(verdict.result).toBe("wrong_answer");
    expect(verdict.test_cases_passed).toBe(0);
    expect(verdict.got).toBe("None");
    expect(verdict.expected).toBe("[0,1]");
  });

  it("calls the first returning attempt a near miss and accepts the next", () => {
    const first = judgeDemo({ code: solved, language: "python", demo: twoSum, priorAttempts: 0 });
    expect(first.result).toBe("wrong_answer");
    expect(first.test_cases_passed).toBe(DEMO_TOTAL_CASES - 3);
    expect(first.got).toBe(twoSum.nearMiss);

    const second = judgeDemo({ code: solved, language: "python", demo: twoSum, priorAttempts: 1 });
    expect(second.result).toBe("accepted");
    expect(second.test_cases_passed).toBe(DEMO_TOTAL_CASES);
    expect(second.total_test_cases).toBe(DEMO_TOTAL_CASES);
  });

  it("reports the C++ starter as returning nothing", () => {
    const verdict = judgeDemo({ code: twoSum.problem.code_snippets.cpp, language: "cpp", demo: twoSum, priorAttempts: 3 });
    expect(verdict.result).toBe("wrong_answer");
    expect(verdict.got).toBe("(no return value)");
  });
});
