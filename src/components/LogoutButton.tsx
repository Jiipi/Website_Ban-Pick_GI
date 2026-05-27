"use client";

import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { playClickSound } from "@/lib/sounds";

export function LogoutButton() {
  const router = useRouter();

  async function logout() {
    playClickSound();
    const supabase = createSupabaseBrowserClient();
    if (supabase) await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <button
      className="rounded-lg border border-slate-700/50 bg-slate-800/40 px-3 py-1.5 text-xs font-bold text-slate-300 transition-all hover:border-rose-500/40 hover:text-rose-300"
      onClick={logout}
      type="button"
    >
      Đăng xuất
    </button>
  );
}
