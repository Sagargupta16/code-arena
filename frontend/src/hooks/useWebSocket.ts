import { useEffect, useMemo } from "react";
import { ArenaSocket } from "../services/ws";
import type { RoomSocket } from "../services/socketBase";
import { DemoSocket } from "../demo/socket";
import { isDemo } from "../demo/mode";

// Returns the socket instance itself (not a ref) so pages can list it as an
// effect dependency and resubscribe whenever the room or token changes.
export function useWebSocket(roomCode: string | undefined, token: string | null): RoomSocket | null {
  const socket = useMemo<RoomSocket | null>(() => {
    if (!roomCode || !token) return null;
    return isDemo() ? new DemoSocket() : new ArenaSocket();
  }, [roomCode, token]);

  useEffect(() => {
    if (!socket || !roomCode || !token) return;
    socket.connect(roomCode, token);
    return () => socket.disconnect();
  }, [socket, roomCode, token]);

  return socket;
}
