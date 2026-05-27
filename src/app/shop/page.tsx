import Link from "next/link";
import { ShoppingBag, ArrowLeft, Lock, Sparkles, Trophy } from "lucide-react";
import { NavBar } from "@/components/NavBar";

export const metadata = {
  title: "Shop — Genshin Ban/Pick",
  description: "Đổi XP tích luỹ từ nhiệm vụ và thành tựu lấy vật phẩm trang trí. Không pay-to-win.",
};

export const dynamic = "force-static";

const COSMETIC_ITEMS = [
  { name: "Khung Avatar Vàng", price: "500 XP", description: "Avatar frame unlock" },
  { name: "Huy hiệu MVP", price: "300 XP", description: "Badge trên profile" },
  { name: "Banner Liyue", price: "1000 XP", description: "Custom banner cover" },
  { name: "Màu đội Tím", price: "200 XP", description: "Custom team color" },
  { name: "Khung Avatar Kim cương", price: "2000 XP", description: "Premium frame" },
  { name: "Title Chiến thần", price: "800 XP", description: "Danh hiệu đặc biệt" },
];

export default function ShopPage() {
  return (
    <>
      <NavBar />
      <main className="min-h-screen px-4 py-10">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Header */}
          <div className="glass-strong rounded-3xl p-8 sm:p-10 animate-fade-in-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-300">
                <ShoppingBag size={22} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-400">Rewards</p>
                <h1 className="text-2xl font-black tracking-tight text-slate-100">Shop Phần thưởng</h1>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-slate-400">
              Đổi XP tích luỹ từ nhiệm vụ và thành tựu lấy vật phẩm trang trí. Không pay-to-win.
            </p>
          </div>

          {/* Banner */}
          <section className="glass-strong rounded-3xl p-8 animate-fade-in-up delay-100">
            <div className="rounded-2xl border border-violet-500/25 bg-violet-500/[0.05] px-6 py-5">
              <p className="text-xl font-black tracking-tight text-violet-200">🏗 Đang phát triển</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                XP shop sẽ sớm mở để bạn đổi vật phẩm trang trí profile, avatar và banner. Tất cả phần thưởng
                chỉ mang tính cosmetic, không có giao dịch tiền thật và không tạo lợi thế trong trận đấu.
              </p>
            </div>
          </section>

          {/* Preview grid */}
          <section className="glass-strong rounded-3xl p-8 animate-fade-in-up delay-200">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={18} className="text-violet-300" />
              <h2 className="text-lg font-black tracking-tight text-slate-100">Vật phẩm xem trước</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {COSMETIC_ITEMS.map((item) => (
                <div key={item.name} className="relative overflow-hidden rounded-2xl border border-slate-700/40 bg-slate-900/45 p-4">
                  <div className="absolute right-3 top-3 rounded-full border border-slate-700/50 bg-slate-950/70 p-2 text-slate-500">
                    <Lock size={14} />
                  </div>
                  <div className="pr-10">
                    <h3 className="text-sm font-black text-slate-100">{item.name}</h3>
                    <span className="mt-2 inline-flex rounded-full bg-violet-500/15 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-violet-200">
                      {item.price}
                    </span>
                    <p className="mt-3 text-xs leading-relaxed text-slate-400">{item.description}</p>
                  </div>
                  <span className="mt-4 inline-flex rounded-lg border border-slate-700/50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Sắp có
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* XP earning */}
          <section className="glass-strong rounded-3xl p-8 animate-fade-in-up delay-300">
            <div className="flex items-center gap-2 mb-4">
              <Trophy size={18} className="text-violet-300" />
              <h2 className="text-lg font-black tracking-tight text-slate-100">Cách kiếm XP</h2>
            </div>
            <ul className="space-y-2">
              {[
                "Nhiệm vụ hằng ngày — đăng nhập, hoàn thành draft, gửi kết quả trận",
                "Nhiệm vụ hằng tuần — chơi đủ số trận, thử team comp mới, tham gia cộng đồng",
                "Thành tựu — chuỗi thắng, MVP, hỗ trợ tổ chức giải đấu hoặc đạt mốc thống kê đặc biệt",
              ].map((item) => (
                <li key={item} className="flex gap-2 text-sm leading-relaxed text-slate-300">
                  <ShoppingBag size={10} className="mt-1.5 shrink-0 text-slate-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
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
