type EventHandler = (data: any) => void;

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

  on(event: string, handler: EventHandler): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }
    this.handlers.get(event)!.push(handler);
    return () => {
      const handlers = this.handlers.get(event) || [];
      this.handlers.set(event, handlers.filter((h) => h !== handler));
    };
  }

  send(event: string, data: Record<string, any> = {}): void {
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
