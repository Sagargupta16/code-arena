import type { Language } from "../types";

// Starter code shown when a problem has no LeetCode snippet for the language.
export const FALLBACK_CODE: Record<Language, string> = {
  cpp: `class Solution {
public:
    // write your solution here
};`,
  python: `class Solution:
    # write your solution here
    pass
`,
};
