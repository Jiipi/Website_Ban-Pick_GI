import type { FriendProfile, FriendshipRecord } from "@/domain/social/Friendship";

export interface FriendshipRepository {
  findFriendship(requesterUid: string, addresseeUid: string): Promise<FriendshipRecord | null>;
  findFriendshipPair(uidA: string, uidB: string): Promise<FriendshipRecord | null>;
  findById(id: string): Promise<FriendshipRecord | null>;
  createRequest(requesterUid: string, addresseeUid: string): Promise<FriendshipRecord>;
  updateStatus(id: string, status: "ACCEPTED" | "BLOCKED"): Promise<FriendshipRecord>;
  deleteFriendship(id: string): Promise<void>;
  listFriends(uid: string): Promise<FriendProfile[]>;
  listIncomingRequests(uid: string): Promise<FriendProfile[]>;
  listOutgoingRequests(uid: string): Promise<FriendProfile[]>;
}
