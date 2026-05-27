import Link from "next/link";
import { ArrowLeft, Calculator } from "lucide-react";
import { NavBar } from "@/components/NavBar";
import { CostCalculatorClient } from "@/components/tools/CostCalculatorClient";

export const metadata = {
  title: "Cost Calculator — Genshin Ban/Pick",
  description: "Tính cost và handicap nhanh cho 2 đội mà không cần tạo phòng.",
};

export const dynamic = "force-dynamic";

export default function CostCalculatorPage() {
  return (
    <>
      <NavBar />
      <main className="min-h-screen px-4 py-8">
        <div className="mx-auto max-w-6xl space-y-6">
          {/* Header */}
          <div className="glass-strong rounded-3xl px-6 py-5 sm:px-8 sm:py-6 animate-fade-in-up">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-300">
                  <Calculator size={22} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-400">Tools</p>
                  <h1 className="text-2xl font-black tracking-tight text-slate-100">Cost Calculator</h1>
                </div>
              </div>
              <Link href="/" className="btn-outline shrink-0">
                <ArrowLeft size={14} />
                Trang chủ
              </Link>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              Khai báo nhanh đội hình 2 đội để xem tổng Cost và Time Handicap. Không cần tạo phòng, kết quả không
              được lưu lại — phù hợp để check trước trận hoặc thử nghiệm.
            </p>
          </div>

          <CostCalculatorClient />
        </div>
      </main>
    </>
  );
}
