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
