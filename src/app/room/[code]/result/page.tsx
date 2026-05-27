import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import type { Metadata } from "next";
import { services } from "@/composition/services";
import { getCharacterIconUrl } from "@/lib/genshin";
import { SESSION_KEYS } from "@/lib/constants";
import { ExportImageButton } from "@/components/ExportImageButton";
import { NavBar } from "@/components/NavBar";
import { ResultActions } from "@/components/ResultActions";
import { ResultScoreBoard } from "@/components/ResultScoreBoard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ResultPageProps = {
  params: Promise<{ code: string }>;
};

export async function generateMetadata({ params }: ResultPageProps): Promise<Metadata> {
  const { code } = await params;
  return {
    title: `Kết Quả — Room ${code.toUpperCase()}`,
    description: `Xem kết quả ban/pick Genshin Impact — Room ${code.toUpperCase()}`,
    openGraph: {
      title: `Genshin Ban/Pick — Room ${code.toUpperCase()}`,
      description: `Kết quả draft Genshin Impact`,
      type: "website",
    },
  };
}

export default async function ResultPage({ params }: ResultPageProps) {
  const { code } = await params;
  const cookieStore = await cookies();
  const clientId = cookieStore.get(SESSION_KEYS.clientId)?.value ?? "";
  const pageData = await services.room.getResultPageData(code, clientId);

  if (!pageData.ok) {
    notFound();
  }

  const { room } = pageData.data;

  if (!pageData.data.authorized) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="glass-strong w-full max-w-md rounded-3xl p-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 text-3xl">🔒</div>
          <h1 className="mt-2 text-xl font-black text-slate-100">Không có quyền truy cập</h1>
          <p className="mt-3 text-xs leading-relaxed text-slate-400">
            Chỉ thành viên trong phòng mới xem được kết quả.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <Link href="/" className="btn-secondary">Về trang chủ</Link>
            <Link href="/lobby" className="btn-primary">Vào sảnh chờ</Link>
          </div>
        </div>
      </main>
    );
  }

  const { characters, blueBuilds, redBuilds, blueCost, redCost, handicap } = pageData.data;

  return (
    <>
      <NavBar roomCode={room.code} phase="result" />
      <main className="min-h-screen px-4 py-8">
        <section className="mx-auto max-w-5xl space-y-6">
          {/* Header */}
          <div className="glass-strong rounded-2xl px-6 py-5 text-center animate-fade-in-up">
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-400">Room {room.code}</p>
            <h1 className="mt-2 text-3xl font-black sm:text-4xl">
              <span className="text-gradient-gold">Kết Quả Handicap</span>
            </h1>
            <p className="mt-2 text-sm text-slate-400">1 cost = {room.costPerPoint} giây</p>
          </div>

          {/* VS Comparison */}
          <div className="animate-fade-in-up delay-100">
            <ResultScoreBoard
              blueCost={blueCost}
              redCost={redCost}
              blueBuildCount={blueBuilds.length}
              redBuildCount={redBuilds.length}
              handicapDiff={handicap.diff}
              handicapSeconds={handicap.seconds}
              penalizedTeam={handicap.penalizedTeam}
              costPerPoint={room.costPerPoint}
            />
          </div>

          {/* Build Details */}
          <div className="grid gap-4 md:grid-cols-2 animate-fade-in-up delay-200">
            <TeamBuilds title="Đội Xanh" accent="blue" builds={blueBuilds} characters={characters} />
            <TeamBuilds title="Đội Đỏ" accent="red" builds={redBuilds} characters={characters} />
          </div>

          {/* Actions — Export first, more prominent */}
          <div className="flex flex-wrap gap-3 animate-fade-in-up delay-300">
            <ExportImageButton
              roomCode={room.code}
              blueCost={blueCost}
              redCost={redCost}
              handicap={handicap}
            />
            <Link className="btn-outline" href={`/room/${room.code}`}>
              ← Về draft
            </Link>
            <Link className="btn-outline" href="/history">
              📜 Lịch sử
            </Link>
            <Link className="btn-outline" href={`/room/${room.code}/build`}>
              Sửa build
            </Link>
            <ResultActions
              roomCode={room.code}
              hostClientId={room.hostClientId}
              hostName={room.hostName}
              costPerPoint={room.costPerPoint}
            />
          </div>
        </section>
      </main>
    </>
  );
}

type BuildEntry = {
  characterId: string;
  rarity: number;
  consLevel: number;
  weaponRarity: number;
  totalCost: number;
};

function TeamBuilds({
  title,
  accent,
  builds,
  characters,
}: {
  title: string;
  accent: "blue" | "red";
  builds: BuildEntry[];
  characters: Array<{ slug: string; name: string }>;
}) {
  const panelClass = accent === "blue" ? "panel-blue" : "panel-red";
  const labelColor = accent === "blue" ? "text-cyan-300" : "text-rose-300";
  const totalCost = builds.reduce((sum, b) => sum + b.totalCost, 0);

  return (
    <div className={`${panelClass} rounded-2xl p-4`}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className={`text-sm font-black uppercase tracking-wider ${labelColor}`}>{title}</h2>
        <span className="rounded-lg bg-slate-950/50 px-2 py-0.5 text-xs font-bold tabular-nums text-slate-300">
          Tổng: {formatCost(totalCost)}
        </span>
      </div>
      <div className="space-y-1.5">
        {builds.map((build) => {
          const char = characters.find((c) => c.slug === build.characterId);
          const displayName = char?.name ?? build.characterId;
          return (
            <div key={build.characterId} className="glass flex items-center gap-3 rounded-xl px-3 py-2">
              <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-slate-800/40">
                <Image
                  src={getCharacterIconUrl(build.characterId)}
                  alt={displayName}
                  fill
                  sizes="36px"
                  className="object-contain"
                  unoptimized
                />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-100">{displayName}</p>
                <p className="text-[10px] text-slate-400">
                  <span className={build.rarity === 5 ? "text-amber-400" : "text-purple-400"}>{build.rarity}★</span>
                  {" "}C{build.consLevel} • Vũ khí{" "}
                  <span className={build.weaponRarity === 5 ? "text-amber-400" : "text-purple-400"}>{build.weaponRarity}★</span>
                </p>
              </div>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(Math.ceil(build.totalCost), 8) }).map((_, i) => (
                  <span key={i} className={`inline-block h-2 w-2 rounded-full ${build.totalCost > 4 ? "bg-rose-400" : build.totalCost > 2 ? "bg-amber-400" : "bg-cyan-400"}`} />
                ))}
                <span className="ml-1 text-sm font-black tabular-nums text-slate-200">{formatCost(build.totalCost)}</span>
              </div>
            </div>
          );
        })}
        {builds.length === 0 && (
          <p className="py-4 text-center text-sm text-slate-500">Chưa có build nào</p>
        )}
      </div>
    </div>
  );
}

function formatCost(value: number): string {
  return value.toFixed(2).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
}
