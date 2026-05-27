import Link from "next/link";
import { BookOpen, ArrowLeft, Wrench } from "lucide-react";
import { NavBar } from "@/components/NavBar";

export const metadata = {
  title: "Hướng dẫn Draft — Genshin Ban/Pick",
  description: "Tổng hợp kiến thức draft ban/pick cho người chơi mới và nâng cao.",
};

export const dynamic = "force-static";

export default function GuidePage() {
  return (
    <>
      <NavBar />
      <main className="min-h-screen px-4 py-10">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Header */}
          <div className="glass-strong rounded-3xl p-8 sm:p-10 animate-fade-in-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-300">
                <BookOpen size={22} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-400">Knowledge Base</p>
                <h1 className="text-2xl font-black tracking-tight text-slate-100">Hướng dẫn Draft</h1>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-slate-400">
              Tổng hợp kiến thức draft ban/pick cho người chơi mới và nâng cao.
            </p>
          </div>

          {/* Article 1 */}
          <section className="glass-strong rounded-3xl p-8 animate-fade-in-up delay-100">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen size={18} className="text-emerald-300" />
              <h2 className="text-lg font-black tracking-tight text-slate-100">1. Ưu tiên Ban</h2>
            </div>
            <div className="space-y-3 text-sm leading-relaxed text-slate-300">
              <p>
                Nên ban nhân vật nào? Hãy nhắm tới những tướng có <strong className="text-slate-100">pick rate cao</strong> và
                thế mạnh vượt trội so với phần còn lại ở cùng vai trò. Một tướng nếu không bị ban sẽ gần như
                luôn được chọn — đó chính là ứng viên ban hàng đầu.
              </p>
              <p>
                <strong className="text-emerald-200">Ban phòng thủ</strong> là ban tướng mà đối thủ mạnh nhất
                (tướng mà bạn biết đối thủ sẽ pick). <strong className="text-emerald-200">Ban tấn công</strong> là
                ban tướng mà bạn không muốn gặp trong bất kỳ hoàn cảnh nào, bất kể đối thủ. Cân đối hai kiểu
                ban dựa trên thông tin bạn có về roster đối phương.
              </p>
            </div>
          </section>

          {/* Article 2 */}
          <section className="glass-strong rounded-3xl p-8 animate-fade-in-up delay-200">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen size={18} className="text-emerald-300" />
              <h2 className="text-lg font-black tracking-tight text-slate-100">2. Thứ tự Pick & Flex Pick</h2>
            </div>
            <div className="space-y-3 text-sm leading-relaxed text-slate-300">
              <p>
                Ưu tiên chọn nhân vật <strong className="text-slate-100">utility</strong> sớm — các tướng có khả
                năng flex nhiều vị trí, phù hợp cả Main DPS, Sub DPS hoặc Support tuỳ team comp. Để các main DPS
                thuần tuý chọn sau khi đã rõ hướng build đội.
              </p>
              <p>
                <strong className="text-emerald-200">Flex pick</strong> là chiến thuật chọn tướng đa năng ở lượt sớm,
                khiến đối thủ không thể đoán được bạn sẽ dùng tướng đó ở phòng nào và vai trò gì. Ví dụ:
                Kazuha có thể chơi Freeze Support, Vaporize Enabler, hoặc Anemo DPS — pick sớm giấu ý đồ rất tốt.
              </p>
            </div>
          </section>

          {/* Article 3 */}
          <section className="glass-strong rounded-3xl p-8 animate-fade-in-up delay-300">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen size={18} className="text-emerald-300" />
              <h2 className="text-lg font-black tracking-tight text-slate-100">3. Quản lý Cost</h2>
            </div>
            <div className="space-y-3 text-sm leading-relaxed text-slate-300">
              <p>
                Hệ thống Cost đo lường mức đầu tư tài khoản: <strong className="text-slate-100">nhân vật 5★ +1 cost</strong>,
                mỗi <strong className="text-slate-100">cung mệnh thêm +1</strong>, mỗi <strong className="text-slate-100">vũ khí
                5★ +1</strong>. Tổng cost cao hơn đối thủ đồng nghĩa bạn phải chấp nhận handicap thời gian.
              </p>
              <p>
                <strong className="text-emerald-200">Chiến lược low-cost</strong>: dùng nhiều tướng 4★ hoặc 5★ C0 với
                vũ khí 4★ để giữ cost thấp, ăn thời gian bù trừ. <strong className="text-emerald-200">High-investment</strong>:
                all-in vào nhân vật C2+ kèm vũ khí 5★ để có sức mạnh áp đảo, chấp nhận đi nhanh hơn. Cần cân nhắc
                kỹ khi nào nên chấp nhận handicap lớn — thường khi bạn chắc về tốc độ clear.
              </p>
            </div>
          </section>

          {/* Article 4 */}
          <section className="glass-strong rounded-3xl p-8 animate-fade-in-up delay-400">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen size={18} className="text-emerald-300" />
              <h2 className="text-lg font-black tracking-tight text-slate-100">4. Đọc draft đối thủ</h2>
            </div>
            <div className="space-y-3 text-sm leading-relaxed text-slate-300">
              <p>
                Quan sát pattern pick/ban của đối thủ qua nhiều trận để nhận diện team comp yêu thích. Nếu đối
                thủ liên tục ban Kazuha, khả năng cao họ không có counter Anemo tốt — bạn có thể giữ Kazuha làm
                bait ban để bảo toàn tướng khác.
              </p>
              <p>
                <strong className="text-emerald-200">Counter-pick</strong> dựa trên hai yếu tố chính:
                <strong className="text-slate-100"> nguyên tố</strong> (ví dụ chọn Hydro để phá Pyro Shield) và
                <strong className="text-slate-100"> role</strong> (ví dụ chọn heavy-AoE DPS counter đội dựa vào
                single-target). Kết hợp thông tin roster đối thủ (từ lịch sử trận) với trạng thái draft hiện tại
                để đưa ra quyết định counter tối ưu.
              </p>
            </div>
          </section>

          {/* Article 5 */}
          <section className="glass-strong rounded-3xl p-8 animate-fade-in-up delay-500">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen size={18} className="text-emerald-300" />
              <h2 className="text-lg font-black tracking-tight text-slate-100">5. Chuẩn bị Build & Enka</h2>
            </div>
            <div className="space-y-3 text-sm leading-relaxed text-slate-300">
              <p>
                Trước khi tham gia trận đấu, đảm bảo <strong className="text-slate-100">Enka showcase</strong> của bạn
                đang public. Vào game &rarr; Profile &rarr; bật &quot;Show Character Details&quot; cho các nhân vật
                bạn dự kiến dùng. Hệ thống sẽ tự động đọc build từ Enka khi bạn khai báo pick.
              </p>
              <p>
                Nếu build chưa cập nhật kịp trên Enka hoặc bạn muốn dùng build khác, hãy sử dụng
                <strong className="text-emerald-200"> khai báo manual</strong>: chọn vũ khí, constellation và set
                artifact thủ công trên giao diện build. Trọng tài sẽ xác minh build trước khi trận bắt đầu.
              </p>
            </div>
          </section>

          {/* Related tools */}
          <section className="glass-strong rounded-3xl p-8 animate-fade-in-up delay-600">
            <div className="flex items-center gap-2 mb-4">
              <Wrench size={18} className="text-emerald-300" />
              <h2 className="text-lg font-black tracking-tight text-slate-100">Công cụ liên quan</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <Link
                href="/tools/cost-calculator"
                className="rounded-xl border border-slate-700/40 bg-slate-900/40 px-4 py-3 transition-colors hover:border-emerald-500/30 hover:text-emerald-300"
              >
                <p className="text-sm font-black text-slate-100">Cost Calculator</p>
                <p className="mt-1 text-xs text-slate-400">Tính cost đội hình trước khi draft</p>
              </Link>
              <Link
                href="/tools/draft-simulator"
                className="rounded-xl border border-slate-700/40 bg-slate-900/40 px-4 py-3 transition-colors hover:border-emerald-500/30 hover:text-emerald-300"
              >
                <p className="text-sm font-black text-slate-100">Draft Simulator</p>
                <p className="mt-1 text-xs text-slate-400">Luyện tập draft với AI hoặc bạn bè</p>
              </Link>
              <Link
                href="/tools/team-builder"
                className="rounded-xl border border-slate-700/40 bg-slate-900/40 px-4 py-3 transition-colors hover:border-emerald-500/30 hover:text-emerald-300"
              >
                <p className="text-sm font-black text-slate-100">Team Builder</p>
                <p className="mt-1 text-xs text-slate-400">Xây dựng team comp tối ưu</p>
              </Link>
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
