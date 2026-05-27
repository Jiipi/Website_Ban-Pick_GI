import { Crown } from "lucide-react";
import type { TeamSide } from "@/lib/types";

type RoleBadgeProps = {
  userIsHost: boolean;
  ownedTeam: TeamSide | null;
  sessionName: string | null;
};

export function RoleBadge({ userIsHost, ownedTeam, sessionName }: RoleBadgeProps) {
  if (!sessionName) return null;

  const className = userIsHost
    ? "is-host"
    : ownedTeam === "BLUE"
      ? "is-blue"
      : ownedTeam === "RED"
        ? "is-red"
        : "";

  const label = ownedTeam ?? "HOST";

  return (
    <span className={`draft-role-badge ${className}`}>
      {userIsHost && <Crown size={14} />}
      <span>{label}</span>
      <strong>{sessionName}</strong>
    </span>
  );
}
