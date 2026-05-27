import Link from "next/link";
import { ArrowLeft, Settings as SettingsIcon } from "lucide-react";
import { NavBar } from "@/components/NavBar";
import { SettingsClient } from "@/components/engagement/SettingsClient";

export const metadata = {
  title: "Cài đặt — Genshin Ban/Pick",
  description: "Tuỳ chỉnh giao diện, âm thanh, thông báo, quyền riêng tư.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SettingsPage() {
  return (
    <>
      <NavBar />
      <main className="min-h-screen px-4 py-8">
        <div className="mx-auto max-w-2xl space-y-6">
          {/* Header */}
          <div className="glass-strong rounded-3xl px-6 py-5 sm:px-8 sm:py-6 animate-fade-in-up">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-700/30 text-slate-200">
                  <SettingsIcon size={22} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-400">Settings</p>
                  <h1 className="text-2xl font-black tracking-tight text-slate-100">Cài đặt</h1>
                </div>
              </div>
              <Link href="/" className="btn-outline shrink-0">
                <ArrowLeft size={14} />
                Trang chủ
              </Link>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              Cài đặt được lưu theo UID. Đăng nhập với UID giống nhau ở thiết bị khác sẽ có cùng cài đặt.
            </p>
          </div>

          <SettingsClient />
        </div>
      </main>
    </>
  );
}
