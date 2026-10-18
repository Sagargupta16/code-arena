import type { Player } from "../types";

const DEMO_FLAG = "demo";

/** The local player in demo mode. */
export const DEMO_USER: Player = { id: "demo-you", username: "you" };
export const DEMO_TOKEN = "demo";

/** Demo mode swaps the REST client and the socket for the in-browser server. */
export function isDemo(): boolean {
  return localStorage.getItem(DEMO_FLAG) === "1";
}

export function setDemo(on: boolean): void {
  if (on) localStorage.setItem(DEMO_FLAG, "1");
  else localStorage.removeItem(DEMO_FLAG);
}
