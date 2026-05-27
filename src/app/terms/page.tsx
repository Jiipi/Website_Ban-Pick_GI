import Link from "next/link";
import { FileText, ArrowLeft, Goal, Scale, Plug, AlertCircle } from "lucide-react";
import { NavBar } from "@/components/NavBar";

export const metadata = {
  title: "Điều khoản Sử dụng — Genshin Ban/Pick",
  description: "Điều khoản sử dụng, quy tắc fair play và giới hạn trách nhiệm của hệ thống Ban/Pick.",
};

export const dynamic = "force-static";

export default function TermsPage() {
  return (
    <>
      <NavBar />
      <main className="min-h-screen px-4 py-10">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Header */}
          <div className="glass-strong rounded-3xl p-8 sm:p-10 animate-fade-in-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-300">
                <FileText size={22} />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-400">Legal</p>
                <h1 className="text-2xl font-black tracking-tight text-slate-100">Điều khoản Sử dụng</h1>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-slate-400">
              Bằng việc sử dụng hệ thống Ban/Pick, bạn đồng ý tuân thủ các điều khoản dưới đây và các quyết
              định vận hành hợp lý từ ban tổ chức hoặc trọng tài.
            </p>
          </div>

          {/* Section 1 — Purpose */}
          <section className="glass-strong rounded-3xl p-8 animate-fade-in-up delay-100">
            <div className="flex items-center gap-2 mb-4">
              <Goal size={18} className="text-amber-300" />
              <h2 className="text-lg font-black tracking-tight text-slate-100">1. Mục đích</h2>
            </div>
            <ul className="space-y-2">
              {[
                "Website là công cụ hỗ trợ tổ chức giải đấu La Hoàn theo format ban/pick cho cộng đồng Genshin Impact",
                "Dự án phi lợi nhuận, không bán lợi thế gameplay và không đại diện thương mại cho bất kỳ bên nào",
                "Dự án mang tính học thuật, thử nghiệm kỹ thuật realtime draft, thống kê và quản lý giải đấu",
              ].map((item) => (
                <li key={item} className="flex gap-2 text-sm leading-relaxed text-slate-300">
                  <FileText size={10} className="mt-1.5 shrink-0 text-slate-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Section 2 — Fair play */}
          <section className="glass-strong rounded-3xl p-8 animate-fade-in-up delay-200">
            <div className="flex items-center gap-2 mb-4">
              <Scale size={18} className="text-amber-300" />
              <h2 className="text-lg font-black tracking-tight text-slate-100">2. Quy tắc fair play</h2>
            </div>
            <ul className="space-y-2">
              {[
                "Không sử dụng cheat, tool can thiệp game, macro trái luật hoặc bất kỳ hình thức gian lận nào",
                "Không smurf, mượn tài khoản hoặc khai báo sai UID/build để tạo lợi thế không công bằng",
                "Tôn trọng đối thủ, trọng tài và khán giả; không toxic, quấy rối hoặc công kích cá nhân",
                "Quyết định của trọng tài là quyết định cuối cùng trong các tình huống tranh chấp trận đấu",
              ].map((item) => (
                <li key={item} className="flex gap-2 text-sm leading-relaxed text-slate-300">
                  <FileText size={10} className="mt-1.5 shrink-0 text-slate-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Section 3 — Third parties */}
          <section className="glass-strong rounded-3xl p-8 animate-fade-in-up delay-300">
            <div className="flex items-center gap-2 mb-4">
              <Plug size={18} className="text-amber-300" />
              <h2 className="text-lg font-black tracking-tight text-slate-100">3. Bên thứ ba</h2>
            </div>
            <ul className="space-y-2">
              {[
                "Genshin Impact là tài sản của HoYoverse/Cognosphere. Website này không sở hữu tài sản game",
                "Enka.Network là dịch vụ độc lập dùng để đọc public showcase từ UID người chơi",
                "Website không liên kết chính thức, không được tài trợ và không đại diện cho HoYoverse hay Enka.Network",
              ].map((item) => (
                <li key={item} className="flex gap-2 text-sm leading-relaxed text-slate-300">
                  <FileText size={10} className="mt-1.5 shrink-0 text-slate-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Section 4 — Limitations */}
          <section className="glass-strong rounded-3xl p-8 animate-fade-in-up delay-400">
            <div className="flex items-center gap-2 mb-4">
              <AlertCircle size={18} className="text-amber-300" />
              <h2 className="text-lg font-black tracking-tight text-slate-100">4. Giới hạn</h2>
            </div>
            <ul className="space-y-2">
              {[
                "Không đảm bảo uptime 100%; hệ thống có thể bảo trì, gián đoạn hoặc lỗi do dịch vụ bên thứ ba",
                "Không chịu trách nhiệm với mất dữ liệu, gián đoạn trận hoặc sai lệch thống kê do lỗi hệ thống ngoài kiểm soát",
                "Ban quản trị có thể thay đổi điều khoản để phù hợp với quy định giải đấu và trạng thái vận hành",
                "Nếu tiếp tục sử dụng website sau khi điều khoản thay đổi, bạn được xem là đã chấp nhận phiên bản mới",
              ].map((item) => (
                <li key={item} className="flex gap-2 text-sm leading-relaxed text-slate-300">
                  <FileText size={10} className="mt-1.5 shrink-0 text-slate-500" />
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
