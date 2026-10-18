import type { Language, MatchResult, Player, Room, RoomSettings, StatusEntry, SubmissionResult } from "../types";
import { rankPlayers } from "../services/scoring";
import type { Bot } from "./bots";
import { BOT_HOST_START_MS, DEMO_TIME_LIMIT, JUDGE_DELAY_MS } from "./config";
import { DEMO_TOTAL_CASES, judgeDemo, returnsValue } from "./judge";
import { DEMO_PROBLEMS, problemsFor, type DemoProblem } from "./problems";
import { randomIndex } from "./random";
import { applyVerdict, newStanding, toOutcome, type Standing } from "./standings";

export type Send = (event: string, data: Record<string, unknown>) => void;

/**
 * One room of the in-browser demo server. It plays the backend's part of the
 * protocol: lobby joins, a server-side clock, judging, live status and scoring.
 */
export class DemoRoom {
  status: Room["status"] = "waiting";
  readonly members: Player[] = [];
  readonly code: string;
  readonly hostId: string;
  readonly settings: RoomSettings;
  private readonly onFinished: (result: MatchResult) => void;
  private readonly bots = new Map<string, Bot>();
  private readonly clients = new Set<Send>();
  private matchTimers: ReturnType<typeof setTimeout>[] = [];
  private ticker: ReturnType<typeof setInterval> | undefined;
  private hostStartPending = false;
  private demo: DemoProblem = DEMO_PROBLEMS[0];
  private startedAt = 0;
  private standings = new Map<string, Standing>();

  constructor(code: string, hostId: string, settings: RoomSettings, onFinished: (result: MatchResult) => void = () => {}) {
    this.code = code;
    this.hostId = hostId;
    this.settings = settings;
    this.onFinished = onFinished;
  }

  toRoom(): Room {
    const problem_id = this.status === "waiting" ? null : this.demo.problem.id;
    return { code: this.code, host_id: this.hostId, players: this.members.map((m) => m.id), status: this.status, settings: this.settings, problem_id };
  }

  addMember(player: Player): void {
    if (this.members.some((m) => m.id === player.id)) return;
    this.members.push(player);
    this.broadcast("room:player_joined", { user: player, player_count: this.members.length });
  }

  addBot(bot: Bot): void {
    this.bots.set(bot.id, bot);
    this.addMember({ id: bot.id, username: bot.username });
  }

  /** Called when a lobby opens: reset a finished room and let a bot host start it. */
  prepareLobby(): void {
    if (this.status === "finished") this.status = "waiting";
    if (!this.bots.has(this.hostId) || this.status !== "waiting" || this.hostStartPending) return;
    this.hostStartPending = true;
    setTimeout(() => {
      this.hostStartPending = false;
      this.start(this.hostId);
    }, BOT_HOST_START_MS);
  }

  /** A client connects: greet it with everyone already in the room. */
  attach(send: Send): () => void {
    this.clients.add(send);
    this.members.forEach((user, i) => send("room:player_joined", { event: "room:player_joined", user, player_count: i + 1 }));
    return () => this.clients.delete(send);
  }

  receive(userId: string, event: string, data: Record<string, unknown>): void {
    if (event === "match:start") this.start(userId);
    if (event === "match:submit") this.submit(userId, typeof data.code === "string" ? data.code : "", data.language as Language);
  }

  private start(by: string): void {
    if (by !== this.hostId || this.status === "in_progress" || this.members.length < 2) return;
    const pool = problemsFor(this.settings.difficulty_filter);
    const choices = pool.length ? pool : DEMO_PROBLEMS;
    this.demo = choices[randomIndex(choices.length)];
    this.status = "in_progress";
    this.startedAt = Date.now();
    this.standings = new Map(this.members.map((m) => [m.id, newStanding()]));
    this.broadcast("match:problem", { problem: this.demo.problem, time_limit: DEMO_TIME_LIMIT, mode: this.settings.mode });
    this.broadcast("match:timer_tick", { remaining_seconds: DEMO_TIME_LIMIT });
    this.ticker = setInterval(() => this.tick(), 1000);
    for (const bot of this.bots.values()) {
      for (const step of bot.plan) {
        this.later(step.at * 1000, () => this.record(bot.id, step.result, step.passed));
      }
    }
  }

  private tick(): void {
    // Read the clock instead of counting ticks, so interval drift never skews it.
    const remaining = Math.max(0, DEMO_TIME_LIMIT - this.elapsed());
    this.broadcast("match:timer_tick", { remaining_seconds: remaining });
    if (remaining === 0) this.finish();
  }

  private submit(userId: string, code: string, language: Language): void {
    const standing = this.standings.get(userId);
    if (this.status !== "in_progress" || standing?.solvedAt !== null) return;
    const verdict = judgeDemo({ code, language, demo: this.demo, priorAttempts: standing.returned });
    if (returnsValue(code)) standing.returned += 1;
    this.later(JUDGE_DELAY_MS, () => {
      this.broadcast("match:result", { ...verdict });
      this.record(userId, verdict.result, verdict.test_cases_passed);
    });
  }

  private record(userId: string, result: SubmissionResult["result"], passed: number): void {
    const standing = this.standings.get(userId);
    if (this.status !== "in_progress" || standing?.solvedAt !== null) return;
    applyVerdict(standing, result, passed, this.elapsed());
    if (this.settings.mode === "live_status") {
      const username = this.members.find((m) => m.id === userId)?.username;
      const entry: StatusEntry = { user_id: userId, username, status: result, attempts: standing.attempts, test_cases_passed: standing.passed };
      this.broadcast("match:status_update", { ...entry });
    }
    if ([...this.standings.values()].every((s) => s.solvedAt !== null)) this.finish();
  }

  private finish(): void {
    clearInterval(this.ticker);
    this.matchTimers.forEach(clearTimeout);
    this.matchTimers = [];
    this.status = "finished";
    const outcomes = this.members.map((m) => toOutcome(m, this.standings.get(m.id)));
    const result = rankPlayers(outcomes, DEMO_TOTAL_CASES);
    this.broadcast("match:finished", { ...result });
    this.onFinished(result);
  }

  private elapsed(): number {
    return Math.floor((Date.now() - this.startedAt) / 1000);
  }

  private later(ms: number, fn: () => void): void {
    this.matchTimers.push(setTimeout(fn, ms));
  }

  private broadcast(event: string, data: Record<string, unknown>): void {
    this.clients.forEach((send) => send(event, { event, ...data }));
  }
}
