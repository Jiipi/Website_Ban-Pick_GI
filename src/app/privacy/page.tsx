import Link from "next/link";
import { Shield, ArrowLeft, Database, Target, Plug, UserCheck } from "lucide-react";
import { NavBar } from "@/components/NavBar";

export const metadata = {
  title: "Chính sách Bảo mật — Genshin Ban/Pick",
  description: "Chính sách bảo mật, dữ liệu thu thập và quyền của người dùng trên hệ thống Ban/Pick.",
};

export const dynamic = "force-static";

export default function PrivacyPage() {
  return (
    <>
      <NavBar />
      <main className="min-h-screen px-4 py-10">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Header */}
          <div className="glass-strong rounded-3xl p-8 sm:p-10 animate-fade-in-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-300">
                <Shield size={22} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-400">Legal</p>
                <h1 className="text-2xl font-black tracking-tight text-slate-100">Chính sách Bảo mật</h1>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-slate-400">
              Hệ thống Ban/Pick chỉ thu thập tối thiểu dữ liệu cần thiết để vận hành giải đấu. Trang này
              mô tả những gì được lưu, vì sao, và quyền của bạn với dữ liệu đó.
            </p>
          </div>

          {/* Section 1 — Data collected */}
          <section className="glass-strong rounded-3xl p-8 animate-fade-in-up delay-100">
            <div className="flex items-center gap-2 mb-4">
              <Database size={18} className="text-cyan-300" />
              <h2 className="text-lg font-black tracking-tight text-slate-100">1. Dữ liệu được thu thập</h2>
            </div>
            <p className="text-sm text-slate-400 mb-4">
              Khi bạn đăng nhập và tham gia trận đấu, hệ thống lưu các trường sau:
            </p>
            <ul className="space-y-2">
              {[
                "Email — chỉ khi bạn đăng nhập bằng OAuth provider (Google, Discord)",
                "UID Genshin — bạn tự nhập để đồng bộ profile từ Enka.Network",
                "Nickname & avatar — lấy từ provider đăng nhập hoặc Enka",
                "Lịch sử draft — danh sách trận đã tham gia, ban/pick, kết quả",
                "Thống kê trận đấu — winrate, MVP, pick/ban rate cá nhân",
              ].map((item) => (
                <li key={item} className="flex gap-2 text-sm leading-relaxed text-slate-300">
                  <Shield size={10} className="mt-1.5 shrink-0 text-slate-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Section 2 — Purpose */}
          <section className="glass-strong rounded-3xl p-8 animate-fade-in-up delay-200">
            <div className="flex items-center gap-2 mb-4">
              <Target size={18} className="text-cyan-300" />
              <h2 className="text-lg font-black tracking-tight text-slate-100">2. Mục đích sử dụng</h2>
            </div>
            <ul className="space-y-2">
              {[
                "Vận hành hệ thống ban/pick theo thời gian thực — đồng bộ trạng thái giữa player, trọng tài, khán giả",
                "Hiển thị bảng xếp hạng, thống kê cá nhân, lịch sử trận để cộng đồng theo dõi",
                "Kết nối cộng đồng — danh sách bạn bè, feed hoạt động, mời tham gia trận",
                "Cải thiện chất lượng dịch vụ qua phân tích ẩn danh các phiên draft",
              ].map((item) => (
                <li key={item} className="flex gap-2 text-sm leading-relaxed text-slate-300">
                  <Shield size={10} className="mt-1.5 shrink-0 text-slate-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Section 3 — Third parties */}
          <section className="glass-strong rounded-3xl p-8 animate-fade-in-up delay-300">
            <div className="flex items-center gap-2 mb-4">
              <Plug size={18} className="text-cyan-300" />
              <h2 className="text-lg font-black tracking-tight text-slate-100">3. Dịch vụ bên thứ ba</h2>
            </div>
            <ul className="space-y-2">
              {[
                "Supabase — cung cấp Auth (đăng nhập OAuth) và Database (lưu profile, trận đấu, realtime sync)",
                "Enka.Network — đọc public showcase từ UID Genshin của bạn để tự động khai báo build",
                "HoYoverse — chỉ tham chiếu dữ liệu game (tên nhân vật, vũ khí, hình ảnh). Web không có liên kết chính thức (non-affiliate)",
              ].map((item) => (
                <li key={item} className="flex gap-2 text-sm leading-relaxed text-slate-300">
                  <Shield size={10} className="mt-1.5 shrink-0 text-slate-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Section 4 — Your rights */}
          <section className="glass-strong rounded-3xl p-8 animate-fade-in-up delay-400">
            <div className="flex items-center gap-2 mb-4">
              <UserCheck size={18} className="text-cyan-300" />
              <h2 className="text-lg font-black tracking-tight text-slate-100">4. Quyền của bạn</h2>
            </div>
            <ul className="space-y-2">
              {[
                "Yêu cầu xoá toàn bộ dữ liệu cá nhân bằng cách liên hệ admin qua trang Liên hệ hoặc Discord",
                "Truy cập, chỉnh sửa nickname, UID và build từ trang Cài đặt",
                "Không chia sẻ dữ liệu với bên thứ ba ngoài mục đích vận hành đã nêu ở mục 2 và mục 3",
                "Có thể yêu cầu export dữ liệu cá nhân ở định dạng JSON khi cần",
              ].map((item) => (
                <li key={item} className="flex gap-2 text-sm leading-relaxed text-slate-300">
                  <Shield size={10} className="mt-1.5 shrink-0 text-slate-500" />
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
