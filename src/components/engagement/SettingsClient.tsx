"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Save, RotateCcw } from "lucide-react";

type Settings = {
  uid: string;
  theme: "dark" | "light" | "auto";
  language: "vi" | "en" | "zh" | "ja" | "ko";
  reducedMotion: boolean;
  compactMode: boolean;
  soundEnabled: boolean;
  soundVolume: number;
  notifyFriendRequest: boolean;
  notifyTournament: boolean;
  notifyMatchResult: boolean;
  notifyMissions: boolean;
  publicProfile: boolean;
  showInLeaderboard: boolean;
  defaultCostPerPoint: number;
  defaultBankTime: number;
  autoSubmitBuild: boolean;
};

export function SettingsClient() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [original, setOriginal] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/settings");
      const body = await res.json();
      if (!res.ok) {
        setError(body.message ?? "Không tải được cài đặt");
        return;
      }
      setSettings(body.settings);
      setOriginal(body.settings);
    } catch {
      setError("Lỗi kết nối");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
    setSuccess("");
  }

  async function save() {
    if (!settings || !original) return;
    setSaving(true);
    setError("");
    setSuccess("");

    // Build delta
    const patch: Record<string, unknown> = {};
    for (const key of Object.keys(settings) as (keyof Settings)[]) {
      if (key === "uid") continue;
      if (settings[key] !== original[key]) patch[key] = settings[key];
    }
    if (Object.keys(patch).length === 0) {
      setSuccess("Không có thay đổi");
      setSaving(false);
      return;
    }

    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.message ?? "Lưu thất bại");
      } else {
        setSettings(body.settings);
        setOriginal(body.settings);
        setSuccess("Đã lưu cài đặt");
      }
    } catch {
      setError("Lỗi kết nối");
    } finally {
      setSaving(false);
    }
  }

  function reset() {
    if (original) setSettings(original);
    setSuccess("");
    setError("");
  }

  if (loading) {
    return (
      <div className="glass-strong rounded-3xl py-16 text-center animate-fade-in-up delay-100">
        <p className="text-sm text-slate-400">Đang tải...</p>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="glass-strong rounded-3xl py-16 text-center animate-fade-in-up delay-100">
        <p className="text-3xl">🔒</p>
        <p className="mt-3 font-bold text-slate-300">Cần đăng ký UID</p>
        <p className="mt-1 text-sm text-slate-500">{error || "Vào sảnh chờ và đăng ký UID để chỉnh cài đặt."}</p>
        <Link href="/lobby" className="btn-primary mt-4">Vào sảnh chờ</Link>
      </div>
    );
  }

  const dirty = JSON.stringify(settings) !== JSON.stringify(original);

  return (
    <div className="space-y-5 animate-fade-in-up delay-100">
      {/* Theme & Display */}
      <Section title="Giao diện">
        <SelectRow
          label="Theme"
          value={settings.theme}
          options={[
            { value: "dark", label: "Tối" },
            { value: "light", label: "Sáng" },
            { value: "auto", label: "Tự động" },
          ]}
          onChange={(v) => update("theme", v as Settings["theme"])}
        />
        <SelectRow
          label="Ngôn ngữ"
          value={settings.language}
          options={[
            { value: "vi", label: "Tiếng Việt" },
            { value: "en", label: "English" },
            { value: "zh", label: "中文" },
            { value: "ja", label: "日本語" },
            { value: "ko", label: "한국어" },
          ]}
          onChange={(v) => update("language", v as Settings["language"])}
        />
        <ToggleRow
          label="Giảm hiệu ứng"
          hint="Tắt animation cho thiết bị yếu / accessibility"
          checked={settings.reducedMotion}
          onChange={(v) => update("reducedMotion", v)}
        />
        <ToggleRow
          label="Compact mode"
          hint="Dùng spacing nhỏ hơn để hiển thị nhiều nội dung"
          checked={settings.compactMode}
          onChange={(v) => update("compactMode", v)}
        />
      </Section>

      {/* Sound */}
      <Section title="Âm thanh">
        <ToggleRow
          label="Bật âm thanh"
          hint="Click sound, confirm sound, error sound..."
          checked={settings.soundEnabled}
          onChange={(v) => update("soundEnabled", v)}
        />
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-300">Âm lượng</label>
            <span className="font-mono text-xs text-slate-400 tabular-nums">{settings.soundVolume}</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={settings.soundVolume}
            onChange={(e) => update("soundVolume", Number(e.target.value))}
            disabled={!settings.soundEnabled}
            className="w-full disabled:opacity-50"
          />
        </div>
      </Section>

      {/* Notifications */}
      <Section title="Thông báo">
        <ToggleRow
          label="Lời mời kết bạn"
          checked={settings.notifyFriendRequest}
          onChange={(v) => update("notifyFriendRequest", v)}
        />
        <ToggleRow
          label="Giải đấu"
          checked={settings.notifyTournament}
          onChange={(v) => update("notifyTournament", v)}
        />
        <ToggleRow
          label="Kết quả trận đấu"
          checked={settings.notifyMatchResult}
          onChange={(v) => update("notifyMatchResult", v)}
        />
        <ToggleRow
          label="Nhiệm vụ"
          checked={settings.notifyMissions}
          onChange={(v) => update("notifyMissions", v)}
        />
      </Section>

      {/* Privacy */}
      <Section title="Quyền riêng tư">
        <ToggleRow
          label="Profile công khai"
          hint="Cho phép người khác xem profile qua /players/[uid]"
          checked={settings.publicProfile}
          onChange={(v) => update("publicProfile", v)}
        />
        <ToggleRow
          label="Hiển thị ở bảng xếp hạng"
          hint="Tham gia bảng xếp hạng W/L"
          checked={settings.showInLeaderboard}
          onChange={(v) => update("showInLeaderboard", v)}
        />
      </Section>

      {/* Draft preferences */}
      <Section title="Cấu hình draft mặc định">
        <NumberRow
          label="Cost mỗi point"
          hint="Số cost = 1 giây handicap. Hệ số mặc định khi tạo phòng."
          value={settings.defaultCostPerPoint}
          min={1}
          max={100}
          onChange={(v) => update("defaultCostPerPoint", v)}
        />
        <NumberRow
          label="Bank time mỗi đội (giây)"
          hint="Thời gian dự trữ mỗi đội cho cả ván draft"
          value={settings.defaultBankTime}
          min={30}
          max={600}
          onChange={(v) => update("defaultBankTime", v)}
        />
        <ToggleRow
          label="Auto-submit build"
          hint="Tự động submit build khi đủ thông tin"
          checked={settings.autoSubmitBuild}
          onChange={(v) => update("autoSubmitBuild", v)}
        />
      </Section>

      {/* Status */}
      {error && <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-xs text-rose-200">⚠️ {error}</div>}
      {success && <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-200">✓ {success}</div>}

      {/* Actions */}
      <div className="sticky bottom-4 flex justify-end gap-2">
        {dirty && (
          <button
            onClick={reset}
            disabled={saving}
            className="btn-outline backdrop-blur-md"
          >
            <RotateCcw size={14} />
            Hoàn tác
          </button>
        )}
        <button
          onClick={save}
          disabled={saving || !dirty}
          className="btn-primary backdrop-blur-md"
        >
          <Save size={14} />
          {saving ? "Đang lưu..." : "Lưu thay đổi"}
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="glass-strong rounded-2xl p-5 sm:p-6 space-y-4">
      <h2 className="text-sm font-black uppercase tracking-wider text-slate-200">{title}</h2>
      {children}
    </section>
  );
}

function ToggleRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-1">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-slate-200">{label}</p>
        {hint && <p className="mt-0.5 text-[11px] text-slate-500">{hint}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? "bg-cyan-500" : "bg-slate-700"
        }`}
        aria-pressed={checked}
        type="button"
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}

function SelectRow({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <p className="text-sm font-bold text-slate-200">{label}</p>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-field max-w-[180px]"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function NumberRow({
  label,
  hint,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-1">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-slate-200">{label}</p>
        {hint && <p className="mt-0.5 text-[11px] text-slate-500">{hint}</p>}
      </div>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="input-field max-w-[100px] font-mono text-right"
      />
    </div>
  );
}
