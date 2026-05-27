"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Crown, Gamepad2, Loader2, ArrowRight, AlertCircle, Shield } from "lucide-react";
import { DEFAULT_COST_PER_POINT, MIN_COST_PER_POINT, MAX_COST_PER_POINT, isValidCostPerPoint } from "@/lib/constants";
import { getOrCreateClientId, setSession } from "@/lib/auth";
import { LogoutButton } from "./LogoutButton";
import { HowItWorks } from "./HowItWorks";
import { playClickSound, playConfirmSound, playErrorSound } from "@/lib/sounds";

type HomeClientProps = {
  authenticated: boolean;
  userEmail: string | null;
  userName: string | null;
  userRole: string | null;
};

export function HomeClient({ authenticated, userEmail, userName, userRole }: HomeClientProps) {
  const router = useRouter();
  const [costPerPoint, setCostPerPoint] = useState(DEFAULT_COST_PER_POINT);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function createRoom() {
    if (!authenticated) {
      router.push("/login?redirect=/");
      return;
    }
    if (!isValidCostPerPoint(costPerPoint)) {
      setError(`Giây / cost phải là số nguyên từ ${MIN_COST_PER_POINT} đến ${MAX_COST_PER_POINT}`);
      playErrorSound();
      return;
    }
    setError("");
    setLoading(true);
    playClickSound();

    const clientId = getOrCreateClientId();
    const response = await fetch("/api/room", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ costPerPoint, clientId }),
    });
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(data.message ?? "Không tạo được phòng");
      playErrorSound();
      return;
    }

    setSession(data.room.code, {
      name: data.session.name,
      role: data.session.role,
      team: data.session.team,
    });
    playConfirmSound();
    router.push(`/room/${data.room.code}`);
  }

  return (
    <>
      {/* ── Authenticated user bar ── */}
      {authenticated && (
        <div className="mb-6 flex items-center justify-between rounded-xl border border-amber-500/25 bg-amber-500/[0.04] px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
              <Crown size={18} />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-slate-200">
                {userName ?? userEmail}
              </p>
              <p className="text-xs text-slate-500">
                {userRole === "ADMIN" ? "Admin" : "Trọng tài"} · {userEmail}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {userRole === "ADMIN" && (
              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/[0.06] px-3 py-1.5 text-xs font-semibold text-amber-300 transition-colors hover:bg-amber-500/15"
              >
                <Shield size={13} />
                Admin
              </Link>
            )}
            <LogoutButton />
          </div>
        </div>
      )}

      {/* ── Role Selection Cards ── */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Referee Card */}
        <div className="role-card role-card--referee">
          <div className="role-card__header">
            <div className="role-card__icon role-card__icon--amber">
              <Crown size={20} />
            </div>
            <div>
              <h2 className="role-card__title">Trọng tài</h2>
              <p className="role-card__subtitle">Quản lý & điều hành trận đấu</p>
            </div>
          </div>

          <ul className="role-card__features">
            <li><span className="role-card__bullet role-card__bullet--amber">•</span>Tạo phòng thi đấu</li>
            <li><span className="role-card__bullet role-card__bullet--amber">•</span>Mời player từ sảnh chờ</li>
            <li><span className="role-card__bullet role-card__bullet--amber">•</span>Điều khiển quá trình draft</li>
            <li><span className="role-card__bullet role-card__bullet--amber">•</span>Xem kết quả & handicap</li>
          </ul>

          <div className="role-card__divider" />

          {!authenticated ? (
            <div className="role-card__action">
              <p className="role-card__hint">
                Chỉ Trọng tài đã đăng ký mới tạo được phòng.
              </p>
              <Link href="/login?redirect=/" className="btn-gold w-full justify-center">
                Đăng nhập trọng tài
                <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <div className="role-card__action">
              <label className="role-card__label">Giây / 1 cost</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={MIN_COST_PER_POINT}
                  max={MAX_COST_PER_POINT}
                  value={costPerPoint}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    if (!isNaN(v)) setCostPerPoint(v);
                  }}
                  className="cost-input flex-1"
                />
                <span className="text-xs text-slate-500 whitespace-nowrap">giây (1–60)</span>
              </div>

              <button
                className="btn-gold mt-4 w-full"
                disabled={loading}
                onClick={createRoom}
                type="button"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Đang tạo...
                  </>
                ) : (
                  <>
                    Tạo phòng mới
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Player Card */}
        <div className="role-card role-card--player">
          <div className="role-card__header">
            <div className="role-card__icon role-card__icon--cyan">
              <Gamepad2 size={20} />
            </div>
            <div>
              <h2 className="role-card__title">Tuyển thủ</h2>
              <p className="role-card__subtitle">Đăng ký & tham gia thi đấu</p>
            </div>
          </div>

          <ul className="role-card__features">
            <li><span className="role-card__bullet role-card__bullet--cyan">•</span>Đăng ký UID Genshin</li>
            <li><span className="role-card__bullet role-card__bullet--cyan">•</span>Vào sảnh chờ đợi mời</li>
            <li><span className="role-card__bullet role-card__bullet--cyan">•</span>Tham gia Ban/Pick realtime</li>
            <li><span className="role-card__bullet role-card__bullet--cyan">•</span>Khai báo build & xem kết quả</li>
          </ul>

          <div className="role-card__divider" />

          <div className="role-card__action">
            <p className="role-card__hint">
              Không cần đăng nhập. Chỉ cần UID Genshin Impact.
            </p>
            <Link
              href="/lobby"
              className="btn-primary w-full justify-center"
              onClick={playClickSound}
            >
              Vào sảnh chờ
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <p className="mt-5 flex items-start gap-2 rounded-lg border border-red-800/40 bg-red-950/30 px-4 py-3 text-sm text-red-200">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          {error}
        </p>
      )}

      {/* ── How It Works ── */}
      <HowItWorks />
    </>
  );
}
