"use client";

import Image from "next/image";
import { useState, type FormEvent } from "react";
import { AlertTriangle, Loader2, Search, Star, User } from "lucide-react";
import { getCharacterIconUrl } from "@/lib/genshin";

type ShowcaseCharacter = {
  characterId: string;
  avatarId: number;
  rarity: number;
  consLevel: number;
  weaponRarity: number;
  weaponName?: string;
  level: number;
};

type EnkaProfileResponse = {
  profile: {
    uid: string;
    nickname: string;
    level: number;
    signature?: string;
    avatarUrl?: string;
    showcase: ShowcaseCharacter[];
  };
};

type ApiError = { message?: string };

export function AbyssTrackerClient() {
  const [uid, setUid] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [profile, setProfile] = useState<EnkaProfileResponse["profile"] | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = uid.trim();
    if (!trimmed) {
      setError("Nhập UID để tra cứu.");
      return;
    }
    if (!/^\d{9,10}$/.test(trimmed)) {
      setError("UID phải là 9 hoặc 10 chữ số.");
      return;
    }

    setLoading(true);
    setError("");
    setProfile(null);

    try {
      const response = await fetch(`/api/enka?uid=${trimmed}`);
      const data = (await response.json()) as EnkaProfileResponse | ApiError;

      if (!response.ok) {
        const message = (data as ApiError).message ?? `Lỗi ${response.status}`;
        setError(message);
        return;
      }

      setProfile((data as EnkaProfileResponse).profile);
    } catch {
      setError("Không kết nối được tới server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Disclaimer */}
      <div className="glass-strong rounded-2xl border border-amber-400/40 bg-amber-500/5 px-5 py-4 animate-fade-in-up delay-75">
        <div className="flex items-start gap-3">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-300" />
          <p className="text-sm leading-relaxed text-amber-100/90">
            <span className="font-bold">Lưu ý:</span> Enka.Network chỉ cung cấp thông tin profile công khai và showcase. Dữ liệu tiến độ La Hoàn (Spiral Abyss) hiện không được hỗ trợ qua API này.
          </p>
        </div>
      </div>

      {/* UID input */}
      <form
        onSubmit={handleSubmit}
        className="glass-strong rounded-2xl px-5 py-5 animate-fade-in-up delay-100"
      >
        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400">
          UID người chơi
        </label>
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            inputMode="numeric"
            value={uid}
            onChange={(e) => setUid(e.target.value)}
            placeholder="Ví dụ: 800000000"
            className="input-field flex-1 min-w-[200px]"
            disabled={loading}
          />
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
            {loading ? "Đang tra..." : "Tra cứu"}
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          UID là 9 hoặc 10 chữ số, hiển thị ở góc dưới bên phải trong game.
        </p>
      </form>

      {error && (
        <div className="glass-strong rounded-2xl border border-rose-500/40 bg-rose-500/5 px-5 py-4 text-sm font-bold text-rose-200 animate-fade-in-up">
          {error}
        </div>
      )}

      {profile && (
        <>
          {/* Profile card */}
          <div className="glass-strong rounded-2xl px-5 py-5 animate-fade-in-up">
            <div className="flex flex-wrap items-center gap-5">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-violet-400/40 bg-slate-900/60">
                {profile.avatarUrl ? (
                  <Image
                    src={profile.avatarUrl}
                    alt={profile.nickname}
                    width={80}
                    height={80}
                    unoptimized
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-violet-300">
                    <User size={28} />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-500">
                  UID {profile.uid}
                </p>
                <h2 className="mt-1 truncate text-2xl font-black tracking-tight text-slate-100">
                  {profile.nickname}
                </h2>
                {profile.signature && (
                  <p className="mt-1 text-sm italic text-slate-400">{profile.signature}</p>
                )}
              </div>
              <div className="rounded-2xl border border-violet-400/40 bg-violet-500/10 px-4 py-3 text-center">
                <p className="text-[10px] font-bold uppercase tracking-wider text-violet-300">
                  Adventure Rank
                </p>
                <p className="mt-0.5 font-mono text-2xl font-black text-slate-100">
                  {profile.level}
                </p>
              </div>
            </div>
          </div>

          {/* Showcase */}
          <div className="glass-strong rounded-2xl px-5 py-5 animate-fade-in-up">
            <p className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-400">
              Showcase ({profile.showcase.length})
            </p>
            {profile.showcase.length === 0 ? (
              <p className="text-sm text-slate-500">
                Người chơi chưa bật showcase hoặc chưa thêm nhân vật nào.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {profile.showcase.map((character) => {
                  const isFiveStar = character.rarity === 5;
                  const accent = isFiveStar ? "#f0b53c" : "#a78bfa";
                  return (
                    <div
                      key={character.avatarId}
                      className="rounded-2xl border bg-slate-900/40 px-3 py-3"
                      style={{ borderColor: `${accent}55` }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border"
                          style={{ borderColor: `${accent}66`, backgroundColor: `${accent}11` }}
                        >
                          <Image
                            src={getCharacterIconUrl(character.characterId)}
                            alt={character.characterId}
                            width={64}
                            height={64}
                            unoptimized
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold capitalize text-slate-100">
                            {character.characterId.replace(/-/g, " ")}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-400">
                            Lv. <span className="font-mono font-bold text-slate-200">{character.level}</span>
                            <span className="mx-1.5 text-slate-600">·</span>
                            <span className="font-mono font-bold text-violet-300">C{character.consLevel}</span>
                          </p>
                          <div className="mt-1 flex items-center gap-2">
                            <div className="flex items-center gap-0.5 text-amber-300">
                              {Array.from({ length: character.rarity }).map((_, i) => (
                                <Star key={i} size={10} className="fill-current" />
                              ))}
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                              W: {character.weaponRarity}★
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
