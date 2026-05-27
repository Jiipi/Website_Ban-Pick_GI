import type { AuthProvider } from "@/application/ports/AuthProvider";
import type { BanPickRepository } from "@/application/ports/BanPickRepository";
import { failure, success, type ServiceResult } from "@/application/shared/ServiceResult";
import { isValidName, sanitizeName } from "@/domain/common/constants";

export class AdminUserService {
  constructor(
    private readonly authProvider: AuthProvider,
    private readonly repository: BanPickRepository,
  ) {}

  async listUsers() {
    return this.repository.listUsers();
  }

  async updateUserRole(targetId: string, newRole: string) {
    if (!["ADMIN", "REFEREE"].includes(newRole)) return failure(400, "Role không hợp lệ");
    if (!targetId) return failure(400, "Thiếu user id");

    const users = await this.repository.listUsers();
    const target = users.find((u) => u.id === targetId);
    if (!target) return failure(404, "Không tìm thấy user");

    const updated = await this.repository.upsertUser({
      id: target.id,
      email: target.email,
      name: target.name ?? undefined,
      role: newRole,
    });
    return success({ user: updated });
  }

  async createReferee(payload: Record<string, unknown>): Promise<ServiceResult<{ ok: true; user: { id: string; email: string; name: string } }>> {
    const email = String(payload.email ?? "").trim().toLowerCase();
    const password = String(payload.password ?? "");
    const name = sanitizeName(String(payload.name ?? ""));

    if (!email || !email.includes("@")) {
      return failure(400, "Email khong hop le");
    }
    if (password.length < 6) {
      return failure(400, "Mat khau toi thieu 6 ky tu");
    }
    if (!isValidName(name)) {
      return failure(400, "Ten khong hop le");
    }

    const created = await this.authProvider.createRefereeUser({ email, password, name });
    if (!created.ok) {
      return failure(400, created.message);
    }

    await this.repository.upsertUser({
      id: created.user.id,
      email,
      name,
      role: "REFEREE",
    });

    return success({ ok: true, user: { id: created.user.id, email, name } });
  }
}
