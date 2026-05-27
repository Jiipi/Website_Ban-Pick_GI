"use client";

import { useState } from "react";
import { Bug, Gamepad2, Sparkles, Wrench, Zap } from "lucide-react";

type Tab = "site" | "game";
type ChangeKind = "feature" | "improvement" | "fix" | "perf";

type Release = {
  version: string;
  date: string;
  highlight: string;
  changes: Array<{ kind: ChangeKind; text: string }>;
};

const SITE_RELEASES: Release[] = [
  {
    version: "v3.5",
    date: "2026-05-27",
    highlight: "Professional Pages Expansion",
    changes: [
      { kind: "feature", text: "Thêm Meta dashboard, Weapon catalog, Shop preview và Guide hub" },
      { kind: "feature", text: "Bổ sung bộ công cụ: Team Builder, Draft Simulator, Randomizer, Profile Tracker" },
      { kind: "feature", text: "Thêm Feedback, Privacy, Terms và Patch Notes page" },
      { kind: "improvement", text: "Mở rộng navigation/footer để truy cập nhanh các trang chuyên nghiệp" },
    ],
  },
  {
    version: "v3.4",
    date: "2026-05-27",
    highlight: "Tier 5 — Pro / Power Features",
    changes: [
      { kind: "feature", text: "Admin dashboard với quản lý users, tournaments và system overview" },
      { kind: "feature", text: "Status page + API health check" },
      { kind: "feature", text: "API Docs interactive cho các endpoint chính" },
      { kind: "feature", text: "Tutorial tương tác cho user mới" },
    ],
  },
  {
    version: "v3.3",
    date: "2026-05-27",
    highlight: "Tier 4 — Engagement",
    changes: [
      { kind: "feature", text: "Achievements với badge rarity và progress bar" },
      { kind: "feature", text: "Daily/Weekly missions" },
      { kind: "feature", text: "Settings page cho theme, language, notifications, privacy" },
    ],
  },
  {
    version: "v3.2",
    date: "2026-05-26",
    highlight: "Tournament & Community",
    changes: [
      { kind: "feature", text: "Tournament suite: list, create, detail, bracket, participants" },
      { kind: "feature", text: "Friends, notifications, activity feed và global search Ctrl+K" },
      { kind: "improvement", text: "Mở rộng layered architecture cho social/tournament services" },
    ],
  },
  {
    version: "v3.1",
    date: "2026-05-26",
    highlight: "Tier 1 — Content & Tools",
    changes: [
      { kind: "feature", text: "Characters gallery, character detail, leaderboard và player profile" },
      { kind: "feature", text: "Cost calculator standalone" },
      { kind: "feature", text: "About, Rules, Changelog pages" },
    ],
  },
];

const GAME_PATCHES = [
  {
    version: "Genshin 5.x",
    title: "Theo dõi meta theo patch",
    items: [
      "Khi có nhân vật mới, hệ thống character catalog sẽ tự đồng bộ từ nguồn dữ liệu hiện có.",
      "Pick/ban rate trong Meta dashboard được tính từ dữ liệu draft thực tế của web, không phải dữ liệu global.",
      "Tournament organizer nên ghi chú patch áp dụng trong phần Rules của giải để tránh tranh cãi cân bằng.",
    ],
  },
  {
    version: "Game data",
    title: "Nguồn dữ liệu",
    items: [
      "Tên, icon và thông tin cơ bản nhân vật/vũ khí lấy từ public data source.",
      "Thông tin player public profile/showcase được đọc qua Enka.Network khi UID cho phép truy cập.",
      "Trang này không phải patch note chính thức của HoYoverse; chỉ là ghi chú vận hành cho hệ thống ban/pick.",
    ],
  },
  {
    version: "Meta impact",
    title: "Ảnh hưởng đến draft",
    items: [
      "Nhân vật mới nên được theo dõi riêng trong vài tuần đầu vì sample size thấp.",
      "Ban rate cao không luôn đồng nghĩa nhân vật mạnh nhất; có thể do matchup khó chịu hoặc comfort pick phổ biến.",
      "Cost rules nên được review sau các patch lớn nếu meta build thay đổi mạnh.",
    ],
  },
];

export function PatchNotesClient() {
  const [tab, setTab] = useState<Tab>("site");

  return (
    <div className="space-y-5 animate-fade-in-up delay-100">
      <div className="flex gap-2">
        <TabButton active={tab === "site"} onClick={() => setTab("site")}>
          Site Updates
        </TabButton>
        <TabButton active={tab === "game"} onClick={() => setTab("game")}>
          Game Patch
        </TabButton>
      </div>

      {tab === "site" && (
        <div className="space-y-5">
          {SITE_RELEASES.map((release, idx) => (
            <article key={release.version} className="glass-strong rounded-3xl p-6 sm:p-7">
              <div className="mb-2 flex items-baseline justify-between gap-3">
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
              <p className="mb-3 text-sm font-semibold text-slate-200">{release.highlight}</p>
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
      )}

      {tab === "game" && (
        <div className="space-y-5">
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] p-4">
            <div className="flex gap-3">
              <Gamepad2 size={16} className="mt-0.5 shrink-0 text-amber-300" />
              <p className="text-xs leading-relaxed text-slate-300">
                Đây là ghi chú vận hành theo patch game cho hệ thống ban/pick, không phải patch note chính thức.
                Hãy kiểm tra nguồn chính thức của HoYoverse khi cần thông tin game đầy đủ.
              </p>
            </div>
          </div>

          {GAME_PATCHES.map((patch) => (
            <article key={patch.version} className="glass-strong rounded-3xl p-6 sm:p-7">
              <p className="font-mono text-xs font-black uppercase tracking-wider text-violet-300">{patch.version}</p>
              <h2 className="mt-1 text-lg font-black text-slate-100">{patch.title}</h2>
              <ul className="mt-4 space-y-2">
                {patch.items.map((item) => (
                  <li key={item} className="flex gap-2 text-xs leading-relaxed text-slate-300">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-300" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
        active ? "bg-emerald-500/20 text-emerald-200 ring-1 ring-emerald-500/40" : "bg-slate-800/40 text-slate-400 hover:bg-slate-800/70 hover:text-slate-200"
      }`}
    >
      {children}
    </button>
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
