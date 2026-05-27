"use client";

import { useState } from "react";

type Endpoint = {
  method: "GET" | "POST" | "PATCH" | "DELETE";
  path: string;
  description: string;
  auth: "public" | "uid" | "user" | "admin";
  params?: { name: string; type: string; required: boolean; description: string }[];
  body?: { name: string; type: string; required: boolean; description: string }[];
  exampleResponse?: string;
};

type Section = {
  id: string;
  title: string;
  description: string;
  endpoints: Endpoint[];
};

const SECTIONS: Section[] = [
  {
    id: "tournaments",
    title: "Giải đấu",
    description: "Quản lý giải đấu, participants, bracket, kết quả trận.",
    endpoints: [
      {
        method: "GET",
        path: "/api/tournaments",
        description: "Danh sách giải đấu (filter theo status).",
        auth: "public",
        params: [
          { name: "status", type: "string", required: false, description: "UPCOMING | ONGOING | FINISHED | CANCELLED" },
          { name: "limit", type: "number", required: false, description: "Số lượng tối đa, mặc định 50" },
        ],
        exampleResponse: `{
  "tournaments": [
    {
      "id": "...",
      "slug": "lhcg-cup-2026",
      "name": "LHCG Cup 2026",
      "status": "UPCOMING",
      "format": "SINGLE_ELIM",
      "maxTeams": 8,
      "participantCount": 6
    }
  ]
}`,
      },
      {
        method: "POST",
        path: "/api/tournaments",
        description: "Tạo giải đấu mới (cần đăng nhập).",
        auth: "user",
        body: [
          { name: "name", type: "string", required: true, description: "Tên giải đấu" },
          { name: "slug", type: "string", required: true, description: "URL slug — chữ thường + số + dấu gạch ngang" },
          { name: "maxTeams", type: "number", required: true, description: "4 | 8 | 16 | 32" },
          { name: "description", type: "string", required: false, description: "Mô tả ngắn" },
          { name: "startDate", type: "string", required: false, description: "ISO date" },
        ],
      },
      {
        method: "GET",
        path: "/api/tournaments/[slug]",
        description: "Chi tiết giải đấu kèm participants + matches.",
        auth: "public",
      },
      {
        method: "POST",
        path: "/api/tournaments/[slug]/participants",
        description: "Thêm người chơi vào giải.",
        auth: "public",
        body: [
          { name: "playerUid", type: "string", required: true, description: "UID Genshin" },
          { name: "playerNickname", type: "string", required: true, description: "Nickname" },
          { name: "playerAvatarUrl", type: "string", required: false, description: "Avatar URL" },
        ],
      },
      {
        method: "POST",
        path: "/api/tournaments/[slug]/bracket",
        description: "Generate bracket. Đổi status sang ONGOING.",
        auth: "user",
      },
      {
        method: "POST",
        path: "/api/tournaments/[slug]/matches/[matchId]/result",
        description: "Ghi kết quả trận, auto-advance winner.",
        auth: "user",
        body: [
          { name: "winnerParticipantId", type: "string", required: true, description: "ID participant thắng" },
          { name: "roomCode", type: "string", required: false, description: "Link room đã đấu" },
        ],
      },
    ],
  },
  {
    id: "characters",
    title: "Nhân vật",
    description: "Catalog + thống kê pick/ban rate.",
    endpoints: [
      {
        method: "GET",
        path: "/api/characters",
        description: "Danh sách tất cả nhân vật Genshin.",
        auth: "public",
      },
      {
        method: "GET",
        path: "/api/characters/stats",
        description: "Thống kê pick/ban tất cả nhân vật.",
        auth: "public",
      },
    ],
  },
  {
    id: "leaderboard",
    title: "Xếp hạng & Player",
    description: "Top players + profile từng player.",
    endpoints: [
      {
        method: "GET",
        path: "/api/leaderboard",
        description: "Top 50 players theo W/L.",
        auth: "public",
      },
      {
        method: "GET",
        path: "/api/players/[uid]",
        description: "Profile + lịch sử trận của 1 player.",
        auth: "public",
      },
    ],
  },
  {
    id: "social",
    title: "Bạn bè & Bảng tin",
    description: "Friend system, notifications, activity feed, search.",
    endpoints: [
      {
        method: "GET",
        path: "/api/friends",
        description: "Danh sách bạn bè + lời mời đến/đi.",
        auth: "uid",
      },
      {
        method: "POST",
        path: "/api/friends",
        description: "Gửi lời mời kết bạn.",
        auth: "uid",
        body: [{ name: "addresseeUid", type: "string", required: true, description: "UID người nhận" }],
      },
      {
        method: "POST",
        path: "/api/friends/requests/[id]",
        description: "Chấp nhận lời mời.",
        auth: "uid",
      },
      {
        method: "DELETE",
        path: "/api/friends/requests/[id]",
        description: "Từ chối / huỷ lời mời.",
        auth: "uid",
      },
      {
        method: "GET",
        path: "/api/notifications",
        description: "Thông báo của user hiện tại.",
        auth: "uid",
      },
      {
        method: "GET",
        path: "/api/notifications/unread",
        description: "Số notification chưa đọc.",
        auth: "uid",
      },
      {
        method: "PATCH",
        path: "/api/notifications",
        description: "Mark notification đã đọc (hoặc all=true để đọc hết).",
        auth: "uid",
        body: [
          { name: "id", type: "string", required: false, description: "ID notification cụ thể" },
          { name: "all", type: "boolean", required: false, description: "Đọc tất cả" },
        ],
      },
      {
        method: "GET",
        path: "/api/feed",
        description: "Bảng tin global hoặc friends-only.",
        auth: "public",
        params: [{ name: "scope", type: "string", required: false, description: "global | friends" }],
      },
      {
        method: "GET",
        path: "/api/search",
        description: "Tìm kiếm fuzzy qua pages, characters, tournaments, players.",
        auth: "public",
        params: [{ name: "q", type: "string", required: true, description: "Query string" }],
      },
    ],
  },
  {
    id: "engagement",
    title: "Engagement",
    description: "Achievements, missions, settings.",
    endpoints: [
      {
        method: "GET",
        path: "/api/achievements",
        description: "Tiến trình thành tựu lifetime.",
        auth: "uid",
        params: [{ name: "uid", type: "string", required: false, description: "Xem player khác" }],
      },
      {
        method: "GET",
        path: "/api/missions",
        description: "Nhiệm vụ ngày + tuần với progress.",
        auth: "uid",
      },
      {
        method: "GET",
        path: "/api/settings",
        description: "Cài đặt user hiện tại.",
        auth: "uid",
      },
      {
        method: "PATCH",
        path: "/api/settings",
        description: "Cập nhật cài đặt (gửi delta).",
        auth: "uid",
      },
    ],
  },
  {
    id: "system",
    title: "Hệ thống",
    description: "Health check + admin endpoints.",
    endpoints: [
      {
        method: "GET",
        path: "/api/status",
        description: "Trạng thái real-time của các thành phần.",
        auth: "public",
      },
      {
        method: "PATCH",
        path: "/api/admin/users/[id]",
        description: "Thay đổi role user (chỉ admin).",
        auth: "admin",
        body: [{ name: "role", type: "string", required: true, description: "ADMIN | REFEREE" }],
      },
    ],
  },
];

