"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Crown,
  Gamepad2,
  Loader2,
  Shield,
} from "lucide-react";
import { DEFAULT_COST_PER_POINT, isValidCostPerPoint } from "@/lib/constants";
import { authFetch, getOrCreateClientId, setSession, syncClientIdCookie } from "@/lib/auth";
import { canCreateRoom as canCreateRoomRole } from "@/domain/auth/accountRoles";
import { LogoutButton } from "./LogoutButton";
import { playClickSound, playConfirmSound, playErrorSound } from "@/lib/sounds";

type HomeClientProps = {
  authenticated: boolean;
  userEmail: string | null;
  userName: string | null;
  userRole: string | null;
};

export function HomeClient({ authenticated, userEmail, userName, userRole }: HomeClientProps) {
  const router = useRouter();
  const [tabUser, setTabUser] = useState<{ email: string | null; name: string | null; role: string | null } | null>(null);
  const effectiveAuthenticated = Boolean(tabUser) || authenticated;
  const effectiveEmail = tabUser?.email ?? userEmail;
  const effectiveName = tabUser?.name ?? userName;
  const effectiveRole = tabUser?.role ?? userRole;
  const canCreateRoom = effectiveAuthenticated && canCreateRoomRole(effectiveRole);
  const roleLabel = effectiveRole === "ADMIN" ? "Admin" : effectiveRole === "REFEREE" ? "Trọng tài" : "Tuyển thủ";
  const [costPerPoint, setCostPerPoint] = useState(String(DEFAULT_COST_PER_POINT));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    authFetch("/api/auth/me", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok || cancelled) return;
        const body = await response.json().catch(() => null);
        if (!body || cancelled) return;
        setTabUser({
          email: body.email ?? null,
          name: body.name ?? null,
          role: body.role ?? null,
        });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  async function createRoom() {
    if (!effectiveAuthenticated) {
      router.push("/login?redirect=/");
      return;
    }
    if (!canCreateRoom) {
      setError("Tài khoản PLAYER chỉ vào sảnh chờ bằng UID, không được tạo phòng.");
      playErrorSound();
      return;
    }
    const cpp = Number(costPerPoint);
    if (!isValidCostPerPoint(cpp)) {
      setError("Giây / cost phải là số nguyên từ 1 đến 60.");
      playErrorSound();
      return;
    }
    setError("");
    setLoading(true);
    playClickSound();

    const clientId = getOrCreateClientId();
    const response = await authFetch("/api/room", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ costPerPoint: cpp, clientId }),
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
    await syncClientIdCookie(data.clientId ?? clientId);
    playConfirmSound();
    router.push(`/room/${data.room.code}?cid=${encodeURIComponent(data.clientId ?? clientId)}`);
  }

  return (
    <>
      {effectiveAuthenticated && (
        <div className="home-userbar">
          <div className="home-userbar__profile">
            <span className="home-userbar__avatar">
              {canCreateRoom ? <Crown size={18} /> : <Gamepad2 size={18} />}
            </span>
            <div>
              <p className="home-userbar__name">{effectiveName ?? effectiveEmail}</p>
              <p className="home-userbar__meta">
                {roleLabel} · {effectiveEmail}
              </p>
            </div>
          </div>
          <div className="home-userbar__actions">
            {effectiveRole === "ADMIN" && (
              <Link href="/admin" className="home-userbar__admin">
                <Shield size={13} />
                Admin
              </Link>
            )}
            <LogoutButton />
          </div>
        </div>
      )}

      <div className="home-role-grid">
        <article className="role-card role-card--referee">
          <div className="role-card__topline" />
          <div className="role-card__header">
            <div className="role-card__icon role-card__icon--amber">
              <Crown size={20} />
            </div>
            <div>
              <p className="role-card__eyebrow">Dành cho trọng tài</p>
              <h3 className="role-card__title">Tạo phòng đấu</h3>
            </div>
          </div>

          <p className="role-card__hint" style={{ flex: 1, color: '#cbd5e1', fontSize: '0.92rem', lineHeight: '1.6', margin: '0 0 1.5rem' }}>
            Khởi tạo phòng đấu mới, thiết lập luật chơi, thời gian và điều hành lượt cấm/chọn thời gian thực của hai đội với đầy đủ quyền quản lý trận đấu.
          </p>

          {canCreateRoom && (
              <div className="space-y-2 rounded-2xl border border-amber-400/20 bg-slate-950/35 p-4">
                <label className="block text-xs font-black uppercase tracking-[0.22em] text-amber-200" htmlFor="cost-per-point">
                  Giây cho mỗi 1 cost
                </label>
                <input
                  id="cost-per-point"
                  className="input-field font-mono"
                  max={60}
                  min={1}
                  onChange={(event) => setCostPerPoint(event.target.value)}
                  step={1}
                  type="number"
                  value={costPerPoint}
                />
                <p className="text-xs leading-relaxed text-slate-400">
                  Mặc định 10s. Chỉ đổi nếu muốn luật thời gian khác.
                </p>
              </div>
          )}

          {!effectiveAuthenticated ? (
            <div className="role-card__action">
              <p className="role-card__hint">
                Cần đăng nhập tài khoản trọng tài để bắt đầu tạo phòng thi đấu mới.
              </p>
              <Link href="/login?redirect=/" className="btn-gold">
                Đăng nhập ngay
                <ArrowRight size={16} />
              </Link>
            </div>
          ) : !canCreateRoom ? (
            <div className="role-card__action">
              <p className="role-card__hint">
                Tài khoản của bạn là PLAYER. Bạn có thể vào sảnh chờ, nhập UID Genshin và chờ trọng tài mời vào trận.
              </p>
              <Link href="/lobby" className="btn-primary" onClick={playClickSound}>
                Vào sảnh chờ
                <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <div className="role-card__action">
              <button
                className="btn-gold"
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
        </article>

        <article className="role-card role-card--player">
          <div className="role-card__topline" />
          <div className="role-card__header">
            <div className="role-card__icon role-card__icon--cyan">
              <Gamepad2 size={20} />
            </div>
            <div>
              <p className="role-card__eyebrow">Dành cho tuyển thủ</p>
              <h3 className="role-card__title">Vào sảnh chờ</h3>
            </div>
          </div>

          <p className="role-card__hint" style={{ flex: 1, color: '#cbd5e1', fontSize: '0.92rem', lineHeight: '1.6', margin: '0 0 1.5rem' }}>
            Tham gia vào sảnh chờ thi đấu bằng UID Genshin của bạn, chờ lời mời từ trọng tài và thực hiện lượt cấm/chọn trực tiếp cùng đồng đội.
          </p>

          <div className="role-card__action">
            {!effectiveAuthenticated ? (
              <>
                <p className="role-card__hint">
                  Đăng ký tài khoản PLAYER để login, sau đó nhập UID Genshin trong sảnh chờ và nhận lời mời từ trọng tài.
                </p>
                <div className="grid gap-2">
                  <Link href="/register?redirect=/lobby" className="btn-primary" onClick={playClickSound}>
                    Đăng ký PLAYER
                    <ArrowRight size={16} />
                  </Link>
                  <Link href="/login?redirect=/lobby" className="btn-outline" onClick={playClickSound}>
                    Đã có tài khoản
                  </Link>
                </div>
              </>
            ) : (
              <>
                <p className="role-card__hint">
                  Vào sảnh chờ bằng tài khoản hiện tại, nhập UID Genshin và giữ trạng thái online để trọng tài mời vào phòng.
                </p>
                <Link
                  href="/lobby"
                  className="btn-primary"
                  onClick={playClickSound}
                >
                  Vào sảnh chờ ngay
                  <ArrowRight size={16} />
                </Link>
              </>
            )}
          </div>
        </article>
      </div>

      {error && (
        <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          <p className="home-error">
            <AlertCircle size={16} />
            {error}
          </p>
        </div>
      )}
    </>
  );
}
