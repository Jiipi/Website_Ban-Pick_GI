import { prisma } from "@/lib/prisma";
import type { FriendshipRepository } from "@/application/ports/FriendshipRepository";
import type {
  FriendProfile,
  FriendshipRecord,
  FriendshipStatus,
} from "@/domain/social/Friendship";

export class PrismaFriendshipRepository implements FriendshipRepository {
  async findFriendship(requesterUid: string, addresseeUid: string): Promise<FriendshipRecord | null> {
    const row = await prisma.friendship.findUnique({
      where: { requesterUid_addresseeUid: { requesterUid, addresseeUid } },
    });
    return row ? toRecord(row) : null;
  }

  async findFriendshipPair(uidA: string, uidB: string): Promise<FriendshipRecord | null> {
    const row = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterUid: uidA, addresseeUid: uidB },
          { requesterUid: uidB, addresseeUid: uidA },
        ],
      },
    });
    return row ? toRecord(row) : null;
  }

  async findById(id: string): Promise<FriendshipRecord | null> {
    const row = await prisma.friendship.findUnique({ where: { id } });
    return row ? toRecord(row) : null;
  }

  async createRequest(requesterUid: string, addresseeUid: string): Promise<FriendshipRecord> {
    const row = await prisma.friendship.create({
      data: { requesterUid, addresseeUid, status: "PENDING" },
    });
    return toRecord(row);
  }

  async updateStatus(id: string, status: "ACCEPTED" | "BLOCKED"): Promise<FriendshipRecord> {
    const row = await prisma.friendship.update({ where: { id }, data: { status } });
    return toRecord(row);
  }

  async deleteFriendship(id: string): Promise<void> {
    await prisma.friendship.delete({ where: { id } });
  }

  async listFriends(uid: string): Promise<FriendProfile[]> {
    const rows = await prisma.friendship.findMany({
      where: {
        status: "ACCEPTED",
        OR: [{ requesterUid: uid }, { addresseeUid: uid }],
      },
      orderBy: { updatedAt: "desc" },
    });
    return Promise.all(rows.map((r) => this.toFriendProfile(r, uid, "MUTUAL")));
  }

  async listIncomingRequests(uid: string): Promise<FriendProfile[]> {
    const rows = await prisma.friendship.findMany({
      where: { addresseeUid: uid, status: "PENDING" },
      orderBy: { createdAt: "desc" },
    });
    return Promise.all(rows.map((r) => this.toFriendProfile(r, uid, "INCOMING")));
  }

  async listOutgoingRequests(uid: string): Promise<FriendProfile[]> {
    const rows = await prisma.friendship.findMany({
      where: { requesterUid: uid, status: "PENDING" },
      orderBy: { createdAt: "desc" },
    });
    return Promise.all(rows.map((r) => this.toFriendProfile(r, uid, "OUTGOING")));
  }

  private async toFriendProfile(
    row: { id: string; requesterUid: string; addresseeUid: string; status: string; createdAt: Date; updatedAt: Date },
    selfUid: string,
    direction: "OUTGOING" | "INCOMING" | "MUTUAL",
  ): Promise<FriendProfile> {
    const otherUid = row.requesterUid === selfUid ? row.addresseeUid : row.requesterUid;
    const lobby = await prisma.lobbyPlayer.findFirst({
      where: { uid: otherUid },
      orderBy: { updatedAt: "desc" },
      select: { uid: true, nickname: true, displayName: true, avatarUrl: true, customAvatarUrl: true },
    });
    return {
      id: row.id,
      uid: otherUid,
      nickname: lobby?.displayName ?? lobby?.nickname ?? otherUid,
      avatarUrl: lobby?.customAvatarUrl ?? lobby?.avatarUrl ?? null,
      status: row.status as FriendshipStatus,
      direction,
      since: row.updatedAt,
    };
  }
}

function toRecord(row: {
  id: string;
  requesterUid: string;
  addresseeUid: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}): FriendshipRecord {
  return {
    id: row.id,
    requesterUid: row.requesterUid,
    addresseeUid: row.addresseeUid,
    status: row.status as FriendshipStatus,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
