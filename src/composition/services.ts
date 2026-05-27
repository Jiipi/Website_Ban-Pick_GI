import { AdminUserService } from "@/application/services/AdminUserService";
import { AchievementService } from "@/application/services/AchievementService";
import { ActivityFeedService } from "@/application/services/ActivityFeedService";
import { ArchiveService } from "@/application/services/ArchiveService";
import { AuthService } from "@/application/services/AuthService";
import { BuildService } from "@/application/services/BuildService";
import { CharacterCatalogService } from "@/application/services/CharacterCatalogService";
import { CharacterStatsService } from "@/application/services/CharacterStatsService";
import { ChibiImageService } from "@/application/services/ChibiImageService";
import { ChatService } from "@/application/services/ChatService";
import { CostCatalogService } from "@/application/services/CostCatalogService";
import { DraftService } from "@/application/services/DraftService";
import { EnkaProfileService } from "@/application/services/EnkaProfileService";
import { FriendshipService } from "@/application/services/FriendshipService";
import { HistoryService } from "@/application/services/HistoryService";
import { HostRoomService } from "@/application/services/HostRoomService";
import { InviteService } from "@/application/services/InviteService";
import { LeaderboardService } from "@/application/services/LeaderboardService";
import { LobbyService } from "@/application/services/LobbyService";
import { MissionService } from "@/application/services/MissionService";
import { NotificationService } from "@/application/services/NotificationService";
import { ProfileService } from "@/application/services/ProfileService";
import { RoomService } from "@/application/services/RoomService";
import { SessionService } from "@/application/services/SessionService";
import { SystemHealthService } from "@/application/services/SystemHealthService";
import { TournamentService } from "@/application/services/TournamentService";
import { UserSettingsService } from "@/application/services/UserSettingsService";
import { WeaponCatalogService } from "@/application/services/WeaponCatalogService";
import { SupabaseAuthProvider } from "@/infrastructure/auth/SupabaseAuthProvider";
import { ChibiHttpGateway } from "@/infrastructure/gateways/ChibiHttpGateway";
import { EnkaHttpGateway } from "@/infrastructure/gateways/EnkaHttpGateway";
import { GenshinHttpGateway } from "@/infrastructure/gateways/GenshinHttpGateway";
import { GenshinWeaponGateway } from "@/infrastructure/gateways/GenshinWeaponGateway";
import { FileCostCatalogRepository } from "@/infrastructure/repositories/FileCostCatalogRepository";
import { PrismaActivityEventRepository } from "@/infrastructure/repositories/PrismaActivityEventRepository";
import { PrismaBanPickRepository } from "@/infrastructure/repositories/PrismaBanPickRepository";
import { PrismaCharacterStatsRepository } from "@/infrastructure/repositories/PrismaCharacterStatsRepository";
import { PrismaEngagementMetricsRepository } from "@/infrastructure/repositories/PrismaEngagementMetricsRepository";
import { PrismaFriendshipRepository } from "@/infrastructure/repositories/PrismaFriendshipRepository";
import { PrismaNotificationRepository } from "@/infrastructure/repositories/PrismaNotificationRepository";
import { PrismaPlayerStatsRepository } from "@/infrastructure/repositories/PrismaPlayerStatsRepository";
import { PrismaSystemHealthRepository } from "@/infrastructure/repositories/PrismaSystemHealthRepository";
import { PrismaTournamentRepository } from "@/infrastructure/repositories/PrismaTournamentRepository";
import { PrismaUserSettingsRepository } from "@/infrastructure/repositories/PrismaUserSettingsRepository";

const repository = new PrismaBanPickRepository();
const costCatalogRepository = new FileCostCatalogRepository();
const authProvider = new SupabaseAuthProvider();
const enkaGateway = new EnkaHttpGateway();
const characterGateway = new GenshinHttpGateway();
const chibiImageGateway = new ChibiHttpGateway();
const weaponGateway = new GenshinWeaponGateway();

const authService = new AuthService(authProvider, repository);
const characterStatsRepository = new PrismaCharacterStatsRepository();
const playerStatsRepository = new PrismaPlayerStatsRepository(costCatalogRepository);
const tournamentRepository = new PrismaTournamentRepository();
const friendshipRepository = new PrismaFriendshipRepository();
const notificationRepository = new PrismaNotificationRepository();
const activityEventRepository = new PrismaActivityEventRepository();
const notificationService = new NotificationService(notificationRepository);
const userSettingsRepository = new PrismaUserSettingsRepository();
const engagementMetricsRepository = new PrismaEngagementMetricsRepository(costCatalogRepository);

export const services = {
  achievement: new AchievementService(engagementMetricsRepository),
  activityFeed: new ActivityFeedService(activityEventRepository, friendshipRepository),
  adminUser: new AdminUserService(authProvider, repository),
  archive: new ArchiveService(repository, costCatalogRepository),
  auth: authService,
  build: new BuildService(repository, costCatalogRepository),
  characterCatalog: new CharacterCatalogService(characterGateway, enkaGateway),
  characterStats: new CharacterStatsService(characterStatsRepository),
  chibiImage: new ChibiImageService(chibiImageGateway),
  chat: new ChatService(repository),
  costCatalog: new CostCatalogService(repository, costCatalogRepository, characterGateway, weaponGateway),
  draft: new DraftService(repository),
  enkaProfile: new EnkaProfileService(enkaGateway),
  friendship: new FriendshipService(friendshipRepository, notificationRepository),
  history: new HistoryService(repository, costCatalogRepository),
  hostRoom: new HostRoomService(repository),
  invite: new InviteService(repository),
  leaderboard: new LeaderboardService(playerStatsRepository),
  lobby: new LobbyService(repository, enkaGateway, authService),
  mission: new MissionService(engagementMetricsRepository),
  notification: notificationService,
  profile: new ProfileService(repository, enkaGateway),
  room: new RoomService(repository, enkaGateway, characterGateway, costCatalogRepository),
  session: new SessionService(),
  systemHealth: new SystemHealthService(new PrismaSystemHealthRepository()),
  tournament: new TournamentService(tournamentRepository),
  userSettings: new UserSettingsService(userSettingsRepository),
  weaponCatalog: new WeaponCatalogService(weaponGateway),
};
