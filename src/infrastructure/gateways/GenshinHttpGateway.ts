import { getCharacters, resetGenshinCharacterCache } from "@/lib/genshin";
import type { CharacterGateway, CharacterListItem } from "@/application/ports/CharacterGateway";

export class GenshinHttpGateway implements CharacterGateway {
  async getCharacters(): Promise<CharacterListItem[]> {
    return getCharacters();
  }

  resetCache(): void {
    resetGenshinCharacterCache();
  }
}
