import { Eye } from "lucide-react";
import type { TeamSide } from "@/lib/types";

type PlayerCardCircleProps = {
  team: TeamSide;
  name: string | null;
  uid: string | null;
  nickname: string | null;
  avatarUrl?: string | null;
  isActive: boolean;
  compact?: boolean;
};

export function PlayerCardCircle({
  team,
  name,
  uid,
  nickname,
  avatarUrl,
  isActive,
  compact,
}: PlayerCardCircleProps) {
  const isBlue = team === "BLUE";
  const display = nickname ?? name ?? (isBlue ? "Blue Player" : "Red Player");
  const initial = (nickname ?? name ?? "?")[0]?.toUpperCase() ?? "?";

  const avatarContent = avatarUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={avatarUrl} alt="" className="player-avatar-img" />
  ) : name ? (
    initial
  ) : (
    <Eye size={compact ? 14 : 26} />
  );

  if (compact) {
    return (
      <div className={`player-card-compact player-card-${isBlue ? "blue" : "red"} ${isActive ? "is-active" : ""}`}>
        <div className="player-avatar-ring">
          {avatarContent}
        </div>
        <p>{display}</p>
      </div>
    );
  }

  return (
    <div className={`player-card-circle player-card-${isBlue ? "blue" : "red"} ${isActive ? "is-active" : ""}`}>
      <div className="player-avatar-ring">
        {avatarContent}
      </div>
      <div className="player-card-copy">
        <p>{display}</p>
        {nickname && name && nickname !== name && <span>{name}</span>}
        {uid && <span>UID: {uid}</span>}
        {!name && <span>Waiting</span>}
      </div>
    </div>
  );
}
