import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();

async function main() {
  // Enable Supabase Realtime for all tables used by the app
  const tables = ["Room", "DraftLog", "CharacterBuild", "LobbyPlayer"];

  for (const table of tables) {
    try {
      await p.$executeRawUnsafe(
        `ALTER PUBLICATION supabase_realtime ADD TABLE "${table}"`
      );
      console.log(`OK: Added "${table}" to supabase_realtime`);
    } catch (e: any) {
      // Table might already be in the publication
      if (e.message?.includes("already a member")) {
        console.log(`SKIP: "${table}" already in supabase_realtime`);
      } else {
        console.error(`ERROR adding "${table}": ${e.message}`);
      }
    }
  }

  console.log("Done — all tables should now have Realtime enabled");
}

main()
  .catch((e) => console.error("Fatal:", e.message))
  .finally(() => p.$disconnect());
