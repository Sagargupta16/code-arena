import type { MatchResult, Player, RoomSettings } from "../types";
import { BOT_HOST, OPPONENTS, type Bot } from "./bots";
import { BOT_JOIN_GAP_MS, DEMO_TIME_LIMIT } from "./config";
import { DemoRoom } from "./room";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomCode(): string {
  return Array.from({ length: 6 }, () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]).join("");
}

/** Bots drop into the lobby one by one, like friends opening the invite. */
function joinLater(room: DemoRoom, bots: Bot[]): void {
  bots.forEach((bot, i) => setTimeout(() => room.addBot(bot), (i + 1) * BOT_JOIN_GAP_MS));
}

/** Registry of demo rooms. Rooms live in memory for the life of the tab. */
export class DemoServer {
  private rooms = new Map<string, DemoRoom>();

  private onFinished: (result: MatchResult, room: DemoRoom) => void;

  constructor(onFinished: (result: MatchResult, room: DemoRoom) => void = () => {}) {
    this.onFinished = onFinished;
  }

  /** You host: two bots drop into the lobby a moment later. */
  createRoom(settings: RoomSettings, host: Player): DemoRoom {
    let code = randomCode();
    while (this.rooms.has(code)) code = randomCode();
    // Every demo match runs on the same short clock, whatever the form picked.
    const room = this.newRoom(code, host.id, { ...settings, time_mode: "custom", time_limit: DEMO_TIME_LIMIT });
    room.addMember(host);
    joinLater(room, OPPONENTS);
    return room;
  }

  /** Any code works: a bot hosts the room you join and starts the match. */
  joinRoom(code: string, player: Player): DemoRoom {
    let room = this.rooms.get(code);
    if (!room) {
      room = this.newRoom(code, BOT_HOST.id, { mode: "live_status", time_limit: DEMO_TIME_LIMIT, time_mode: "custom", difficulty_filter: null, tag_filters: [] });
      room.addBot(BOT_HOST);
      joinLater(room, [OPPONENTS[0]]);
    }
    room.addMember(player);
    return room;
  }

  get(code: string): DemoRoom | undefined {
    return this.rooms.get(code);
  }

  private newRoom(code: string, hostId: string, settings: RoomSettings): DemoRoom {
    const room = new DemoRoom(code, hostId, settings, (result) => this.onFinished(result, room));
    this.rooms.set(code, room);
    return room;
  }
}
