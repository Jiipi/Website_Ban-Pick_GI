import type { CharacterGateway } from "@/application/ports/CharacterGateway";
import type { EnkaGateway } from "@/application/ports/EnkaGateway";
import { success } from "@/application/shared/ServiceResult";

export class CharacterCatalogService {
  constructor(
    private readonly characterGateway: CharacterGateway,
    private readonly enkaGateway: EnkaGateway,
  ) {}

  async listCharacters(input: { refresh: boolean }) {
    if (input.refresh) {
      this.enkaGateway.resetCharacterCache();
      this.characterGateway.resetCache();
    }

    const characters = await this.characterGateway.getCharacters();
    return success({
      count: characters.length,
      characters: characters.map((character) => ({
        id: character.id,
        name: character.name,
        element: character.element,
        rarity: character.rarity,
        chibiIconUrl: character.chibiIconUrl ?? null,
      })),
    });
  }
}
