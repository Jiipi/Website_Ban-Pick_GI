export type EnkaShowcaseCharacter = {
  avatarId: number;
  characterId: string;
  level: number;
  element?: string;
};

export type EnkaProfile = {
  uid: string;
  nickname: string;
  level: number;
  signature?: string | null;
  avatarUrl?: string | null;
  showcase: EnkaShowcaseCharacter[];
};

export type EnkaProfileResult =
  | { ok: true; profile: EnkaProfile }
  | { ok: false; status: number; message: string };

export type CharacterMeta = {
  slug: string;
  name: string;
  avatarId?: string | number;
  iconName?: string;
  element?: string;
};

export interface EnkaGateway {
  fetchProfile(uid: string): Promise<EnkaProfileResult>;
  loadCharacterMap(): Promise<{
    list: CharacterMeta[];
    byAvatarId: Record<string, CharacterMeta>;
  }>;
  resetCharacterCache(): void;
}
