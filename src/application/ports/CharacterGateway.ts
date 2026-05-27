export type CharacterElement = "Pyro" | "Hydro" | "Anemo" | "Electro" | "Dendro" | "Cryo" | "Geo" | "Physical";

export type CharacterListItem = {
  id: string;
  name: string;
  element: CharacterElement;
  rarity: 4 | 5;
  sideIconUrl: string;
  iconUrl: string;
  chibiIconUrl: string;
};

export interface CharacterGateway {
  getCharacters(): Promise<CharacterListItem[]>;
  resetCache(): void;
}
