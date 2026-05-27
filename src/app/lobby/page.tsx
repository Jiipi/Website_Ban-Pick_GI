import { LobbyClient } from "@/components/LobbyClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function LobbyPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <LobbyClient />
    </main>
  );
}
