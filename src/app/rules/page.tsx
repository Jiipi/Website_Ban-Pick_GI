import Link from "next/link";
import { ArrowLeft, BookOpen, Coins, Clock, Swords, Shield, AlertTriangle } from "lucide-react";
import { NavBar } from "@/components/NavBar";

export const metadata = {
  title: "Luật chơi — Genshin Ban/Pick",
  description: "Luật chơi chính thức của hệ thống Ban/Pick La Hoàn Cảnh Giới: trình tự, cost, handicap, FAQ.",
};

export default function RulesPage() {
  return (
    <>
      <NavBar />
      <main className="min-h-screen px-4 py-10">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Header */}
          <div className="glass-strong rounded-3xl p-8 sm:p-10 animate-fade-in-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-300">
                <BookOpen size={22} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-400">Official Rules</p>
                <h1 className="text-2xl font-black tracking-tight text-slate-100">Luật Chơi</h1>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-slate-400">
              Quy tắc chính thức cho giải đấu La Hoàn Cảnh Giới sử dụng hệ thống Ban/Pick này. Trọng tài
              có thể tuỳ biến một số tham số khi tạo phòng (giây/cost, timer).
            </p>

            {/* Quick TOC */}
            <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <a href="#flow" className="rounded-lg border border-slate-700/40 bg-slate-900/40 px-3 py-2 text-center text-[11px] font-bold text-slate-300 hover:border-cyan-500/30 hover:text-cyan-300 transition-colors">1. Trình tự</a>
              <a href="#cost" className="rounded-lg border border-slate-700/40 bg-slate-900/40 px-3 py-2 text-center text-[11px] font-bold text-slate-300 hover:border-cyan-500/30 hover:text-cyan-300 transition-colors">2. Cost</a>
              <a href="#handicap" className="rounded-lg border border-slate-700/40 bg-slate-900/40 px-3 py-2 text-center text-[11px] font-bold text-slate-300 hover:border-cyan-500/30 hover:text-cyan-300 transition-colors">3. Handicap</a>
              <a href="#faq" className="rounded-lg border border-slate-700/40 bg-slate-900/40 px-3 py-2 text-center text-[11px] font-bold text-slate-300 hover:border-cyan-500/30 hover:text-cyan-300 transition-colors">4. FAQ</a>
            </div>
          </div>

          {/* Section 1 — Flow */}
          <section id="flow" className="glass-strong rounded-3xl p-8 animate-fade-in-up delay-100 scroll-mt-20">
            <div className="flex items-center gap-2 mb-4">
              <Swords size={18} className="text-cyan-300" />
              <h2 className="text-lg font-black tracking-tight text-slate-100">1. Trình tự Cấm / Chọn</h2>
            </div>
            <p className="text-sm text-slate-400 mb-4">
              Mỗi đội cần 8 nhân vật để đi 2 phòng La Hoàn. Tổng cộng có 6 lượt Cấm (Ban) và 16 lượt Chọn
              (Pick) chia thành 4 phase.
            </p>

            <div className="overflow-x-auto rounded-xl border border-slate-700/40">
              <table className="w-full text-xs">
                <thead className="bg-slate-900/60">
                  <tr>
                    <th className="px-3 py-2 text-left text-[10px] font-black uppercase tracking-wider text-slate-400">Lượt</th>
                    <th className="px-3 py-2 text-left text-[10px] font-black uppercase tracking-wider text-slate-400">Phase</th>
                    <th className="px-3 py-2 text-left text-[10px] font-black uppercase tracking-wider text-slate-400">Đội</th>
                    <th className="px-3 py-2 text-left text-[10px] font-black uppercase tracking-wider text-slate-400">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {DRAFT_FLOW.map((row) => (
                    <tr key={row.turn} className="hover:bg-slate-800/20">
                      <td className="px-3 py-2 font-mono font-bold text-slate-200">{row.turn}</td>
                      <td className="px-3 py-2 text-slate-300">{row.phase}</td>
                      <td className={`px-3 py-2 font-bold ${row.team === "BLUE" ? "text-cyan-300" : "text-rose-300"}`}>
                        {row.team === "BLUE" ? "Đội Xanh" : "Đội Đỏ"}
                      </td>
                      <td className="px-3 py-2">
                        <span className={`rounded px-2 py-0.5 text-[10px] font-black ${row.action === "BAN" ? "bg-rose-500/15 text-rose-300" : "bg-cyan-500/15 text-cyan-300"}`}>
                          {row.action === "BAN" ? "⛔ CẤM" : "🎯 CHỌN"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Nhân vật đã bị cấm hoặc đã được đội kia chọn sẽ không thể được chọn lại.
            </p>
          </section>

          {/* Section 2 — Cost */}
          <section id="cost" className="glass-strong rounded-3xl p-8 animate-fade-in-up delay-200 scroll-mt-20">
            <div className="flex items-center gap-2 mb-4">
              <Coins size={18} className="text-amber-300" />
              <h2 className="text-lg font-black tracking-tight text-slate-100">2. Hệ thống tính Cost</h2>
            </div>
            <p className="text-sm text-slate-400 mb-4">
              Mỗi nhân vật được chọn sẽ phải khai báo trang bị. Hệ thống tự động tính Cost theo các quy tắc:
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              <RuleCard
                title="Nhân vật 4 sao"
                items={["Mặc định 0 Cost", "Mọi cung mệnh C0 → C6 đều tính 0 Cost"]}
                color="emerald"
              />
              <RuleCard
                title="Nhân vật 5 sao"
                items={["Xác C0 = 1 Cost", "Mỗi bậc Cung mệnh C1 → C6 cộng thêm 1 Cost", "C6 = 7 Cost"]}
                color="amber"
              />
              <RuleCard
                title="Vũ khí 4 sao"
                items={["0 Cost cho mọi nhân vật"]}
                color="emerald"
              />
              <RuleCard
                title="Vũ khí 5 sao"
                items={["Áp dụng cho mọi nhân vật", "+1 Cost bất kể 4★ hay 5★"]}
                color="amber"
              />
            </div>

            <div className="mt-4 rounded-xl border border-cyan-500/20 bg-cyan-500/[0.04] px-4 py-3">
              <p className="text-xs font-bold text-cyan-200 mb-1">Ví dụ</p>
              <p className="text-xs leading-relaxed text-slate-300">
                Nhân vật <strong>Raiden Shogun (5★)</strong> với cung mệnh <strong>C2</strong> dùng vũ khí
                <strong> Engulfing Lightning (5★)</strong> = 1 (xác) + 2 (cons) + 1 (vũ khí) = <strong className="text-amber-300">4 Cost</strong>
              </p>
            </div>
          </section>

          {/* Section 3 — Handicap */}
          <section id="handicap" className="glass-strong rounded-3xl p-8 animate-fade-in-up delay-300 scroll-mt-20">
            <div className="flex items-center gap-2 mb-4">
              <Clock size={18} className="text-violet-300" />
              <h2 className="text-lg font-black tracking-tight text-slate-100">3. Bù trừ thời gian (Handicap)</h2>
            </div>
            <p className="text-sm text-slate-400 mb-4">
              Sau khi tính tổng Cost của 8 nhân vật mỗi đội, hệ thống so sánh và đưa ra mức phạt thời gian
              cho đội có Cost cao hơn.
            </p>

            <div className="rounded-xl border border-violet-500/25 bg-violet-500/[0.05] px-5 py-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-violet-300 mb-2">Công thức</p>
              <p className="font-mono text-sm text-slate-100">
                (Tổng Cost đội cao − Tổng Cost đội thấp) × <span className="text-violet-300">[giây/cost]</span> = giây phải đi nhanh hơn
              </p>
            </div>

            <p className="mt-4 text-xs text-slate-500">
              Trọng tài cài đặt <strong className="text-slate-300">[giây/cost]</strong> khi tạo phòng (mặc định 10s, có thể chỉnh từ 1s đến 60s).
            </p>

            <div className="mt-3 rounded-xl border border-slate-700/40 bg-slate-900/40 px-4 py-3">
              <p className="text-xs font-bold text-slate-200 mb-1">Ví dụ</p>
              <p className="text-xs leading-relaxed text-slate-300">
                Đội Xanh tổng <strong className="text-cyan-300">15 cost</strong>, Đội Đỏ tổng <strong className="text-rose-300">22 cost</strong>,
                trọng tài chọn <strong>10 giây/cost</strong> → Đội Đỏ phải hoàn thành nhanh hơn <strong className="text-violet-300">(22-15) × 10 = 70 giây</strong>.
              </p>
            </div>
          </section>

          {/* Section 4 — FAQ */}
          <section id="faq" className="glass-strong rounded-3xl p-8 animate-fade-in-up delay-400 scroll-mt-20">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={18} className="text-rose-300" />
              <h2 className="text-lg font-black tracking-tight text-slate-100">4. Câu hỏi thường gặp</h2>
            </div>
            <div className="space-y-4">
              <FaqItem
                q="Khán giả có click chọn được tướng không?"
                a="Không. Hệ thống chặn ở cả Frontend (vô hiệu hoá onClick) lẫn Backend (server kiểm tra clientId trước khi ghi vào database). Chỉ Player được mời mới có thể thao tác đúng lượt."
              />
              <FaqItem
                q="Nếu hết giờ mà player chưa pick?"
                a="Trọng tài có thể bấm Force Skip để bỏ qua lượt đó. Nhân vật không bị chọn cho đội đó và lượt chuyển sang đội tiếp theo theo trình tự."
              />
              <FaqItem
                q="Có thể chỉnh sửa build sau khi đã xác nhận?"
                a="Player có thể sửa build cho đến khi cả 2 đội đã hoàn tất khai báo. Sau khi tính kết quả, build bị khoá."
              />
              <FaqItem
                q="Mỗi đội có giới hạn nhân vật trong cùng nguyên tố không?"
                a="Hệ thống hiện tại không giới hạn cấu hình theo nguyên tố. Trọng tài có thể quy định riêng và xử lý thủ công nếu vi phạm."
              />
              <FaqItem
                q="Player rớt mạng giữa chừng thì sao?"
                a="Player có thể vào lại bằng đường link/mã phòng — session lưu ở localStorage. Trận đấu vẫn tiếp tục tại đúng lượt hiện tại nhờ Supabase Realtime."
              />
            </div>
          </section>

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

const DRAFT_FLOW: Array<{ turn: number; phase: string; team: "BLUE" | "RED"; action: "BAN" | "PICK" }> = [
  { turn: 1, phase: "Phase 1", team: "BLUE", action: "BAN" },
  { turn: 2, phase: "Phase 1", team: "RED", action: "BAN" },
  { turn: 3, phase: "Phase 1", team: "BLUE", action: "BAN" },
  { turn: 4, phase: "Phase 1", team: "RED", action: "BAN" },
  { turn: 5, phase: "Phase 2", team: "BLUE", action: "PICK" },
  { turn: 6, phase: "Phase 2", team: "RED", action: "PICK" },
  { turn: 7, phase: "Phase 2", team: "RED", action: "PICK" },
  { turn: 8, phase: "Phase 2", team: "BLUE", action: "PICK" },
  { turn: 9, phase: "Phase 2", team: "BLUE", action: "PICK" },
  { turn: 10, phase: "Phase 2", team: "RED", action: "PICK" },
  { turn: 11, phase: "Phase 3", team: "RED", action: "BAN" },
  { turn: 12, phase: "Phase 3", team: "BLUE", action: "BAN" },
  { turn: 13, phase: "Phase 4", team: "RED", action: "PICK" },
  { turn: 14, phase: "Phase 4", team: "BLUE", action: "PICK" },
  { turn: 15, phase: "Phase 4", team: "BLUE", action: "PICK" },
  { turn: 16, phase: "Phase 4", team: "RED", action: "PICK" },
  { turn: 17, phase: "Phase 4", team: "RED", action: "PICK" },
  { turn: 18, phase: "Phase 4", team: "BLUE", action: "PICK" },
  { turn: 19, phase: "Phase 4", team: "BLUE", action: "PICK" },
  { turn: 20, phase: "Phase 4", team: "RED", action: "PICK" },
  { turn: 21, phase: "Phase 4", team: "RED", action: "PICK" },
  { turn: 22, phase: "Phase 4", team: "BLUE", action: "PICK" },
];

function RuleCard({ title, items, color }: { title: string; items: string[]; color: "amber" | "emerald" }) {
  const colorMap = {
    amber: "border-amber-500/30 bg-amber-500/[0.04]",
    emerald: "border-emerald-500/30 bg-emerald-500/[0.04]",
  };
  const titleMap = { amber: "text-amber-200", emerald: "text-emerald-200" };
  return (
    <div className={`rounded-xl border px-4 py-3 ${colorMap[color]}`}>
      <p className={`text-sm font-black ${titleMap[color]} mb-2`}>{title}</p>
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-xs leading-relaxed text-slate-300">
            <Shield size={10} className="mt-1 shrink-0 text-slate-500" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="group rounded-xl border border-slate-700/40 bg-slate-900/40 px-4 py-3">
      <summary className="cursor-pointer text-sm font-bold text-slate-200 hover:text-cyan-300 transition-colors list-none flex items-center justify-between gap-3">
        <span>{q}</span>
        <span className="text-slate-500 group-open:rotate-90 transition-transform">›</span>
      </summary>
      <p className="mt-3 text-xs leading-relaxed text-slate-400">{a}</p>
    </details>
  );
}
