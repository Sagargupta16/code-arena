import type { ServerEvents } from "../types";

type EventHandler = (data: unknown) => void;

export class ArenaSocket {
  private ws: WebSocket | null = null;
  private handlers: Map<string, EventHandler[]> = new Map();

  connect(roomCode: string, token: string): void {
    const wsUrl = import.meta.env.VITE_WS_URL || `ws://${window.location.host}`;
    const url = `${wsUrl}/ws/${roomCode}?token=${token}`;
    console.log("[WS] Connecting to:", url.replace(/token=.*/, "token=***"));
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.log("[WS] Connected");
    };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("[WS] Received:", data.event, data);
      const eventName = data.event;
      const eventHandlers = this.handlers.get(eventName) || [];
      eventHandlers.forEach((handler) => handler(data));
    };

    this.ws.onerror = (event) => {
      console.error("[WS] Error:", event);
    };

    this.ws.onclose = (event) => {
      console.log("[WS] Closed:", event.code, event.reason);
      const closeHandlers = this.handlers.get("close") || [];
      closeHandlers.forEach((handler) => handler({}));
    };
  }

  on<E extends keyof ServerEvents>(event: E, handler: (data: ServerEvents[E]) => void): () => void {
    const h = handler as EventHandler;
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }
    this.handlers.get(event)!.push(h);
    return () => {
      const handlers = this.handlers.get(event) || [];
      this.handlers.set(event, handlers.filter((x) => x !== h));
    };
  }

  send(event: string, data: Record<string, unknown> = {}): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      console.log("[WS] Sending:", event, data);
      this.ws.send(JSON.stringify({ event, ...data }));
    } else {
      console.warn("[WS] Cannot send, state:", this.ws?.readyState);
    }
  }

  disconnect(): void {
    this.ws?.close();
    this.ws = null;
    this.handlers.clear();
  }
}
