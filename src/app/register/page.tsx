"use client";

import { Suspense, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Gamepad2, Loader2 } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { authFetch, getOrCreateClientId } from "@/lib/auth";
import { playClickSound, playConfirmSound, playErrorSound } from "@/lib/sounds";

function RegisterForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get("redirect") ?? "/lobby";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [uid, setUid] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    playClickSound();

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
    });
    const body = await response.json();

    if (!response.ok) {
      setLoading(false);
      setError(body.message ?? "Đăng ký thất bại");
      playErrorSound();
      return;
    }

    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setLoading(false);
      setError("Supabase chưa cấu hình trên client");
      playErrorSound();
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      setLoading(false);
      setError(signInError.message);
      playErrorSound();
      return;
    }

    if (uid.trim()) {
      const cid = getOrCreateClientId();
      const profileResponse = await authFetch("/api/lobby", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: cid, uid: uid.trim() }),
      });
      if (!profileResponse.ok) {
        const profileBody = await profileResponse.json().catch(() => ({}));
        setLoading(false);
        setError(profileBody.message ?? "Khong luu duoc UID mac dinh");
        playErrorSound();
        return;
      }
    }

    setLoading(false);
    playConfirmSound();
    router.push(redirect);
    router.refresh();
  }

  return (
    <form className="glass-strong w-full max-w-sm rounded-3xl p-7 animate-fade-in-up" onSubmit={submit}>
      <div className="mb-5 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-300">
          <Gamepad2 size={28} />
        </div>
        <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-cyan-300">Tuyển thủ</p>
        <h1 className="mt-1 text-2xl font-black text-slate-100">Đăng ký tài khoản</h1>
      </div>

      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">Tên hiển thị</label>
      <input
        className="input-field mt-2"
        value={name}
        onChange={(event) => setName(event.target.value)}
        required
        maxLength={24}
        autoComplete="name"
      />

      <label className="mt-4 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Genshin UID</label>
      <input
        className="input-field mt-2 font-mono tracking-[0.1em]"
        value={uid}
        onChange={(event) => setUid(event.target.value.replace(/\D/g, "").slice(0, 10))}
        minLength={9}
        maxLength={10}
        inputMode="numeric"
        placeholder="600012345"
      />

      <label className="mt-4 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Email</label>
      <input
        className="input-field mt-2"
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
        autoComplete="email"
      />

      <label className="mt-4 block text-[11px] font-bold uppercase tracking-wider text-slate-400">Mật khẩu</label>
      <input
        className="input-field mt-2"
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        required
        minLength={6}
        autoComplete="new-password"
      />

      {error && (
        <p className="mt-4 rounded-xl border border-red-800/50 bg-red-950/40 px-3 py-2 text-xs text-red-200">
          {error}
        </p>
      )}

      <button className="btn-primary mt-5 w-full" disabled={loading} type="submit">
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Đang đăng ký...
          </>
        ) : (
          <>
            Tạo tài khoản PLAYER
            <ArrowRight size={16} />
          </>
        )}
      </button>

      <p className="mt-4 text-center text-[10px] text-slate-500">
        Đã có tài khoản?{" "}
        <Link href={`/login?redirect=${encodeURIComponent(redirect)}`} className="text-cyan-300 hover:text-cyan-200">
          Đăng nhập
        </Link>
      </p>
      <p className="mt-2 text-center">
        <Link href="/" className="text-[10px] text-slate-500 hover:text-cyan-400">
          Về trang chủ
        </Link>
      </p>
    </form>
  );
}

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <Suspense fallback={<div className="text-slate-400">Loading...</div>}>
        <RegisterForm />
      </Suspense>
    </main>
  );
}
