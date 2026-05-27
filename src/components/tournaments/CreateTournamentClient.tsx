"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Save } from "lucide-react";

export function CreateTournamentClient({ organizerName }: { organizerName: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [maxTeams, setMaxTeams] = useState(8);
  const [startDate, setStartDate] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [prizeInfo, setPrizeInfo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function autoSlug(value: string) {
    setName(value);
    if (!slug || slug === slugify(name)) {
      setSlug(slugify(value));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim()) return setError("Tên giải đấu không được trống");
    if (!slug.trim()) return setError("Slug không được trống");
    if (!/^[a-z0-9-]+$/.test(slug)) return setError("Slug chỉ chứa chữ thường, số và dấu gạch ngang");

    setSubmitting(true);
    try {
      const res = await fetch("/api/tournaments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim(),
          description: description.trim() || null,
          maxTeams,
          startDate: startDate || null,
          bannerUrl: bannerUrl.trim() || null,
          prizeInfo: prizeInfo.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Tạo giải đấu thất bại");
        return;
      }
      router.push(`/tournaments/${data.tournament.slug}`);
    } catch {
      setError("Lỗi kết nối tới server");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="glass-strong rounded-3xl p-6 sm:p-8 space-y-5 animate-fade-in-up delay-100">
      <Field label="Tên giải đấu *">
        <input
          type="text"
          value={name}
          onChange={(e) => autoSlug(e.target.value)}
          placeholder="VD: La Hoàn Cảnh Giới Cup 2026"
          maxLength={100}
          className="input-field"
          required
        />
      </Field>

      <Field label="Slug (URL) *" hint={`URL: /tournaments/${slug || "your-slug"}`}>
        <input
          type="text"
          value={slug}
          onChange={(e) => setSlug(e.target.value.toLowerCase())}
          placeholder="lhcg-cup-2026"
          maxLength={60}
          className="input-base font-mono"
          required
        />
      </Field>

      <Field label="Mô tả" hint="Tuỳ chọn — giới thiệu ngắn về giải đấu">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          maxLength={500}
          className="input-base resize-none"
          placeholder="Thông tin giải đấu, luật chơi đặc biệt..."
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Số đội tối đa *">
          <select
            value={maxTeams}
            onChange={(e) => setMaxTeams(Number(e.target.value))}
            className="input-field"
          >
            <option value={4}>4 đội</option>
            <option value={8}>8 đội</option>
            <option value={16}>16 đội</option>
            <option value={32}>32 đội</option>
          </select>
        </Field>
        <Field label="Ngày bắt đầu" hint="Tuỳ chọn">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="input-field"
          />
        </Field>
      </div>

      <Field label="Banner URL" hint="Tuỳ chọn — link ảnh banner cho giải đấu">
        <input
          type="url"
          value={bannerUrl}
          onChange={(e) => setBannerUrl(e.target.value)}
          placeholder="https://..."
          className="input-field"
        />
      </Field>

      <Field label="Giải thưởng" hint="Tuỳ chọn — mô tả giải thưởng">
        <input
          type="text"
          value={prizeInfo}
          onChange={(e) => setPrizeInfo(e.target.value)}
          placeholder="VD: 500k VNĐ + Battle Pass"
          maxLength={200}
          className="input-field"
        />
      </Field>

      <div className="rounded-xl border border-slate-700/40 bg-slate-900/40 p-3 text-xs text-slate-400">
        <p>
          <span className="text-slate-300 font-bold">Organizer:</span> {organizerName}
        </p>
        <p className="mt-1">
          <span className="text-slate-300 font-bold">Format:</span> Single Elimination — bracket sẽ tự động tạo khi đủ số đội.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-xs text-rose-200">
          ⚠️ {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="btn-primary w-full"
      >
        <Save size={14} />
        {submitting ? "Đang tạo..." : "Tạo giải đấu"}
      </button>
    </form>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-300">
        {label}
      </label>
      {children}
      {hint && <p className="text-[10px] text-slate-500">{hint}</p>}
    </div>
  );
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
