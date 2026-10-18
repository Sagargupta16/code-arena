import type { Player, SubmissionResult } from "../types";
import { DEMO_TOTAL_CASES } from "./judge";

export interface BotSubmission {
  /** Seconds after the match starts. */
  at: number;
  result: SubmissionResult["result"];
  passed: number;
}

export interface Bot extends Player {
  plan: BotSubmission[];
}

// Two opponents with different styles: one quick and clean, one that stumbles
// before it lands. Both finish inside the first ~70 seconds of a demo match.
export const OPPONENTS: Bot[] = [
  {
    id: "bot-ada",
    username: "ada",
    plan: [
      { at: 18, result: "wrong_answer", passed: 7 },
      { at: 41, result: "accepted", passed: DEMO_TOTAL_CASES },
    ],
  },
  {
    id: "bot-linus",
    username: "linus",
    plan: [
      { at: 29, result: "runtime_error", passed: 0 },
      { at: 52, result: "wrong_answer", passed: 10 },
      { at: 70, result: "accepted", passed: DEMO_TOTAL_CASES },
    ],
  },
];

/** Bot that hosts a room you join by code, then starts the match for you. */
export const BOT_HOST: Bot = {
  id: "bot-grace",
  username: "grace",
  plan: [
    { at: 35, result: "time_limit", passed: 6 },
    { at: 63, result: "accepted", passed: DEMO_TOTAL_CASES },
  ],
};
