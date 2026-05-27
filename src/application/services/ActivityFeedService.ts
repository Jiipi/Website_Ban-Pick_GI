import type { ActivityEventRepository, CreateActivityInput } from "@/application/ports/ActivityEventRepository";
import type { FriendshipRepository } from "@/application/ports/FriendshipRepository";
import { success } from "@/application/shared/ServiceResult";

export class ActivityFeedService {
  constructor(
    private readonly repo: ActivityEventRepository,
    private readonly friendships: FriendshipRepository,
  ) {}

  async getGlobalFeed(limit = 30) {
    const events = await this.repo.listGlobalFeed(limit);
    return success({ events });
  }

  async getFriendsFeed(uid: string, limit = 30) {
    const friends = await this.friendships.listFriends(uid);
    const uids = [uid, ...friends.map((f) => f.uid)];
    const events = await this.repo.listForActors(uids, limit);
    return success({ events });
  }

  async record(input: CreateActivityInput) {
    const event = await this.repo.create(input);
    return success({ event });
  }
}
