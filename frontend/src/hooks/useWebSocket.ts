import { useEffect, useMemo } from "react";
import { ArenaSocket } from "../services/ws";

// Returns the socket instance itself (not a ref) so pages can list it as an
// effect dependency and resubscribe whenever the room or token changes.
export function useWebSocket(roomCode: string | undefined, token: string | null) {
  const socket = useMemo(() => (roomCode && token ? new ArenaSocket() : null), [roomCode, token]);

  useEffect(() => {
    if (!socket || !roomCode || !token) return;
    socket.connect(roomCode, token);
    return () => socket.disconnect();
  }, [socket, roomCode, token]);

  return socket;
}
