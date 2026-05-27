import type { FriendshipRepository } from "@/application/ports/FriendshipRepository";
import type { NotificationRepository } from "@/application/ports/NotificationRepository";
import { failure, success } from "@/application/shared/ServiceResult";

export class FriendshipService {
  constructor(
    private readonly repo: FriendshipRepository,
    private readonly notifications: NotificationRepository,
  ) {}

  async listFriends(uid: string) {
    const friends = await this.repo.listFriends(uid);
    return success({ friends });
  }

  async listPending(uid: string) {
    const [incoming, outgoing] = await Promise.all([
      this.repo.listIncomingRequests(uid),
      this.repo.listOutgoingRequests(uid),
    ]);
    return success({ incoming, outgoing });
  }

  async sendRequest(requesterUid: string, addresseeUid: string, requesterNickname: string) {
    if (requesterUid === addresseeUid) return failure(400, "Không thể kết bạn với chính mình");

    const existing = await this.repo.findFriendshipPair(requesterUid, addresseeUid);
    if (existing) {
      if (existing.status === "ACCEPTED") return failure(409, "Đã là bạn bè");
      if (existing.status === "PENDING") return failure(409, "Đã có lời mời chờ xử lý");
      if (existing.status === "BLOCKED") return failure(403, "Không thể gửi lời mời");
    }

    const friendship = await this.repo.createRequest(requesterUid, addresseeUid);
    await this.notifications.create({
      recipientUid: addresseeUid,
      type: "FRIEND_REQUEST",
      title: "Lời mời kết bạn mới",
      body: `${requesterNickname} muốn kết bạn với bạn`,
      link: "/friends",
      metadata: { fromUid: requesterUid, friendshipId: friendship.id },
    });

    return success({ friendship });
  }

  async acceptRequest(currentUid: string, friendshipId: string, accepterNickname: string) {
    const friendship = await this.repo.findById(friendshipId);
    if (!friendship) return failure(404, "Không tìm thấy lời mời");
    if (friendship.addresseeUid !== currentUid) return failure(403, "Không có quyền chấp nhận");
    if (friendship.status !== "PENDING") return failure(400, "Lời mời đã được xử lý");

    const updated = await this.repo.updateStatus(friendshipId, "ACCEPTED");
    await this.notifications.create({
      recipientUid: friendship.requesterUid,
      type: "FRIEND_ACCEPTED",
      title: "Lời mời đã được chấp nhận",
      body: `${accepterNickname} đã chấp nhận lời mời kết bạn`,
      link: "/friends",
      metadata: { fromUid: currentUid, friendshipId },
    });

    return success({ friendship: updated });
  }

  async rejectRequest(currentUid: string, friendshipId: string) {
    const friendship = await this.repo.findById(friendshipId);
    if (!friendship) return failure(404, "Không tìm thấy lời mời");
    if (friendship.addresseeUid !== currentUid && friendship.requesterUid !== currentUid) {
      return failure(403, "Không có quyền");
    }
    await this.repo.deleteFriendship(friendshipId);
    return success({ removed: true });
  }

  async removeFriend(currentUid: string, otherUid: string) {
    const friendship = await this.repo.findFriendshipPair(currentUid, otherUid);
    if (!friendship) return failure(404, "Không tìm thấy quan hệ bạn bè");
    await this.repo.deleteFriendship(friendship.id);
    return success({ removed: true });
  }
}
