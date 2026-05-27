import { services } from "@/composition/services";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SearchHit = {
  type: "character" | "tournament" | "player" | "page";
  title: string;
  subtitle: string | null;
  link: string;
  iconUrl: string | null;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim().toLowerCase();
  if (!q) return NextResponse.json({ hits: [] });

  const hits: SearchHit[] = [];

  // Static pages
  const pages = [
    { title: "Trang chủ", subtitle: "Đăng nhập / Tạo phòng", link: "/" },
    { title: "Sảnh chờ", subtitle: "Lobby online", link: "/lobby" },
    { title: "Giải đấu", subtitle: "Tournaments", link: "/tournaments" },
    { title: "Tủ nhân vật", subtitle: "Characters", link: "/characters" },
    { title: "Bảng xếp hạng", subtitle: "Leaderboard", link: "/leaderboard" },
    { title: "Calculator", subtitle: "Cost calculator", link: "/tools/cost-calculator" },
    { title: "Lịch sử", subtitle: "History", link: "/history" },
    { title: "Luật chơi", subtitle: "Rules", link: "/rules" },
    { title: "Bảng tin", subtitle: "Activity feed", link: "/feed" },
    { title: "Bạn bè", subtitle: "Friends", link: "/friends" },
    { title: "Changelog", subtitle: "Lịch sử cập nhật", link: "/changelog" },
    { title: "Giới thiệu", subtitle: "About", link: "/about" },
  ];
  for (const p of pages) {
    if (p.title.toLowerCase().includes(q) || p.subtitle.toLowerCase().includes(q)) {
      hits.push({ type: "page", title: p.title, subtitle: p.subtitle, link: p.link, iconUrl: null });
    }
  }

  // Characters (top 10)
  const charResult = await services.characterCatalog.listCharacters({ refresh: false });
  if (charResult.ok) {
    let count = 0;
    for (const ch of charResult.data.characters) {
      if (count >= 10) break;
      if (ch.name.toLowerCase().includes(q) || ch.id.toLowerCase().includes(q)) {
        hits.push({
          type: "character",
          title: ch.name,
          subtitle: `${ch.element} • ${ch.rarity}★`,
          link: `/characters/${ch.id}`,
          iconUrl: ch.chibiIconUrl ?? null,
        });
        count++;
      }
    }
  }

  // Tournaments (top 5)
  const trnResult = await services.tournament.listTournaments({ limit: 50 });
  if (trnResult.ok) {
    let count = 0;
    for (const t of trnResult.data.tournaments) {
      if (count >= 5) break;
      if (t.name.toLowerCase().includes(q) || t.slug.toLowerCase().includes(q)) {
        hits.push({
          type: "tournament",
          title: t.name,
          subtitle: `${t.participantCount}/${t.maxTeams} đội • ${t.status}`,
          link: `/tournaments/${t.slug}`,
          iconUrl: t.bannerUrl,
        });
        count++;
      }
    }
  }

  // Players from leaderboard (top 5)
  const lbResult = await services.leaderboard.getLeaderboard(50);
  if (lbResult.ok) {
    let count = 0;
    for (const p of lbResult.data.players) {
      if (count >= 5) break;
      if (p.nickname.toLowerCase().includes(q) || p.uid.includes(q)) {
        hits.push({
          type: "player",
          title: p.nickname,
          subtitle: `UID ${p.uid} • ${p.wins}W ${p.losses}L`,
          link: `/players/${p.uid}`,
          iconUrl: p.avatarUrl,
        });
        count++;
      }
    }
  }

  return NextResponse.json({ hits });
}
