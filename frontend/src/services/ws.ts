import { RoomSocket } from "./socketBase";

export const MAX_RETRIES = 5;

/** Exponential backoff: 0.5s, 1s, 2s, 4s, then capped at 8s. */
export function backoffDelay(attempt: number): number {
  return Math.min(500 * 2 ** attempt, 8000);
}

// 1008 (policy violation) and the 4000-4999 application range mean the server
// rejected us on purpose (bad token, full room); retrying would loop forever.
function isRejection(code: number): boolean {
  return code === 1008 || (code >= 4000 && code < 5000);
}

// Payloads include submitted code, so trace logging stays out of production builds.
const debug: (...args: unknown[]) => void = import.meta.env.DEV
  ? (...args) => console.log("[WS]", ...args)
  : () => {};

export class ArenaSocket extends RoomSocket {
  private ws: WebSocket | null = null;
  private url = "";
  private retries = 0;
  private retryTimer: ReturnType<typeof setTimeout> | undefined;
  private closedByClient = false;

  connect(roomCode: string, token: string): void {
    const wsUrl = import.meta.env.VITE_WS_URL || `ws://${window.location.host}`;
    this.url = `${wsUrl}/ws/${roomCode}?token=${token}`;
    this.closedByClient = false;
    this.retries = 0;
    this.open();
  }

  private open(): void {
    debug("Connecting to:", this.url.replace(/token=.*/, "token=***"));
    this.setState(this.retries === 0 ? "connecting" : "reconnecting");
    const ws = new WebSocket(this.url);
    this.ws = ws;

    ws.onopen = () => {
      this.retries = 0;
      this.setState("open");
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      debug("Received:", data.event, data);
      this.dispatch(data.event, data);
    };

    ws.onerror = (event) => {
      console.error("[WS] Error:", event);
    };

    ws.onclose = (event) => {
      debug("Closed:", event.code, event.reason);
      // A socket we already replaced or closed ourselves must not trigger a retry.
      if (this.ws !== ws || this.closedByClient) return;
      this.ws = null;
      if (this.retries < MAX_RETRIES && !isRejection(event.code)) {
        this.setState("reconnecting");
        this.retryTimer = setTimeout(() => this.open(), backoffDelay(this.retries++));
        return;
      }
      this.setState("closed");
      this.dispatch("close", {});
    };
  }

  send(event: string, data: Record<string, unknown> = {}): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      debug("Sending:", event, data);
      this.ws.send(JSON.stringify({ event, ...data }));
    } else {
      console.warn("[WS] Cannot send, state:", this.ws?.readyState);
    }
  }

  disconnect(): void {
    this.closedByClient = true;
    clearTimeout(this.retryTimer);
    this.ws?.close();
    this.ws = null;
    this.clearHandlers();
    this.setState("closed");
  }
}
