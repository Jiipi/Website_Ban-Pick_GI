import type { TournamentRepository, CreateTournamentInput, UpdateMatchInput } from "@/application/ports/TournamentRepository";
import { failure, success } from "@/application/shared/ServiceResult";
import {
  generateSingleElimBracket,
  generateDoubleElimBracket,
  generateRoundRobinBracket,
  getNextMatchSlot,
} from "@/domain/tournament/Tournament";

export class TournamentService {
  constructor(private readonly repo: TournamentRepository) {}

  // ── List ──
  async listTournaments(filter: { status?: string; limit?: number } = {}) {
    const list = await this.repo.listTournaments(filter);
    return success({ tournaments: list });
  }

  // ── Detail ──
  async getTournament(slug: string) {
    const tournament = await this.repo.findTournamentBySlug(slug);
    if (!tournament) return failure(404, "Không tìm thấy giải đấu");

    const [participants, matches] = await Promise.all([
      this.repo.listParticipants(tournament.id),
      this.repo.listMatches(tournament.id),
    ]);

    return success({ tournament, participants, matches });
  }

  // ── Create ──
  async createTournament(input: CreateTournamentInput) {
    const existing = await this.repo.findTournamentBySlug(input.slug);
    if (existing) return failure(409, "Slug đã tồn tại");

    const tournament = await this.repo.createTournament(input);
    return success({ tournament });
  }

  // ── Add Participant ──
  async addParticipant(tournamentId: string, playerUid: string, playerNickname: string, playerAvatarUrl: string | null) {
    const tournament = await this.repo.findTournamentById(tournamentId);
    if (!tournament) return failure(404, "Không tìm thấy giải đấu");
    if (tournament.status !== "UPCOMING") return failure(400, "Chỉ có thể đăng ký khi giải đấu chưa bắt đầu");

    const participants = await this.repo.listParticipants(tournamentId);
    if (participants.length >= tournament.maxTeams) return failure(400, "Giải đấu đã đủ số đội");
    if (participants.some((p) => p.playerUid === playerUid)) return failure(409, "Người chơi đã đăng ký");

    const participant = await this.repo.addParticipant({
      tournamentId,
      playerUid,
      playerNickname,
      playerAvatarUrl,
      seed: null,
    });
    return success({ participant });
  }

  // ── Remove Participant ──
  async removeParticipant(tournamentId: string, playerUid: string) {
    const tournament = await this.repo.findTournamentById(tournamentId);
    if (!tournament) return failure(404, "Không tìm thấy giải đấu");
    if (tournament.status !== "UPCOMING") return failure(400, "Không thể huỷ đăng ký khi giải đã bắt đầu");

    await this.repo.removeParticipant(tournamentId, playerUid);
    return success({ removed: true });
  }

  // ── Generate Bracket ──
  async generateBracket(tournamentId: string) {
    const tournament = await this.repo.findTournamentById(tournamentId);
    if (!tournament) return failure(404, "Không tìm thấy giải đấu");
    if (tournament.status !== "UPCOMING") return failure(400, "Bracket chỉ được tạo khi giải đấu chưa bắt đầu");

    const participants = await this.repo.listParticipants(tournamentId);
    if (participants.length < 2) return failure(400, "Cần ít nhất 2 đội để tạo bracket");

    // Auto-seed by join order (1, 2, 3, ...)
    const seeded = participants.map((p, idx) => ({ ...p, seed: p.seed ?? idx + 1 }));

    // Select bracket generator based on format
    let matchStubs;
    switch (tournament.format) {
      case "DOUBLE_ELIM":
        matchStubs = generateDoubleElimBracket(seeded);
        break;
      case "ROUND_ROBIN":
        matchStubs = generateRoundRobinBracket(seeded);
        break;
      default:
        matchStubs = generateSingleElimBracket(seeded);
    }

    // Clear old matches if any
    await this.repo.deleteMatchesByTournament(tournamentId);

    const matches = await this.repo.createMatches(
      matchStubs.map((m) => ({
        tournamentId,
        round: m.round,
        matchNumber: m.matchNumber,
        blueParticipantId: m.blueParticipantId,
        redParticipantId: m.redParticipantId,
        winnerParticipantId: m.winnerParticipantId,
      })),
    );

    // Update status to ONGOING
    await this.repo.updateTournamentStatus(tournamentId, "ONGOING");

    // Auto-advance BYEs in round 1
    const byeMatches = matches.filter((m) => m.round === 1 && m.winnerParticipantId);
    for (const bm of byeMatches) {
      await this.propagateWinner(tournamentId, bm.round, bm.matchNumber, bm.winnerParticipantId!, matches);
    }

    // Re-fetch after propagation
    const finalMatches = await this.repo.listMatches(tournamentId);
    return success({ matches: finalMatches });
  }

  // ── Record Match Result ──
  async recordMatchResult(matchId: string, winnerParticipantId: string, roomCode?: string) {
    const match = await this.repo.findMatchById(matchId);
    if (!match) return failure(404, "Không tìm thấy trận đấu");
    if (match.winnerParticipantId) return failure(400, "Trận đấu đã có kết quả");

    // Validate winner is a participant of this match
    if (winnerParticipantId !== match.blueParticipantId && winnerParticipantId !== match.redParticipantId) {
      return failure(400, "Winner phải là một trong hai đội");
    }

    await this.repo.updateMatch({
      matchId,
      winnerParticipantId,
      roomCode: roomCode ?? match.roomCode,
      completedAt: new Date(),
    });

    // Propagate winner to next round
    const allMatches = await this.repo.listMatches(match.tournamentId);
    await this.propagateWinner(match.tournamentId, match.round, match.matchNumber, winnerParticipantId, allMatches);

    // Check if tournament is finished (final match has winner)
    const updatedMatches = await this.repo.listMatches(match.tournamentId);
    const maxRound = Math.max(...updatedMatches.map((m) => m.round));
    const finalMatch = updatedMatches.find((m) => m.round === maxRound && m.matchNumber === 0);
    if (finalMatch?.winnerParticipantId) {
      await this.repo.updateTournamentStatus(match.tournamentId, "FINISHED");
    }

    return success({ updated: true });
  }

  // ── Link Room ──
  async linkRoom(matchId: string, roomCode: string) {
    const match = await this.repo.findMatchById(matchId);
    if (!match) return failure(404, "Không tìm thấy trận đấu");

    await this.repo.updateMatch({ matchId, roomCode });
    return success({ updated: true });
  }

  // ── Private helpers ──

  private async propagateWinner(
    tournamentId: string,
    round: number,
    matchNumber: number,
    winnerParticipantId: string,
    allMatches: { id: string; round: number; matchNumber: number }[],
  ) {
    const next = getNextMatchSlot(round, matchNumber);
    const nextMatch = allMatches.find((m) => m.round === next.round && m.matchNumber === next.matchNumber);
    if (!nextMatch) return; // This was the final

    const update: UpdateMatchInput = { matchId: nextMatch.id };
    if (next.slot === "blue") {
      update.blueParticipantId = winnerParticipantId;
    } else {
      update.redParticipantId = winnerParticipantId;
    }

    await this.repo.updateMatch(update);
  }
}