export function ApiDocsClient() {
  const [activeId, setActiveId] = useState("tournaments");

  return (
    <div className="grid gap-5 lg:grid-cols-[200px_1fr] animate-fade-in-up delay-100">
      {/* Sidebar */}
      <aside className="space-y-1 lg:sticky lg:top-16 lg:self-start">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveId(s.id)}
            className={`block w-full rounded-lg px-3 py-2 text-left text-xs font-bold transition-colors ${
              activeId === s.id
                ? "bg-cyan-500/15 text-cyan-200"
                : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-200"
            }`}
          >
            {s.title}
            <span className="ml-2 font-mono text-[9px] text-slate-500">
              {s.endpoints.length}
            </span>
          </button>
        ))}
      </aside>

      {/* Main */}
      <div className="space-y-5">
        {SECTIONS.filter((s) => s.id === activeId).map((section) => (
          <SectionView key={section.id} section={section} />
        ))}

        <div className="rounded-2xl border border-slate-700/40 bg-slate-900/40 p-4 text-xs text-slate-400">
          <p className="font-bold text-slate-300">Quy ước Auth:</p>
          <ul className="mt-2 space-y-1">
            <li><span className="font-mono text-emerald-300">public</span> — không cần auth</li>
            <li><span className="font-mono text-cyan-300">uid</span> — cần cookie <code>bp_client_id</code> + đã đăng ký UID ở /lobby</li>
            <li><span className="font-mono text-violet-300">user</span> — cần đăng nhập (Supabase auth)</li>
            <li><span className="font-mono text-amber-300">admin</span> — cần role=ADMIN</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function SectionView({ section }: { section: Section }) {
  return (
    <section className="space-y-4">
      <div className="glass-strong rounded-2xl p-5">
        <h2 className="text-lg font-black text-slate-100">{section.title}</h2>
        <p className="mt-1 text-xs text-slate-400">{section.description}</p>
      </div>

      <div className="space-y-3">
        {section.endpoints.map((ep) => (
          <EndpointCard key={`${ep.method}-${ep.path}`} endpoint={ep} />
        ))}
      </div>
    </section>
  );
}

