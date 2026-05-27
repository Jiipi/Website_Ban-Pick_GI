import { fetchEnkaProfile, loadCharacterMap, resetCharacterCache } from "@/lib/enka";
import type { EnkaGateway, EnkaProfileResult } from "@/application/ports/EnkaGateway";

export class EnkaHttpGateway implements EnkaGateway {
  async fetchProfile(uid: string): Promise<EnkaProfileResult> {
    return fetchEnkaProfile(uid);
  }

  async loadCharacterMap() {
    return loadCharacterMap();
  }

  resetCharacterCache(): void {
    resetCharacterCache();
  }
}
