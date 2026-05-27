import type { BanPickRepository } from "@/application/ports/BanPickRepository";
import { failure, success } from "@/application/shared/ServiceResult";
import { requireClientId } from "@/application/shared/payload";
import { MAX_CHAT_HISTORY, MAX_CHAT_MESSAGE_LENGTH, isValidName, sanitizeName } from "@/domain/common/constants";
import { roomAccessPolicy } from "@/domain/room/RoomAccessPolicy";

const RATE_LIMIT_WINDOW_MS = 10_000;
const RATE_LIMIT_MAX = 10;

export class ChatService {
  private readonly rateBuckets = new Map<string, number[]>();

  constructor(private readonly repository: BanPickRepository) {}

  async getMessages(roomCode: string | null, clientId: string) {
    if (!roomCode) {
      return failure(400, "Missing roomCode");
    }

    const member = await this.requireRoomMember(roomCode, clientId);
    if (!member.ok) return member;

    const messages = await this.repository.findChatMessages(member.data.room.id, MAX_CHAT_HISTORY);
    return success({ messages });
  }

  async sendMessage(payload: Record<string, unknown>) {
    const roomCode = String(payload.roomCode ?? "").toUpperCase();
    const sender = sanitizeName(String(payload.sender ?? ""));
    const message = String(payload.message ?? "").trim();

    const clientIdResult = requireClientId(payload);
    if (!clientIdResult.ok) return clientIdResult;

    if (!this.checkRate(clientIdResult.data)) {
      return failure(429, "Gui qua nhanh, cho vai giay");
    }

    if (!roomCode || !message) {
      return failure(400, "Missing required fields");
    }

    if (!isValidName(sender)) {
      return failure(400, "Invalid sender name");
    }

    if (message.length > MAX_CHAT_MESSAGE_LENGTH) {
      return failure(400, "Message too long");
    }

    const member = await this.requireRoomMember(roomCode, clientIdResult.data);
    if (!member.ok) return member;

    const role = roomAccessPolicy.chatRoleFromSession(member.data.room, clientIdResult.data);
    if (!role) {
      return failure(403, "Ban khong co quyen chat trong phong nay");
    }

    const saved = await this.repository.createChatMessage({
      roomId: member.data.room.id,
      sender,
      message,
      role,
    });

    return success({ message: saved });
  }

  private async requireRoomMember(roomCode: string, clientId: string) {
    if (!clientId) {
      return failure(400, "Missing clientId");
    }

    const room = await this.repository.findRoomByCode(roomCode.toUpperCase());
    if (!room) {
      return failure(404, "Room not found");
    }

    const { role, team } = roomAccessPolicy.resolveRole(room, clientId);
    if (!role) {
      return failure(403, "Ban khong co quyen truy cap phong nay");
    }

    return success({ room, role, team });
  }

  private checkRate(clientId: string): boolean {
    const now = Date.now();
    const bucket = (this.rateBuckets.get(clientId) ?? []).filter((time) => now - time < RATE_LIMIT_WINDOW_MS);
    if (bucket.length >= RATE_LIMIT_MAX) {
      this.rateBuckets.set(clientId, bucket);
      return false;
    }
    bucket.push(now);
    this.rateBuckets.set(clientId, bucket);
    return true;
  }
}
