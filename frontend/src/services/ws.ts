type EventHandler = (data: any) => void;

export class ArenaSocket {
  private ws: WebSocket | null = null;
  private handlers: Map<string, EventHandler[]> = new Map();

  connect(roomCode: string, token: string): void {
    const wsUrl = import.meta.env.VITE_WS_URL || `ws://${window.location.host}`;
    this.ws = new WebSocket(`${wsUrl}/ws/${roomCode}?token=${token}`);

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const eventName = data.event;
      const eventHandlers = this.handlers.get(eventName) || [];
      eventHandlers.forEach((handler) => handler(data));
    };

    this.ws.onclose = () => {
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
      this.ws.send(JSON.stringify({ event, ...data }));
    }
  }

  disconnect(): void {
    this.ws?.close();
    this.ws = null;
    this.handlers.clear();
  }
}
