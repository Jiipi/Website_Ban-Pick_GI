import Link from "next/link";
import { ArrowLeft, GitCommit, Sparkles, Wrench, Bug, Zap } from "lucide-react";
import { NavBar } from "@/components/NavBar";

export const metadata = {
  title: "Changelog — Genshin Ban/Pick",
  description: "Lịch sử cập nhật của hệ thống Ban/Pick La Hoàn Cảnh Giới.",
};

type ChangeKind = "feature" | "improvement" | "fix" | "perf";

type Release = {
  version: string;
  date: string;
  highlight?: string;
  changes: Array<{ kind: ChangeKind; text: string }>;
};

const RELEASES: Release[] = [
  {
    version: "v3.1",
    date: "2026-05-26",
    highlight: "Tier 1 — Mở rộng nội dung & công cụ",
    changes: [
      { kind: "feature", text: "Trang /about giới thiệu dự án, công nghệ và roadmap" },
      { kind: "feature", text: "Trang /rules với toàn bộ luật chơi, công thức Cost & Handicap, FAQ" },
      { kind: "feature", text: "Trang /changelog (trang này) ghi lại lịch sử cập nhật" },
      { kind: "feature", text: "Trang /tools/cost-calculator — Tính cost & handicap không cần tạo phòng" },
      { kind: "feature", text: "Trang /characters — Tủ nhân vật có filter theo nguyên tố / độ hiếm / tên" },
      { kind: "feature", text: "Trang /characters/[id] — Chi tiết nhân vật + thống kê pick/ban từ database" },
      { kind: "feature", text: "Trang /leaderboard — Bảng xếp hạng player theo W/L" },
      { kind: "feature", text: "Trang /players/[uid] — Profile public với match history và stats" },
      { kind: "improvement", text: "NavBar mở rộng với link điều hướng tới các trang mới" },
    ],
  },
  {
    version: "v3.0",
    date: "2026-04",
    highlight: "Phòng riêng tư + Lobby + Auth",
    changes: [
      { kind: "feature", text: "Hệ thống Auth Supabase với role ADMIN / REFEREE" },
      { kind: "feature", text: "Lobby riêng cho player: verify UID Genshin qua Enka, chờ trọng tài mời" },
      { kind: "feature", text: "Invite/accept/decline real-time qua Supabase channel" },
      { kind: "feature", text: "Phòng riêng tư: chỉ host và 2 player được mời mới vào được" },
      { kind: "feature", text: "Admin panel tạo referee account" },
      { kind: "improvement", text: "Lưu avatar và nickname từ Enka vào lobby player" },
    ],
  },
  {
    version: "v2.5",
    date: "2026-03",
    highlight: "Build từ Enka + Realtime preview",
    changes: [
      { kind: "feature", text: "Tự động fetch build từ Enka.Network khi player có UID public" },
      { kind: "feature", text: "Broadcast preview lượt pick/ban: tướng đối thủ đang hover hiện cho mọi người" },
      { kind: "feature", text: "Optimistic update — UI phản hồi ngay không chờ server" },
      { kind: "improvement", text: "Cost catalog tách riêng dạng JSON cho admin dễ chỉnh" },
    ],
  },
  {
    version: "v2.0",
    date: "2026-02",
    highlight: "Layered Architecture refactor",
    changes: [
      { kind: "improvement", text: "Refactor toàn bộ codebase theo layered architecture (presentation/application/domain/infrastructure)" },
      { kind: "improvement", text: "Tách DraftPolicy và CostPolicy thành domain class thuần (không phụ thuộc framework)" },
      { kind: "improvement", text: "Service classes + port interfaces trong application layer" },
      { kind: "improvement", text: "Composition root wires Prisma + Supabase + HTTP gateway" },
      { kind: "perf", text: "Cache character/weapon data ở memory layer" },
    ],
  },
  {
    version: "v1.5",
    date: "2026-01",
    highlight: "Live Chat + Sound + Export",
    changes: [
      { kind: "feature", text: "Live Chat real-time trong phòng cho cả host, player, spectator" },
      { kind: "feature", text: "Sound system: ban/pick/click/error/copy/confirm" },
      { kind: "feature", text: "Export ảnh kết quả qua html2canvas" },
      { kind: "fix", text: "Time sync server-client để timer chạy đều ở mọi thiết bị" },
    ],
  },
  {
    version: "v1.0",
    date: "2025-12",
    highlight: "Phiên bản đầu tiên",
    changes: [
      { kind: "feature", text: "Core Ban/Pick 22 lượt (6 ban + 16 pick) chia 4 phase" },
      { kind: "feature", text: "Tính Cost tự động từ độ hiếm, cung mệnh, vũ khí" },
      { kind: "feature", text: "Time Handicap dựa trên chênh lệch Cost" },
      { kind: "feature", text: "Real-time sync qua Supabase Realtime" },
      { kind: "feature", text: "Trang lịch sử trận đấu" },
    ],
  },
];

export default function ChangelogPage() {
  return (
    <>
      <NavBar />
      <main className="min-h-screen px-4 py-10">
        <div className="mx-auto max-w-3xl space-y-6">
          {/* Header */}
          <div className="glass-strong rounded-3xl p-8 sm:p-10 animate-fade-in-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-300">
                <GitCommit size={22} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-400">Site Updates</p>
                <h1 className="text-2xl font-black tracking-tight text-slate-100">Changelog</h1>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-slate-400">
              Lịch sử cập nhật, tính năng mới và bản vá lỗi của hệ thống Ban/Pick.
            </p>
          </div>

          {/* Releases */}
          <div className="space-y-5">
            {RELEASES.map((release, idx) => (
              <article
                key={release.version}
                className="glass-strong rounded-3xl p-6 sm:p-7 animate-fade-in-up"
                style={{ animationDelay: `${idx * 60}ms` }}
              >
                <div className="flex items-baseline justify-between gap-3 mb-2">
                  <div className="flex items-baseline gap-3">
                    <span className="font-mono text-lg font-black text-cyan-300">{release.version}</span>
                    <span className="text-xs text-slate-500">{release.date}</span>
                  </div>
                  {idx === 0 && (
                    <span className="rounded bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-300">
                      Latest
                    </span>
                  )}
                </div>
                {release.highlight && (
                  <p className="text-sm font-semibold text-slate-200 mb-3">{release.highlight}</p>
                )}
                <ul className="space-y-2">
                  {release.changes.map((change, i) => (
                    <li key={i} className="flex gap-2.5 text-xs leading-relaxed">
                      <KindIcon kind={change.kind} />
                      <span className="text-slate-300">{change.text}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>

          <div className="text-center pt-4">
            <Link href="/" className="btn-outline">
              <ArrowLeft size={14} />
              Về trang chủ
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}

function KindIcon({ kind }: { kind: ChangeKind }) {
  const config = {
    feature: { icon: <Sparkles size={11} />, color: "text-cyan-300", bg: "bg-cyan-500/15" },
    improvement: { icon: <Wrench size={11} />, color: "text-violet-300", bg: "bg-violet-500/15" },
    fix: { icon: <Bug size={11} />, color: "text-rose-300", bg: "bg-rose-500/15" },
    perf: { icon: <Zap size={11} />, color: "text-amber-300", bg: "bg-amber-500/15" },
  }[kind];

  return (
    <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded ${config.bg} ${config.color}`}>
      {config.icon}
    </span>
  );
}
