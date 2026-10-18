import type { ConnectionState } from "../services/socketBase";

interface Props {
  state: ConnectionState;
  demo?: boolean;
}

const STYLES: Record<ConnectionState, { label: string; dot: string; text: string }> = {
  open: { label: "Live", dot: "bg-emerald-400", text: "text-emerald-300" },
  connecting: { label: "Connecting", dot: "bg-sky-400 animate-pulse", text: "text-sky-300" },
  reconnecting: { label: "Reconnecting", dot: "bg-amber-400 animate-pulse", text: "text-amber-300" },
  closed: { label: "Offline", dot: "bg-red-400", text: "text-red-300" },
};

export function ConnectionPill({ state, demo = false }: Props) {
  const style = STYLES[state];
  const label = demo && state === "open" ? "Demo" : style.label;
  return (
    <span
      role="status"
      title={demo ? "Demo mode: in-browser server with bot opponents" : `Connection: ${style.label}`}
      className={`inline-flex items-center gap-1.5 text-xs font-medium bg-gray-800 px-2 py-1 rounded ${style.text}`}
    >
      <span className={`w-2 h-2 rounded-full ${style.dot}`} />
      <span className="hidden sm:inline">{label}</span>
    </span>
  );
}
