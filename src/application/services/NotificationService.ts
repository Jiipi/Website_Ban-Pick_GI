import type { NotificationRepository } from "@/application/ports/NotificationRepository";
import { failure, success } from "@/application/shared/ServiceResult";

export class NotificationService {
  constructor(private readonly repo: NotificationRepository) {}

  async list(uid: string, limit = 30) {
    const [items, unread] = await Promise.all([
      this.repo.listForUser(uid, limit),
      this.repo.countUnread(uid),
    ]);
    return success({ notifications: items, unread });
  }

  async countUnread(uid: string) {
    const unread = await this.repo.countUnread(uid);
    return success({ unread });
  }

  async markRead(uid: string, id: string) {
    if (!id) return failure(400, "Thiếu id");
    await this.repo.markAsRead(id, uid);
    return success({ updated: true });
  }

  async markAllRead(uid: string) {
    await this.repo.markAllAsRead(uid);
    return success({ updated: true });
  }

  async remove(uid: string, id: string) {
    await this.repo.deleteOne(id, uid);
    return success({ removed: true });
  }
}
