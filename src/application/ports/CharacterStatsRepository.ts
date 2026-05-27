export type CharacterStatsRecord = {
  characterId: string;
  pickCount: number;
  banCount: number;
};

export type RecentMatchRecord = {
  roomCode: string;
  action: string;
  player: string;
  bluePlayerName: string | null;
  redPlayerName: string | null;
  date: Date;
};

export type PairedCharacterRecord = {
  characterId: string;
  count: number;
};

export interface CharacterStatsRepository {
  countPicksByCharacter(characterId: string): Promise<number>;
  countBansByCharacter(characterId: string): Promise<number>;
  countFinishedRooms(): Promise<number>;
  listRecentLogsForCharacter(characterId: string, limit: number): Promise<RecentMatchRecord[]>;
  findPairedCharacters(characterId: string, limit: number): Promise<PairedCharacterRecord[]>;
  aggregatePicksByCharacter(): Promise<CharacterStatsRecord[]>;
  aggregateBansByCharacter(): Promise<CharacterStatsRecord[]>;
}
