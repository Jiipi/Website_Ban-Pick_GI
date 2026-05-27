"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { isValidName } from "@/lib/constants";
import { playClickSound, playConfirmSound, playErrorSound } from "@/lib/sounds";

export function AdminCreateRefereeForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!isValidName(name)) {
      setError("Tên không hợp lệ");
      playErrorSound();
      return;
    }
    if (password.length < 6) {
      setError("Mật khẩu tối thiểu 6 ký tự");
      playErrorSound();
      return;
    }

    setLoading(true);
    playClickSound();

    const response = await fetch("/api/admin/referees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), password, name: name.trim() }),
    });
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(data.message ?? "Tạo thất bại");
      playErrorSound();
      return;
    }

    setSuccess(`Đã tạo: ${email}`);
    setEmail("");
    setPassword("");
    setName("");
    playConfirmSound();
    router.refresh();
  }

  return (
    <form className="glass-strong rounded-2xl p-5 animate-fade-in-up" onSubmit={submit}>
      <h2 className="mb-3 text-sm font-black uppercase tracking-wider text-slate-200">
        ➕ Tạo tài khoản Trọng tài
      </h2>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Email</label>
          <input
            className="input-field mt-1.5"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Mật khẩu</label>
          <input
            className="input-field mt-1.5"
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="≥ 6 ký tự"
            required
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Tên hiển thị</label>
          <input
            className="input-field mt-1.5"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={24}
            required
          />
        </div>
      </div>

      {error && <p className="mt-3 text-xs text-red-300">⚠️ {error}</p>}
      {success && <p className="mt-3 text-xs text-emerald-300">✓ {success}</p>}

      <button className="btn-primary mt-4" disabled={loading} type="submit">
        {loading ? "Đang tạo..." : "Tạo trọng tài"}
      </button>
    </form>
  );
}
