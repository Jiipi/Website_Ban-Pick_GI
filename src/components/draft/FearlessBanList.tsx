"use client";

type FearlessBanListProps = {
  bannedCharacterIds: string[];
  characterMap: Map<string, { name: string }>;
};

export function FearlessBanList({ bannedCharacterIds, characterMap }: FearlessBanListProps) {
  if (bannedCharacterIds.length === 0) return null;

  return (
    <div className="fearless-ban-list">
      <div className="fearless-ban-header">
        <span>🚫</span>
        <span>Fearless Ban — Đã pick game trước</span>
      </div>
      <div className="fearless-ban-chips">
        {bannedCharacterIds.map((id) => (
          <span key={id} className="fearless-ban-chip">
            {characterMap.get(id)?.name ?? id}
          </span>
        ))}
      </div>
    </div>
  );
}
