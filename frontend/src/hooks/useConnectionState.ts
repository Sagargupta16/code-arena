import { useSyncExternalStore } from "react";
import type { ConnectionState, RoomSocket } from "../services/socketBase";

const noop = () => () => {};
const closed = (): ConnectionState => "closed";

/** Live connection state of a room socket, re-rendering only when it changes. */
export function useConnectionState(socket: RoomSocket | null): ConnectionState {
  return useSyncExternalStore(socket?.subscribeState ?? noop, socket?.getState ?? closed);
}
