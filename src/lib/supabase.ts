"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;
let cleanedSharedCookies = false;

function clearSharedSupabaseCookies() {
  if (cleanedSharedCookies || typeof document === "undefined") return;
  cleanedSharedCookies = true;
  for (const cookie of document.cookie.split(";")) {
    const name = cookie.split("=")[0]?.trim();
    if (!name || !name.startsWith("sb-")) continue;
    document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
  }
}

export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  clearSharedSupabaseCookies();

  if (browserClient) return browserClient;

  browserClient = createClient(url, anonKey, {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: true,
      persistSession: true,
      storage: typeof window === "undefined" ? undefined : window.sessionStorage,
      storageKey: "bp_supabase_auth",
    },
  });

  return browserClient;
}
