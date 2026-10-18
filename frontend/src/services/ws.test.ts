import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ArenaSocket, MAX_RETRIES, backoffDelay } from "./ws";

/** Just enough of the browser WebSocket for ArenaSocket. */
class FakeWebSocket {
  static readonly OPEN = 1;
  static instances: FakeWebSocket[] = [];
  readyState = 0;
  sent: string[] = [];
  onopen: (() => void) | null = null;
  onmessage: ((e: { data: string }) => void) | null = null;
  onerror: ((e: unknown) => void) | null = null;
  onclose: ((e: { code: number; reason: string }) => void) | null = null;
  readonly url: string;

  constructor(url: string) {
    this.url = url;
    FakeWebSocket.instances.push(this);
  }
  open() {
    this.readyState = FakeWebSocket.OPEN;
    this.onopen?.();
  }
  message(payload: object) {
    this.onmessage?.({ data: JSON.stringify(payload) });
  }
  drop(code = 1006) {
    this.readyState = 3;
    this.onclose?.({ code, reason: "" });
  }
  send(data: string) {
    this.sent.push(data);
  }
  close() {
    this.drop(1000);
  }
}

const latest = () => FakeWebSocket.instances.at(-1)!;

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("WebSocket", FakeWebSocket);
  vi.stubEnv("VITE_WS_URL", "ws://arena.test");
  FakeWebSocket.instances = [];
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("ArenaSocket", () => {
  it("connects to the room with the token and dispatches typed events", () => {
    const socket = new ArenaSocket();
    const ticks: number[] = [];
    socket.on("match:timer_tick", (d) => ticks.push(d.remaining_seconds));
    socket.connect("ABC123", "jwt");
    expect(latest().url).toBe("ws://arena.test/ws/ABC123?token=jwt");
    expect(socket.getState()).toBe("connecting");

    latest().open();
    expect(socket.getState()).toBe("open");
    latest().message({ event: "match:timer_tick", remaining_seconds: 42 });
    latest().message({ event: "match:result", result: "accepted" });
    expect(ticks).toEqual([42]);
  });

  it("stops delivering to a handler after unsubscribe", () => {
    const socket = new ArenaSocket();
    const seen: string[] = [];
    const off = socket.on("room:player_left", (d) => seen.push(d.user_id));
    socket.connect("ABC123", "jwt");
    latest().message({ event: "room:player_left", user_id: "a" });
    off();
    latest().message({ event: "room:player_left", user_id: "b" });
    expect(seen).toEqual(["a"]);
  });

  it("sends JSON frames only while open", () => {
    const socket = new ArenaSocket();
    socket.connect("ABC123", "jwt");
    vi.spyOn(console, "warn").mockImplementation(() => {});
    socket.send("match:start");
    expect(latest().sent).toEqual([]);
    latest().open();
    socket.send("match:submit", { code: "x", language: "python" });
    expect(JSON.parse(latest().sent[0])).toEqual({ event: "match:submit", code: "x", language: "python" });
  });

  it("backs off exponentially with a cap", () => {
    expect([0, 1, 2, 3, 4, 5].map(backoffDelay)).toEqual([500, 1000, 2000, 4000, 8000, 8000]);
  });

  it("reconnects after a dropped connection and resets the retry count once open", () => {
    const socket = new ArenaSocket();
    const states: string[] = [];
    socket.subscribeState(() => states.push(socket.getState()));
    socket.connect("ABC123", "jwt");
    latest().open();
    latest().drop();
    expect(socket.getState()).toBe("reconnecting");

    vi.advanceTimersByTime(backoffDelay(0) - 1);
    expect(FakeWebSocket.instances).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(FakeWebSocket.instances).toHaveLength(2);
    latest().open();
    expect(states).toEqual(["connecting", "open", "reconnecting", "open"]);
  });

  it("gives up after MAX_RETRIES and emits close", () => {
    const socket = new ArenaSocket();
    const onClose = vi.fn();
    socket.on("close", onClose);
    socket.connect("ABC123", "jwt");
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      latest().drop();
      vi.advanceTimersByTime(backoffDelay(attempt));
    }
    expect(FakeWebSocket.instances).toHaveLength(MAX_RETRIES + 1);
    latest().drop();
    expect(socket.getState()).toBe("closed");
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("does not retry when the server rejects the connection", () => {
    const socket = new ArenaSocket();
    socket.connect("ABC123", "bad-token");
    latest().drop(4001);
    vi.advanceTimersByTime(60_000);
    expect(FakeWebSocket.instances).toHaveLength(1);
    expect(socket.getState()).toBe("closed");
  });

  it("cancels a pending retry on disconnect", () => {
    const socket = new ArenaSocket();
    socket.connect("ABC123", "jwt");
    latest().drop();
    socket.disconnect();
    vi.advanceTimersByTime(60_000);
    expect(FakeWebSocket.instances).toHaveLength(1);
    expect(socket.getState()).toBe("closed");
  });
});
