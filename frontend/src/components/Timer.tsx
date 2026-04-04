interface Props {
  formatted: string;
  remaining: number;
}

export function Timer({ formatted, remaining }: Props) {
  const isUrgent = remaining > 0 && remaining <= 60;
  return (
    <span className={`font-mono text-sm font-bold tabular-nums ${isUrgent ? "text-red-400" : "text-emerald-400"}`}>
      {formatted}
    </span>
  );
}
