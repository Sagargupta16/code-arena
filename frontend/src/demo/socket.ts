import { RoomSocket } from "../services/socketBase";
import { demoServer } from "./api";
import { DEMO_USER } from "./mode";
import type { DemoRoom } from "./room";

/** Client end of the in-browser demo server; same events as ArenaSocket. */
export class DemoSocket extends RoomSocket {
  private room: DemoRoom | null = null;
  private detach: (() => void) | null = null;
  // Bumped on every connect and disconnect, so a connect that was cancelled
  // (React StrictMode runs effects twice in dev) never attaches late.
  private generation = 0;

  connect(roomCode: string): void {
    const generation = ++this.generation;
    this.setState("connecting");
    // Attach on the next task, like a real handshake, so the page's own effect
    // has subscribed before the server greets it with the player list.
    setTimeout(() => {
      if (generation !== this.generation) return;
      const room = demoServer.get(roomCode);
      if (!room) {
        this.setState("closed");
        return;
      }
      this.room = room;
      this.detach = room.attach((event, data) => this.dispatch(event, data));
      this.setState("open");
    }, 0);
  }

  send(event: string, data: Record<string, unknown> = {}): void {
    this.room?.receive(DEMO_USER.id, event, data);
  }

  disconnect(): void {
    this.generation += 1;
    this.detach?.();
    this.detach = null;
    this.room = null;
    this.clearHandlers();
    this.setState("closed");
  }
}
