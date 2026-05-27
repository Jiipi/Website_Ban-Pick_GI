import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();

async function main() {
  await p.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "LobbyPlayer" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "uid" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ONLINE',
    "roomCode" TEXT,
    "team" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LobbyPlayer_pkey" PRIMARY KEY ("id")
  )`);

  await p.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "LobbyPlayer_clientId_key" ON "LobbyPlayer"("clientId")`);

  console.log("Migration success: LobbyPlayer table created");
}

main()
  .catch((e) => console.error("Error:", e.message))
  .finally(() => p.$disconnect());
