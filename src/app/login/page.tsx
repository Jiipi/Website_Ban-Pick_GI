"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { playClickSound, playConfirmSound, playErrorSound } from "@/lib/sounds";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect") ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    playClickSound();

    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setError("Supabase chưa cấu hình");
      setLoading(false);
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      playErrorSound();
      return;
    }

    playConfirmSound();
    router.push(redirect);
    router.refresh();
  }

  return (
    <form className="glass-strong w-full max-w-sm rounded-3xl p-7 animate-fade-in-up" onSubmit={submit}>
      <div className="mb-5 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-3xl">👑</div>
        <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-amber-300">Tài khoản</p>
        <h1 className="mt-1 text-2xl font-black text-slate-100">Đăng nhập</h1>
      </div>

      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">Email</label>
      <input
        className="input-field mt-2"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        autoComplete="email"
      />

      <label className="mt-4 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Mật khẩu</label>
      <input
        className="input-field mt-2"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        autoComplete="current-password"
      />

      {error && (
        <p className="mt-4 rounded-xl border border-red-800/50 bg-red-950/40 px-3 py-2 text-xs text-red-200">
          ⚠️ {error}
        </p>
      )}

      <button className="btn-primary mt-5 w-full" disabled={loading} type="submit">
        {loading ? "Đang đăng nhập..." : "Đăng nhập"}
      </button>

      <p className="mt-4 text-center text-[10px] text-slate-500">
        Tuyển thủ có thể{" "}
        <Link href={`/register?redirect=${encodeURIComponent(redirect)}`} className="text-cyan-300 hover:text-cyan-200">
          đăng ký tài khoản PLAYER
        </Link>
        . Trọng tài vẫn do Admin cấp quyền.
      </p>
      <p className="mt-2 text-center">
        <Link href="/" className="text-[10px] text-slate-500 hover:text-cyan-400">
          ← Về trang chủ
        </Link>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <Suspense fallback={<div className="text-slate-400">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
