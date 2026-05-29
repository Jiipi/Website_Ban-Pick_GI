"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  DoorOpen,
  Swords,
  Hammer,
  Trophy,
  Users,
  Sparkles,
} from "lucide-react";

type Step = {
  id: string;
  title: string;
  Icon: React.ComponentType<{ size?: number }>;
  body: React.ReactNode;
};

const STEPS: Step[] = [
  {
    id: "register",
    title: "Bước 1 — Đăng ký tài khoản + UID",
    Icon: UserPlus,
    body: (
      <Block>
        <p>
          Để mở khoá tính năng cá nhân (kết bạn, lịch sử trận, thành tựu), bạn đăng ký tài khoản PLAYER,
          đăng nhập rồi liên kết UID Genshin của mình tại sảnh chờ.
        </p>
        <Tips>
          <li>Tạo tài khoản ở <Code>/register</Code>, sau đó vào <Code>/lobby</Code> và nhập UID Genshin (10 chữ số).</li>
          <li>Hệ thống sẽ tự động lấy thông tin từ Enka.Network.</li>
          <li>Cookie <Code>bp_client_id</Code> sẽ liên kết thiết bị với UID này.</li>
        </Tips>
        <ActionRow>
          <Link href="/lobby" className="btn-primary">
            <DoorOpen size={14} />
            Vào sảnh chờ
          </Link>
        </ActionRow>
      </Block>
    ),
  },
  {
    id: "create-room",
    title: "Bước 2 — Tạo phòng draft",
    Icon: DoorOpen,
    body: (
      <Block>
        <p>
          Phòng draft là nơi 2 player thực hiện ban/pick nhân vật. Trọng tài (host) tạo phòng và mời 2 player
          tham gia.
        </p>
        <Tips>
          <li>
            Trang chủ → <strong>Tạo phòng</strong> (cần đăng nhập với role REFEREE/ADMIN).
          </li>
          <li>Sau khi có 6 chữ phòng (VD: <Code>ABC123</Code>), gửi code cho 2 player.</li>
          <li>Player vào phòng từ <Code>/lobby</Code> hoặc qua link mời.</li>
        </Tips>
      </Block>
    ),
  },
  {
    id: "draft",
    title: "Bước 3 — Quy trình Ban/Pick",
    Icon: Swords,
    body: (
      <Block>
        <p>
          Mỗi trận có <strong>22 lượt</strong>: alternating ban/pick giữa 2 đội Xanh và Đỏ. Mỗi đội có{" "}
          <strong>120 giây bank time</strong>.
        </p>
        <Tips>
          <li>Lượt 1-4: Ban Phase 1 (mỗi đội ban 2)</li>
          <li>Lượt 5-10: Pick Phase 1 (mỗi đội pick 3)</li>
          <li>Lượt 11-14: Ban Phase 2 (mỗi đội ban 2)</li>
          <li>Lượt 15-22: Pick Phase 2 (mỗi đội pick 4)</li>
        </Tips>
        <p className="mt-3 text-[11px] text-slate-500">
          Xem chi tiết tại <Link href="/rules" className="text-cyan-300 hover:underline">/rules</Link>.
        </p>
      </Block>
    ),
  },
  {
    id: "build",
    title: "Bước 4 — Submit Build & Cost",
    Icon: Hammer,
    body: (
      <Block>
        <p>
          Sau draft, mỗi player submit <strong>build</strong> cho 8 nhân vật của mình (rarity, constellation,
          weapon).
        </p>
        <Tips>
          <li>Có thể tự nhập tay hoặc <strong>import từ Enka</strong> (cần bật showcase).</li>
          <li>Cost được tính theo công thức: rarity + constellation + weapon.</li>
          <li>
            Đội nào có total cost cao hơn → handicap thời gian theo công thức:{" "}
            <Code>chênh lệch / cost-per-point</Code> giây.
          </li>
        </Tips>
        <ActionRow>
          <Link href="/tools/cost-calculator" className="btn-outline">
            <Hammer size={14} />
            Calculator
          </Link>
        </ActionRow>
      </Block>
    ),
  },
  {
    id: "tournament",
    title: "Bước 5 — Tham gia Giải đấu",
    Icon: Trophy,
    body: (
      <Block>
        <p>
          Tham gia hoặc tổ chức giải đấu Single Elimination với 4/8/16/32 đội. Bracket tự động generate và
          advance winner.
        </p>
        <Tips>
          <li>Vào <Code>/tournaments</Code> để xem các giải đấu.</li>
          <li>Đăng nhập → <strong>Tạo giải mới</strong> (bạn sẽ là Organizer).</li>
          <li>Sau khi đủ đội → bấm <strong>Tạo bracket</strong>, hệ thống tự seed theo thứ tự.</li>
          <li>Mỗi match có thể link sang phòng draft thật.</li>
        </Tips>
        <ActionRow>
          <Link href="/tournaments" className="btn-primary">
            <Trophy size={14} />
            Xem giải đấu
          </Link>
        </ActionRow>
      </Block>
    ),
  },
  {
    id: "social",
    title: "Bước 6 — Cộng đồng & Bạn bè",
    Icon: Users,
    body: (
      <Block>
        <p>
          Kết bạn để theo dõi hoạt động, mời tham gia trận đấu, và đẩy nhanh missions cộng đồng.
        </p>
        <Tips>
          <li>
            Vào <Code>/friends</Code> → nhập UID người chơi → gửi lời mời.
          </li>
          <li>
            <Code>/feed</Code> hiển thị bảng tin global và friends-only.
          </li>
          <li>
            Bell <strong>🔔</strong> ở NavBar cho thông báo realtime.
          </li>
          <li>
            Bấm <Code>Ctrl+K</Code> để tìm nhanh nhân vật, giải đấu, player.
          </li>
        </Tips>
      </Block>
    ),
  },
  {
    id: "engagement",
    title: "Bước 7 — Thành tựu & Nhiệm vụ",
    Icon: Sparkles,
    body: (
      <Block>
        <p>
          Mở khoá <strong>17 thành tựu</strong> qua các trận đấu, giải đấu, hoạt động cộng đồng. Hoàn thành{" "}
          <strong>nhiệm vụ ngày/tuần</strong> để leo level (sắp ra mắt).
        </p>
        <Tips>
          <li>
            <Code>/achievements</Code> — 4 tier: bronze / silver / gold / platinum
          </li>
          <li>
            <Code>/missions</Code> — daily reset 00:00, weekly reset thứ 2
          </li>
          <li>
            <Code>/settings</Code> — tuỳ chỉnh giao diện, thông báo, draft mặc định
          </li>
        </Tips>
        <ActionRow>
          <Link href="/achievements" className="btn-outline">
            <Sparkles size={14} />
            Xem thành tựu
          </Link>
          <Link href="/missions" className="btn-primary">
            <Trophy size={14} />
            Xem nhiệm vụ
          </Link>
        </ActionRow>
      </Block>
    ),
  },
];

