export interface UserStats {
  matches_played: number;
  wins: number;
  total_score: number;
  problems_solved: number;
}

export interface User {
  id: string;
  username: string;
  avatar: string;
  stats: UserStats;
}

export interface RoomSettings {
  mode: "blind" | "live_status";
  time_limit: number;
  time_mode: "custom" | "difficulty_based";
  difficulty_filter: "Easy" | "Medium" | "Hard" | null;
  tag_filters: string[];
}

export interface Room {
  code: string;
  host_id: string;
  players: string[];
  status: "waiting" | "in_progress" | "finished";
  settings: RoomSettings;
  problem_id: string | null;
}

export interface TestCase {
  input: string;
  expected_output: string;
  is_sample: boolean;
}

export interface Problem {
  id: string;
  leetcode_id: number;
  title: string;
  slug: string;
  difficulty: "Easy" | "Medium" | "Hard";
  description: string;
  tags: string[];
  sample_cases: TestCase[];
  code_snippets: Record<string, string>;
}

export interface SubmissionResult {
  result: "accepted" | "wrong_answer" | "time_limit" | "runtime_error" | "compile_error";
  test_cases_passed: number;
  total_test_cases: number;
  execution_time_ms: number;
  memory_used_mb: number;
  expected?: string;
  got?: string;
  error?: string;
}

export interface PlayerRanking {
  user_id: string;
  score: number;
  solve_time_ms: number;
  attempts: number;
  test_cases_passed: number;
}

export interface MatchResult {
  rankings: PlayerRanking[];
  scoring_mode: "full_solve" | "partial";
}

export type Language = "cpp" | "python";
