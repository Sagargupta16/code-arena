import type { ServerEvents } from "../types";

export type ConnectionState = "connecting" | "open" | "reconnecting" | "closed";

type Handler = (data: unknown) => void;

/**
 * Event dispatch and connection state shared by the real WebSocket client and
 * the in-browser demo server client, so pages never know which one they hold.
 */
export abstract class RoomSocket {
  private readonly handlers = new Map<string, Handler[]>();
  private readonly stateListeners = new Set<() => void>();
  private state: ConnectionState = "closed";

  abstract connect(roomCode: string, token: string): void;
  abstract send(event: string, data?: Record<string, unknown>): void;
  abstract disconnect(): void;

  on<E extends keyof ServerEvents>(event: E, handler: (data: ServerEvents[E]) => void): () => void {
    const h = handler as Handler;
    this.handlers.set(event, [...(this.handlers.get(event) ?? []), h]);
    return () => {
      this.handlers.set(event, (this.handlers.get(event) ?? []).filter((x) => x !== h));
    };
  }

  // Arrow properties keep a stable identity, which useSyncExternalStore needs.
  getState = (): ConnectionState => this.state;

  subscribeState = (listener: () => void): (() => void) => {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  };

  protected setState(next: ConnectionState): void {
    if (next === this.state) return;
    this.state = next;
    this.stateListeners.forEach((listener) => listener());
  }

  protected dispatch(event: string, data: unknown): void {
    (this.handlers.get(event) ?? []).forEach((handler) => handler(data));
  }

  protected clearHandlers(): void {
    this.handlers.clear();
  }
}
