import Link from "next/link";
import { ArrowLeft, Code } from "lucide-react";
import { NavBar } from "@/components/NavBar";
import { ApiDocsClient } from "@/components/system/ApiDocsClient";

export const metadata = {
  title: "API Docs — Genshin Ban/Pick",
  description: "Tài liệu các API endpoints công khai.",
};

export const dynamic = "force-static";

export default function ApiDocsPage() {
  return (
    <>
      <NavBar />
      <main className="min-h-screen px-4 py-8">
        <div className="mx-auto max-w-5xl space-y-6">
          {/* Header */}
          <div className="glass-strong rounded-3xl px-6 py-5 sm:px-8 sm:py-6 animate-fade-in-up">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-300">
                  <Code size={22} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-400">Documentation</p>
                  <h1 className="text-2xl font-black tracking-tight text-slate-100">API Docs</h1>
                </div>
              </div>
              <Link href="/" className="btn-outline shrink-0">
                <ArrowLeft size={14} />
                Trang chủ
              </Link>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              Tham chiếu các API endpoints công khai của hệ thống. Phần lớn yêu cầu cookie{" "}
              <code className="rounded bg-slate-800/60 px-1 py-0.5 font-mono text-[11px] text-cyan-300">bp_client_id</code>.
            </p>
          </div>

          <ApiDocsClient />
        </div>
      </main>
    </>
  );
}
