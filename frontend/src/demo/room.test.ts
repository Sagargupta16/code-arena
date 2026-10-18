import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MatchResult, RoomSettings } from "../types";
import { OPPONENTS, type Bot } from "./bots";
import { BOT_HOST_START_MS, DEMO_TIME_LIMIT, JUDGE_DELAY_MS } from "./config";
import { DemoRoom } from "./room";

const HUMAN = { id: "me", username: "me" };
const SOLUTION = "class Solution:\n    def twoSum(self, nums, target):\n        return [0, 1]\n";

function settings(mode: RoomSettings["mode"]): RoomSettings {
  return { mode, time_limit: 1800, time_mode: "custom", difficulty_filter: "Easy", tag_filters: [] };
}

function setup(mode: RoomSettings["mode"], bots: Bot[] = OPPONENTS, hostId = HUMAN.id) {
  const finished: MatchResult[] = [];
  const room = new DemoRoom("ROOM01", hostId, settings(mode), (r) => finished.push(r));
  bots.forEach((bot) => room.addBot(bot));
  room.addMember(HUMAN);
  const events: { event: string; data: Record<string, unknown> }[] = [];
  room.attach((event, data) => events.push({ event, data }));
  const named = (name: string) => events.filter((e) => e.event === name).map((e) => e.data);
  return { room, finished, named };
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("DemoRoom", () => {
  it("greets a new client with everyone already in the room", () => {
    const { named } = setup("blind");
    expect(named("room:player_joined").map((d) => (d.user as { id: string }).id)).toEqual(["bot-ada", "bot-linus", "me"]);
  });

  it("only lets the host start, and only with two or more players", () => {
    const { room, named } = setup("blind", [], HUMAN.id);
    room.receive(HUMAN.id, "match:start", {});
    expect(named("match:problem")).toHaveLength(0);

    const guest = setup("blind", OPPONENTS, "bot-ada");
    guest.room.receive(HUMAN.id, "match:start", {});
    expect(guest.named("match:problem")).toHaveLength(0);
  });

  it("runs a full live match: clock, verdicts, live board and final standings", () => {
    const { room, finished, named } = setup("live_status");
    room.receive(HUMAN.id, "match:start", {});

    const [problem] = named("match:problem");
    expect((problem.problem as { title: string }).title).toBe("Two Sum");
    expect(problem.time_limit).toBe(DEMO_TIME_LIMIT);
    expect(named("match:timer_tick")[0].remaining_seconds).toBe(DEMO_TIME_LIMIT);

    vi.advanceTimersByTime(10_000);
    room.receive(HUMAN.id, "match:submit", { code: SOLUTION, language: "python" });
    vi.advanceTimersByTime(JUDGE_DELAY_MS);
    expect(named("match:result").at(-1)?.result).toBe("wrong_answer");

    room.receive(HUMAN.id, "match:submit", { code: SOLUTION, language: "python" });
    vi.advanceTimersByTime(JUDGE_DELAY_MS);
    expect(named("match:result").at(-1)?.result).toBe("accepted");

    // Bots finish by 70s; the match ends as soon as everyone has solved it.
    vi.advanceTimersByTime(70_000);
    expect(room.status).toBe("finished");
    expect(finished).toHaveLength(1);

    const { rankings, scoring_mode } = finished[0];
    expect(scoring_mode).toBe("full_solve");
    expect(rankings.map((r) => r.user_id)).toEqual(["me", "bot-ada", "bot-linus"]);
    expect(rankings.map((r) => r.score)).toEqual([939, 909, 830]);

    const updates = named("match:status_update");
    expect(updates).toHaveLength(2 + 2 + 3);
    expect(updates.every((u) => typeof u.username === "string")).toBe(true);
    expect(named("match:finished")).toHaveLength(1);
  });

  it("sends no status updates in blind mode", () => {
    const { room, named } = setup("blind");
    room.receive(HUMAN.id, "match:start", {});
    vi.advanceTimersByTime(80_000);
    expect(named("match:status_update")).toHaveLength(0);
  });

  it("ends on the clock with partial scoring when nobody solves", () => {
    const stuck: Bot = { id: "bot-stuck", username: "stuck", plan: [{ at: 30, result: "wrong_answer", passed: 6 }] };
    const { room, finished, named } = setup("blind", [stuck]);
    room.receive(HUMAN.id, "match:start", {});
    vi.advanceTimersByTime(DEMO_TIME_LIMIT * 1000);

    expect(named("match:timer_tick").at(-1)?.remaining_seconds).toBe(0);
    expect(finished[0].scoring_mode).toBe("partial");
    expect(finished[0].rankings.map((r) => [r.user_id, r.score])).toEqual([
      ["bot-stuck", 470],
      ["me", 0],
    ]);
  });

  it("lets a bot host start a rematch once the lobby reopens", () => {
    const { room, named } = setup("blind", OPPONENTS, "bot-ada");
    room.prepareLobby();
    vi.advanceTimersByTime(BOT_HOST_START_MS);
    expect(room.status).toBe("in_progress");

    vi.advanceTimersByTime(DEMO_TIME_LIMIT * 1000);
    expect(room.status).toBe("finished");
    room.prepareLobby();
    expect(room.status).toBe("waiting");
    vi.advanceTimersByTime(BOT_HOST_START_MS);
    expect(named("match:problem")).toHaveLength(2);
  });
});
