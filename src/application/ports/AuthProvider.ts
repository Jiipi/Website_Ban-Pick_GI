export type AuthUser = {
  id: string;
  email: string | null;
  name: string | null;
};

export type CreateAuthUserResult =
  | { ok: true; user: AuthUser }
  | { ok: false; message: string };

export interface AuthProvider {
  getCurrentUser(): Promise<AuthUser | null>;
  createPlayerUser(input: { email: string; password: string; name: string }): Promise<CreateAuthUserResult>;
  createRefereeUser(input: { email: string; password: string; name: string }): Promise<CreateAuthUserResult>;
}