export function TutorialClient() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [completed, setCompleted] = useState<Set<number>>(new Set());

  const step = STEPS[currentIdx];
  const total = STEPS.length;
  const progress = Math.round(((currentIdx + 1) / total) * 100);

  function markComplete(idx: number) {
    setCompleted(new Set([...completed, idx]));
  }

  function next() {
    markComplete(currentIdx);
    if (currentIdx < total - 1) setCurrentIdx(currentIdx + 1);
  }

  function prev() {
    if (currentIdx > 0) setCurrentIdx(currentIdx - 1);
  }

  return (
    <div className="space-y-5 animate-fade-in-up delay-100">
      {/* Progress */}
      <div className="glass-strong rounded-2xl p-4 sm:p-5">
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Tiến trình tutorial
          </p>
          <span className="font-mono text-xs font-bold text-violet-300 tabular-nums">
            {currentIdx + 1} / {total}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800/60">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-400 to-cyan-300 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Step nav */}
      <div className="flex flex-wrap gap-1.5">
        {STEPS.map((s, idx) => (
          <button
            key={s.id}
            onClick={() => setCurrentIdx(idx)}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[10px] font-bold transition-colors ${
              idx === currentIdx
                ? "bg-violet-500/20 text-violet-200 ring-1 ring-violet-500/40"
                : completed.has(idx)
                ? "bg-emerald-500/15 text-emerald-300"
                : "bg-slate-800/40 text-slate-500 hover:bg-slate-800/70"
            }`}
          >
            {completed.has(idx) ? <CheckCircle2 size={10} /> : <span>{idx + 1}</span>}
            <span className="hidden sm:inline">{s.title.replace(/^Bước \d+ — /, "")}</span>
          </button>
        ))}
      </div>

      {/* Active step */}
      <article className="glass-strong rounded-3xl p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-300">
            <step.Icon size={22} />
          </div>
          <h2 className="text-xl font-black text-slate-100">{step.title}</h2>
        </div>
        <div className="text-sm leading-relaxed text-slate-300">{step.body}</div>
      </article>

      {/* Pager */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={prev}
          disabled={currentIdx === 0}
          className="btn-outline disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={14} />
          Trước
        </button>

        {currentIdx === total - 1 ? (
          <Link href="/" onClick={() => markComplete(currentIdx)} className="btn-primary">
            <CheckCircle2 size={14} />
            Hoàn thành
          </Link>
        ) : (
          <button onClick={next} className="btn-primary">
            Tiếp theo
            <ChevronRight size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

function Block({ children }: { children: React.ReactNode }) {
  return <div className="space-y-3">{children}</div>;
}

function Tips({ children }: { children: React.ReactNode }) {
  return (
    <ul className="space-y-1.5 rounded-2xl border border-slate-700/40 bg-slate-900/40 p-4 text-[13px]">
      {children}
    </ul>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-slate-800/60 px-1.5 py-0.5 font-mono text-[11px] text-cyan-300">
      {children}
    </code>
  );
}

function ActionRow({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap gap-2 pt-2">{children}</div>;
}
