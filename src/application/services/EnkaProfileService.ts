import type { EnkaGateway } from "@/application/ports/EnkaGateway";
import { failure, success } from "@/application/shared/ServiceResult";

export class EnkaProfileService {
  constructor(private readonly enkaGateway: EnkaGateway) {}

  async getProfile(uid: string) {
    if (!uid) {
      return failure(400, "Missing uid");
    }

    const result = await this.enkaGateway.fetchProfile(uid);
    if (!result.ok) {
      return failure(result.status, result.message);
    }

    return success({ profile: result.profile });
  }
}
