import { createClient } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import type { AuthProvider, AuthUser, CreateAuthUserResult } from "@/application/ports/AuthProvider";

export class SupabaseAuthProvider implements AuthProvider {
  async getCurrentUser(accessToken?: string | null): Promise<AuthUser | null> {
    if (accessToken) {
      const user = await this.getUserFromToken(accessToken);
      if (user) return user;
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;

    return {
      id: data.user.id,
      email: data.user.email ?? null,
      name: typeof data.user.user_metadata?.name === "string" ? data.user.user_metadata.name : null,
    };
  }

  async createPlayerUser(input: { email: string; password: string; name: string }): Promise<CreateAuthUserResult> {
    return this.createConfirmedUser(input);
  }

  async createRefereeUser(input: { email: string; password: string; name: string }): Promise<CreateAuthUserResult> {
    return this.createConfirmedUser(input);
  }

  private async getUserFromToken(accessToken: string): Promise<AuthUser | null> {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey) return null;

    const client = createClient(url, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data, error } = await client.auth.getUser(accessToken);
    if (error || !data.user) return null;

    return {
      id: data.user.id,
      email: data.user.email ?? null,
      name: typeof data.user.user_metadata?.name === "string" ? data.user.user_metadata.name : null,
    };
  }

  private async createConfirmedUser(input: { email: string; password: string; name: string }): Promise<CreateAuthUserResult> {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) {
      return { ok: false, message: "Server thieu SUPABASE_SERVICE_ROLE_KEY" };
    }

    const admin = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data, error } = await admin.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true,
      user_metadata: { name: input.name },
    });

    if (error || !data.user) {
      return { ok: false, message: error?.message ?? "Khong tao duoc user" };
    }

    return {
      ok: true,
      user: {
        id: data.user.id,
        email: data.user.email ?? input.email,
        name: input.name,
      },
    };
  }
}