function EndpointCard({ endpoint }: { endpoint: Endpoint }) {
  const [open, setOpen] = useState(false);
  return (
    <article className="glass-strong rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full px-5 py-3 hover:bg-slate-800/30 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <span className={`shrink-0 rounded px-2 py-0.5 font-mono text-[10px] font-black ${METHOD_STYLES[endpoint.method]}`}>
            {endpoint.method}
          </span>
          <code className="flex-1 truncate font-mono text-xs text-slate-200">{endpoint.path}</code>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${AUTH_STYLES[endpoint.auth]}`}>
            {endpoint.auth}
          </span>
        </div>
        <p className="mt-1 text-[11px] text-slate-400">{endpoint.description}</p>
      </button>

      {open && (
        <div className="border-t border-slate-800/60 px-5 py-4 space-y-3 bg-slate-950/30">
          {endpoint.params && endpoint.params.length > 0 && (
            <ParamTable title="Query params" params={endpoint.params} />
          )}
          {endpoint.body && endpoint.body.length > 0 && (
            <ParamTable title="Request body" params={endpoint.body} />
          )}
          {endpoint.exampleResponse && (
            <div>
              <p className="mb-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">Example response</p>
              <pre className="overflow-x-auto rounded-lg border border-slate-700/40 bg-slate-950/60 px-3 py-2 font-mono text-[10px] text-slate-300">
                {endpoint.exampleResponse}
              </pre>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

function ParamTable({
  title,
  params,
}: {
  title: string;
  params: { name: string; type: string; required: boolean; description: string }[];
}) {
  return (
    <div>
      <p className="mb-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">{title}</p>
      <div className="overflow-hidden rounded-lg border border-slate-700/40">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-900/60">
              <th className="px-3 py-1.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Name</th>
              <th className="px-3 py-1.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Type</th>
              <th className="px-3 py-1.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Required</th>
              <th className="px-3 py-1.5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">Description</th>
            </tr>
          </thead>
          <tbody>
            {params.map((p) => (
              <tr key={p.name} className="border-t border-slate-800/40">
                <td className="px-3 py-1.5 font-mono text-[11px] text-cyan-300">{p.name}</td>
                <td className="px-3 py-1.5 font-mono text-[10px] text-slate-400">{p.type}</td>
                <td className="px-3 py-1.5 text-[10px]">
                  {p.required ? (
                    <span className="text-rose-300">required</span>
                  ) : (
                    <span className="text-slate-500">optional</span>
                  )}
                </td>
                <td className="px-3 py-1.5 text-[11px] text-slate-300">{p.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const METHOD_STYLES: Record<string, string> = {
  GET: "bg-emerald-500/15 text-emerald-300",
  POST: "bg-cyan-500/15 text-cyan-300",
  PATCH: "bg-amber-500/15 text-amber-300",
  DELETE: "bg-rose-500/15 text-rose-300",
};

const AUTH_STYLES: Record<string, string> = {
  public: "bg-emerald-500/15 text-emerald-300",
  uid: "bg-cyan-500/15 text-cyan-300",
  user: "bg-violet-500/15 text-violet-300",
  admin: "bg-amber-500/15 text-amber-300",
};
