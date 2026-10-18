import type { Problem } from "../types";

export interface DemoProblem {
  problem: Problem;
  /** Plausible wrong output for the first sample, shown on a near-miss verdict. */
  nearMiss: string;
}

// Classic problems with descriptions written for this demo. In the real app
// they come from alfa-leetcode-api with LeetCode's own HTML and snippets.
export const DEMO_PROBLEMS: DemoProblem[] = [
  {
    nearMiss: "[0,0]",
    problem: {
      id: "demo-two-sum",
      leetcode_id: 1,
      title: "Two Sum",
      slug: "two-sum",
      difficulty: "Easy",
      tags: ["Array", "Hash Table"],
      description: `<p>Given an array of integers <code>nums</code> and an integer <code>target</code>, return the indices of the two numbers that add up to <code>target</code>.</p>
<p>Exactly one valid pair exists, and you may not use the same element twice. Return the indices in any order.</p>
<p><strong>Example 1:</strong></p>
<pre>Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Explanation: nums[0] + nums[1] == 9</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: nums = [3,2,4], target = 6
Output: [1,2]</pre>
<p><strong>Constraints:</strong></p>
<ul><li><code>2 &lt;= nums.length &lt;= 10<sup>4</sup></code></li><li>Only one valid answer exists.</li></ul>
<p><strong>Follow-up:</strong> can you beat <code>O(n<sup>2</sup>)</code> time?</p>`,
      sample_cases: [
        { input: "nums = [2,7,11,15]\ntarget = 9", expected_output: "[0,1]", is_sample: true },
        { input: "nums = [3,2,4]\ntarget = 6", expected_output: "[1,2]", is_sample: true },
        { input: "nums = [3,3]\ntarget = 6", expected_output: "[0,1]", is_sample: true },
      ],
      code_snippets: {
        python: "class Solution:\n    def twoSum(self, nums: List[int], target: int) -> List[int]:\n        ",
        cpp: "class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        \n    }\n};",
      },
    },
  },
  {
    nearMiss: "2",
    problem: {
      id: "demo-longest-substring",
      leetcode_id: 3,
      title: "Longest Substring Without Repeating Characters",
      slug: "longest-substring-without-repeating-characters",
      difficulty: "Medium",
      tags: ["String", "Sliding Window", "Hash Table"],
      description: `<p>Given a string <code>s</code>, return the length of the longest substring that contains no repeated character.</p>
<p><strong>Example 1:</strong></p>
<pre>Input: s = "abcabcbb"
Output: 3
Explanation: "abc" is the longest such substring.</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: s = "pwwkew"
Output: 3
Explanation: "wke". "pwke" does not count: it is a subsequence, not a substring.</pre>
<p><strong>Constraints:</strong></p>
<ul><li><code>0 &lt;= s.length &lt;= 5 * 10<sup>4</sup></code></li><li><code>s</code> holds letters, digits, symbols and spaces.</li></ul>`,
      sample_cases: [
        { input: 's = "abcabcbb"', expected_output: "3", is_sample: true },
        { input: 's = "bbbbb"', expected_output: "1", is_sample: true },
        { input: 's = "pwwkew"', expected_output: "3", is_sample: true },
      ],
      code_snippets: {
        python: "class Solution:\n    def lengthOfLongestSubstring(self, s: str) -> int:\n        ",
        cpp: "class Solution {\npublic:\n    int lengthOfLongestSubstring(string s) {\n        \n    }\n};",
      },
    },
  },
  {
    nearMiss: "4",
    problem: {
      id: "demo-trapping-rain-water",
      leetcode_id: 42,
      title: "Trapping Rain Water",
      slug: "trapping-rain-water",
      difficulty: "Hard",
      tags: ["Array", "Two Pointers", "Monotonic Stack"],
      description: `<p>You are given <code>n</code> non-negative integers that describe an elevation map, where every bar is <code>1</code> wide. Return how many units of water the map holds after it rains.</p>
<p><strong>Example 1:</strong></p>
<pre>Input: height = [0,1,0,2,1,0,1,3,2,1,2,1]
Output: 6</pre>
<p><strong>Example 2:</strong></p>
<pre>Input: height = [4,2,0,3,2,5]
Output: 9</pre>
<p><strong>Constraints:</strong></p>
<ul><li><code>1 &lt;= n &lt;= 2 * 10<sup>4</sup></code></li><li><code>0 &lt;= height[i] &lt;= 10<sup>5</sup></code></li></ul>`,
      sample_cases: [
        { input: "height = [0,1,0,2,1,0,1,3,2,1,2,1]", expected_output: "6", is_sample: true },
        { input: "height = [4,2,0,3,2,5]", expected_output: "9", is_sample: true },
      ],
      code_snippets: {
        python: "class Solution:\n    def trap(self, height: List[int]) -> int:\n        ",
        cpp: "class Solution {\npublic:\n    int trap(vector<int>& height) {\n        \n    }\n};",
      },
    },
  },
];

/** Problems matching the room's difficulty filter (all of them for "Any"). */
export function problemsFor(difficulty: Problem["difficulty"] | null): DemoProblem[] {
  return difficulty ? DEMO_PROBLEMS.filter((p) => p.problem.difficulty === difficulty) : DEMO_PROBLEMS;
}
