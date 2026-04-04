import { useEffect, useRef } from "react";
import { ArenaSocket } from "../services/ws";

export function useWebSocket(roomCode: string | undefined, token: string | null) {
  const socketRef = useRef<ArenaSocket | null>(null);

  useEffect(() => {
    if (!roomCode || !token) return;
    const socket = new ArenaSocket();
    socket.connect(roomCode, token);
    socketRef.current = socket;
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [roomCode, token]);

  return socketRef;
}
