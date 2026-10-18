import type { Api } from "../services/api";
import { DEMO_USER } from "./mode";
import { DemoServer } from "./server";
import { loadDemoStats, recordDemoMatch } from "./stats";

/** The one in-memory server every demo page and socket talks to. */
export const demoServer = new DemoServer((result) => recordDemoMatch(result, DEMO_USER.id));

const offline = async (): Promise<never> => {
  throw new Error("GitHub sign-in is not used in demo mode");
};

/** Same surface as the REST client, answered by the demo server. */
export const demoApi: Api = {
  getGitHubLoginUrl: offline,
  githubCallback: offline,

  getMe: async () => ({ ...DEMO_USER, avatar: "", stats: loadDemoStats() }),

  createRoom: async (settings) => ({ code: demoServer.createRoom(settings, DEMO_USER).code }),

  getRoom: async (code) => {
    const room = demoServer.get(code);
    if (!room) throw new Error(`Room ${code} is gone: demo rooms only live until the tab reloads`);
    room.prepareLobby();
    return room.toRoom();
  },

  joinRoom: async (code) => {
    const room = demoServer.joinRoom(code, DEMO_USER);
    return { code: room.code, players: room.members.map((m) => m.id) };
  },
};
