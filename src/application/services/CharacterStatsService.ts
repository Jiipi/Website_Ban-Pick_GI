import type { CharacterStatsRepository } from "@/application/ports/CharacterStatsRepository";
import { failure, success } from "@/application/shared/ServiceResult";

export class CharacterStatsService {
  constructor(private readonly repository: CharacterStatsRepository) {}

  async getAllStats() {
    try {
      const [picks, bans, totalMatches] = await Promise.all([
        this.repository.aggregatePicksByCharacter(),
        this.repository.aggregateBansByCharacter(),
        this.repository.countFinishedRooms(),
      ]);

      const map = new Map<string, { pickCount: number; banCount: number }>();
      for (const p of picks) {
        const cur = map.get(p.characterId) ?? { pickCount: 0, banCount: 0 };
        cur.pickCount = p.pickCount;
        map.set(p.characterId, cur);
      }
      for (const b of bans) {
        const cur = map.get(b.characterId) ?? { pickCount: 0, banCount: 0 };
        cur.banCount = b.banCount;
        map.set(b.characterId, cur);
      }

      const stats = Array.from(map.entries()).map(([characterId, counts]) => ({
        characterId,
        pickCount: counts.pickCount,
        banCount: counts.banCount,
        totalMatches,
      }));

      return success({ stats, totalMatches });
    } catch {
      return failure(500, "Failed to load character stats");
    }
  }

  async getCharacterStats(characterId: string) {
    try {
      const [pickCount, banCount, totalMatches, recentMatches, pairedWith] = await Promise.all([
        this.repository.countPicksByCharacter(characterId),
        this.repository.countBansByCharacter(characterId),
        this.repository.countFinishedRooms(),
        this.repository.listRecentLogsForCharacter(characterId, 10),
        this.repository.findPairedCharacters(characterId, 6),
      ]);

      return success({
        characterId,
        pickCount,
        banCount,
        totalMatches,
        pickRate: totalMatches > 0 ? Math.round((pickCount / totalMatches) * 100) : 0,
        banRate: totalMatches > 0 ? Math.round((banCount / totalMatches) * 100) : 0,
        recentMatches,
        pairedWith,
      });
    } catch {
      return failure(500, "Failed to load character stats");
    }
  }
}
