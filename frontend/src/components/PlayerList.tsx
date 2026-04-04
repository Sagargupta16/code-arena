interface Player {
  id: string;
  username: string;
}

interface Props {
  players: Player[];
  hostId: string;
}

export function PlayerList({ players, hostId }: Props) {
  return (
    <div className="space-y-2">
      {players.map((p) => (
        <div key={p.id} className="flex items-center gap-2 bg-gray-800 p-3 rounded">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
            {p.username[0].toUpperCase()}
          </div>
          <span>{p.username}</span>
          {p.id === hostId && (
            <span className="text-xs bg-yellow-600 px-2 py-0.5 rounded ml-auto">HOST</span>
          )}
        </div>
      ))}
    </div>
  );
}
