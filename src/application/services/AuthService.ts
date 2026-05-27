import type { AuthProvider } from "@/application/ports/AuthProvider";
import type { BanPickRepository, UserRecord } from "@/application/ports/BanPickRepository";
import { failure, success, type ServiceResult } from "@/application/shared/ServiceResult";

export class AuthService {
  constructor(
    private readonly authProvider: AuthProvider,
    private readonly repository: BanPickRepository,
  ) {}

  async getCurrentUserRecord(): Promise<UserRecord | null> {
    const authUser = await this.authProvider.getCurrentUser();
    if (!authUser) return null;

    return this.repository.upsertUser({
      id: authUser.id,
      email: authUser.email ?? "",
      name: authUser.name,
    });
  }

  async requireUser(): Promise<ServiceResult<UserRecord>> {
    const user = await this.getCurrentUserRecord();
    if (!user) return failure(401, "Chua dang nhap");
    return success(user);
  }

  async requireAdmin(): Promise<ServiceResult<UserRecord>> {
    const user = await this.getCurrentUserRecord();
    if (!user) return failure(401, "Chua dang nhap");
    if (user.role !== "ADMIN") return failure(403, "Chi admin co quyen");
    return success(user);
  }
}
