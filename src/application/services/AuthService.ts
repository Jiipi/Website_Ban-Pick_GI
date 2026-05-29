import type { AuthProvider } from "@/application/ports/AuthProvider";
import type { BanPickRepository, UserRecord } from "@/application/ports/BanPickRepository";
import { failure, success, type ServiceResult } from "@/application/shared/ServiceResult";
import { isValidName, sanitizeName } from "@/domain/common/constants";

export class AuthService {
  constructor(
    private readonly authProvider: AuthProvider,
    private readonly repository: BanPickRepository,
  ) {}

  async getCurrentUserRecord(accessToken?: string | null): Promise<UserRecord | null> {
    const authUser = await this.authProvider.getCurrentUser(accessToken);
    if (!authUser) return null;

    return this.repository.upsertUser({
      id: authUser.id,
      email: authUser.email ?? "",
      name: authUser.name,
    });
  }

  async registerPlayer(payload: Record<string, unknown>): Promise<ServiceResult<{
    ok: true;
    user: { id: string; email: string; name: string; role: "PLAYER" };
  }>> {
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

    const created = await this.authProvider.createPlayerUser({ email, password, name });
    if (!created.ok) {
      return failure(400, created.message);
    }

    await this.repository.upsertUser({
      id: created.user.id,
      email,
      name,
      role: "PLAYER",
    });

    return success({ ok: true, user: { id: created.user.id, email, name, role: "PLAYER" } });
  }

  async requireUser(accessToken?: string | null): Promise<ServiceResult<UserRecord>> {
    const user = await this.getCurrentUserRecord(accessToken);
    if (!user) return failure(401, "Chua dang nhap");
    return success(user);
  }

  async requireAdmin(accessToken?: string | null): Promise<ServiceResult<UserRecord>> {
    const user = await this.getCurrentUserRecord(accessToken);
    if (!user) return failure(401, "Chua dang nhap");
    if (user.role !== "ADMIN") return failure(403, "Chi admin co quyen");
    return success(user);
  }
}
