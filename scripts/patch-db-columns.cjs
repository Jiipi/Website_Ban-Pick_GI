const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");

const envPath = path.join(process.cwd(), ".env");

if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) continue;

    const [, key, rawValue] = match;
    if (process.env[key]) continue;

    process.env[key] = rawValue.replace(/^["']|["']$/g, "");
  }
}

const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe('ALTER TABLE "Room" ADD COLUMN IF NOT EXISTS "blueAvatarUrl" TEXT');
  await prisma.$executeRawUnsafe('ALTER TABLE "Room" ADD COLUMN IF NOT EXISTS "redAvatarUrl" TEXT');
  await prisma.$executeRawUnsafe('ALTER TABLE "LobbyPlayer" ADD COLUMN IF NOT EXISTS "displayName" TEXT');
  await prisma.$executeRawUnsafe('ALTER TABLE "LobbyPlayer" ADD COLUMN IF NOT EXISTS "customAvatarUrl" TEXT');
  await prisma.$executeRawUnsafe('ALTER TABLE "Tournament" ADD COLUMN IF NOT EXISTS "costCap" INTEGER NOT NULL DEFAULT 36');
  await prisma.$executeRawUnsafe('ALTER TABLE "Tournament" ADD COLUMN IF NOT EXISTS "bankTime" INTEGER NOT NULL DEFAULT 120');
  await prisma.$executeRawUnsafe('ALTER TABLE "Tournament" ADD COLUMN IF NOT EXISTS "fearlessDraft" BOOLEAN NOT NULL DEFAULT false');
  await prisma.$executeRawUnsafe('ALTER TABLE "Tournament" ADD COLUMN IF NOT EXISTS "patch" TEXT');
  await prisma.$executeRawUnsafe('ALTER TABLE "Tournament" ADD COLUMN IF NOT EXISTS "region" TEXT');
  await prisma.$executeRawUnsafe('ALTER TABLE "Tournament" ADD COLUMN IF NOT EXISTS "rulesText" TEXT');
  await prisma.$executeRawUnsafe('ALTER TABLE "TournamentParticipant" ADD COLUMN IF NOT EXISTS "teamName" TEXT');
  await prisma.$executeRawUnsafe('ALTER TABLE "TournamentParticipant" ADD COLUMN IF NOT EXISTS "logoUrl" TEXT');
  await prisma.$executeRawUnsafe('ALTER TABLE "TournamentParticipant" ADD COLUMN IF NOT EXISTS "captainUid" TEXT');
  await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "TournamentTeamMember" (
    "id" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "uid" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "arLevel" INTEGER,
    "role" TEXT NOT NULL DEFAULT 'PLAYER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TournamentTeamMember_pkey" PRIMARY KEY ("id")
  )`);
  await prisma.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS "TournamentTeamMember_participantId_uid_key" ON "TournamentTeamMember"("participantId", "uid")');
  await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "TournamentTeamMember_uid_idx" ON "TournamentTeamMember"("uid")');
  await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "TournamentParticipant_captainUid_idx" ON "TournamentParticipant"("captainUid")');
  await prisma.$executeRawUnsafe(`DO $$ BEGIN
    ALTER TABLE "TournamentTeamMember"
      ADD CONSTRAINT "TournamentTeamMember_participantId_fkey"
      FOREIGN KEY ("participantId") REFERENCES "TournamentParticipant"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END $$;`);
  console.log("Database columns are in sync.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
