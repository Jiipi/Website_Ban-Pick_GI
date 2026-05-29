"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Sparkles,
  RefreshCw,
  Loader2,
  Trophy,
  Star,
  Pencil,
  Check,
  X,
} from "lucide-react";
import { authFetch } from "@/lib/auth";
import { playClickSound, playConfirmSound, playErrorSound } from "@/lib/sounds";

type ShowcaseChar = {
  characterId: string;
  avatarId: number;
  rarity: number;
  consLevel: number;
  weaponRarity: number;
  level: number;
  name: string;
  iconUrl: string | null;
  element: string;
};

type ProfileData = {
  uid: string;
  nickname: string;
  displayName: string | null;
  level: number;
  signature: string | null;
  avatarUrl: string | null;
  defaultAvatarUrl: string | null;
  showcase: ShowcaseChar[];
};

type PlayerProfileProps = {
  clientId: string;
};

export function PlayerProfile({ clientId }: PlayerProfileProps) {
  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [stale, setStale] = useState(false);

  // Edit states
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [pickingAvatar, setPickingAvatar] = useState(false);

  const fetchProfile = useCallback(
    async (manual = false) => {
      if (manual) setRefreshing(true);
      setError("");
      try {
        const res = await authFetch(
          `/api/profile?clientId=${encodeURIComponent(clientId)}`,
          { cache: "no-store" },
        );
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(body.message ?? "Không tải được hồ sơ");
          return;
        }
        setData(body.profile);
        setStale(Boolean(body.stale));
      } catch {
        setError("Lỗi kết nối");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [clientId],
  );

  useEffect(() => {
    queueMicrotask(() => {
      fetchProfile();
    });
  }, [fetchProfile]);

  function handleRefresh() {
    if (refreshing) return;
    playClickSound();
    fetchProfile(true);
  }

  function startEditName() {
    if (!data) return;
    setNameInput(data.displayName ?? data.nickname);
    setEditingName(true);
    playClickSound();
  }

  async function saveName() {
    if (saving || !data) return;
    setSaving(true);
    try {
      const res = await authFetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          displayName: nameInput.trim() === data.nickname ? null : nameInput.trim() || null,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.message ?? "Lưu thất bại");
        playErrorSound();
        return;
      }
      setData((d) =>
        d ? { ...d, displayName: body.profile.displayName } : d,
      );
      setEditingName(false);
      playConfirmSound();
    } catch {
      setError("Lỗi kết nối");
      playErrorSound();
    } finally {
      setSaving(false);
    }
  }

  async function selectAvatar(iconUrl: string | null) {
    if (saving || !data) return;
    setSaving(true);
    playClickSound();
    try {
      const res = await authFetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          customAvatarUrl: iconUrl,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.message ?? "Lưu thất bại");
        playErrorSound();
        return;
      }
      setData((d) =>
        d ? { ...d, avatarUrl: body.profile.avatarUrl } : d,
      );
      setPickingAvatar(false);
      playConfirmSound();
    } catch {
      setError("Lỗi kết nối");
      playErrorSound();
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="lobby-profile-card">
        <div className="lobby-profile-banner">
          <Loader2
            size={28}
            className="animate-spin"
            style={{ color: "#fbbf24", margin: "32px auto" }}
          />
          <p style={{ color: "#94a3b8", fontSize: 12, margin: 0 }}>
            Đang tải hồ sơ...
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="lobby-profile-card">
        <p className="lobby-profile-error">
          {error || "Không tìm thấy hồ sơ"}
        </p>
      </div>
    );
  }

  const displayAvatar = data.avatarUrl ?? data.defaultAvatarUrl;
  const displayedName = data.displayName ?? data.nickname;

  return (
    <div className="lobby-profile-card">
      <div className="lobby-profile-banner">
        <p className="lobby-profile-eyebrow">Traveler Profile</p>
        <div className="lobby-profile-avatar-wrap">
          {displayAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={displayAvatar}
              alt={displayedName}
              className="lobby-profile-avatar"
            />
          ) : (
            <div
              className="lobby-profile-avatar"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 32,
                fontWeight: 800,
                color: "#fcd34d",
              }}
            >
              {displayedName.charAt(0).toUpperCase()}
            </div>
          )}
          {/* Avatar change button */}
          {data.showcase.length > 0 && (
            <button
              type="button"
              className="lobby-profile-avatar-edit"
              onClick={() => {
                setPickingAvatar((v) => !v);
                playClickSound();
              }}
              title="Đổi avatar"
            >
              <Pencil size={11} />
            </button>
          )}
        </div>

        {/* Avatar picker */}
        {pickingAvatar && (
          <div className="lobby-avatar-picker">
            <p className="lobby-avatar-picker-title">Chọn avatar</p>
            <div className="lobby-avatar-picker-grid">
              {/* Default (from Enka profile picture) */}
              {data.defaultAvatarUrl && (
                <button
                  type="button"
                  className={`lobby-avatar-option ${
                    data.avatarUrl === data.defaultAvatarUrl ? "is-active" : ""
                  }`}
                  onClick={() => selectAvatar(null)}
                  disabled={saving}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={data.defaultAvatarUrl} alt="Mặc định" />
                </button>
              )}
              {data.showcase.map((char) =>
                char.iconUrl ? (
                  <button
                    key={char.avatarId}
                    type="button"
                    className={`lobby-avatar-option ${
                      data.avatarUrl === char.iconUrl ? "is-active" : ""
                    }`}
                    onClick={() => selectAvatar(char.iconUrl)}
                    disabled={saving}
                    title={char.name}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={char.iconUrl} alt={char.name} />
                  </button>
                ) : null,
              )}
            </div>
          </div>
        )}

        {/* Name (editable) */}
        {editingName ? (
          <div className="lobby-profile-name-edit">
            <input
              className="lobby-profile-name-input"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              maxLength={24}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") saveName();
                if (e.key === "Escape") setEditingName(false);
              }}
            />
            <div className="lobby-profile-name-actions">
              <button
                type="button"
                className="lobby-profile-name-save"
                onClick={saveName}
                disabled={saving || !nameInput.trim()}
              >
                {saving ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Check size={12} />
                )}
              </button>
              <button
                type="button"
                className="lobby-profile-name-cancel"
                onClick={() => setEditingName(false)}
              >
                <X size={12} />
              </button>
            </div>
          </div>
        ) : (
          <div className="lobby-profile-name-row">
            <h2 className="lobby-profile-name">{displayedName}</h2>
            <button
              type="button"
              className="lobby-profile-name-edit-btn"
              onClick={startEditName}
              title="Sửa tên hiển thị"
            >
              <Pencil size={11} />
            </button>
          </div>
        )}

        <p className="lobby-profile-uid">UID · {data.uid}</p>
      </div>

      <div className="lobby-profile-stats">
        <div className="lobby-profile-stat">
          <span className="lobby-profile-stat-label">Adventure Rank</span>
          <span className="lobby-profile-stat-value lobby-profile-stat-value--gold">
            AR {data.level || "—"}
          </span>
        </div>
        <div className="lobby-profile-stat">
          <span className="lobby-profile-stat-label">Showcase</span>
          <span className="lobby-profile-stat-value">
            {data.showcase.length} nhân vật
          </span>
        </div>
      </div>

      {data.signature && (
        <p className="lobby-profile-signature">
          &ldquo;{data.signature}&rdquo;
        </p>
      )}

      <div className="lobby-profile-section">
        <div className="lobby-profile-section-head">
          <span className="lobby-profile-section-title">
            <Trophy size={11} />
            Đội hình showcase
          </span>
          <button
            type="button"
            className="lobby-profile-refresh"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader2 size={11} className="animate-spin" />
            ) : (
              <RefreshCw size={11} />
            )}
            Làm mới
          </button>
        </div>

        {data.showcase.length === 0 ? (
          <p className="lobby-profile-showcase-empty">
            <Sparkles
              size={14}
              style={{ display: "inline", marginRight: 6, color: "#fbbf24" }}
            />
            Bật showcase trong game để hiển thị nhân vật.
          </p>
        ) : (
          <div className="lobby-profile-showcase">
            {data.showcase.map((char) => (
              <div
                key={char.avatarId}
                className={`lobby-showcase-card rarity-${char.rarity}`}
              >
                <div className="lobby-showcase-stars">
                  {Array.from({ length: char.rarity }).map((_, i) => (
                    <Star
                      key={i}
                      size={7}
                      fill="currentColor"
                      strokeWidth={0}
                    />
                  ))}
                </div>
                {char.iconUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={char.iconUrl}
                    alt={char.name}
                    className="lobby-showcase-portrait"
                  />
                ) : (
                  <div className="lobby-showcase-portrait" />
                )}
                <span className="lobby-showcase-name">{char.name}</span>
                <div className="lobby-showcase-meta">
                  <span className="lobby-showcase-cons">C{char.consLevel}</span>
                  <span className="lobby-showcase-level">
                    Lv {char.level}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {stale && (
        <p className="lobby-profile-error">
          Enka tạm không phản hồi — đang dùng dữ liệu lưu trước đó.
        </p>
      )}
      {error && !stale && <p className="lobby-profile-error">{error}</p>}
    </div>
  );
}
