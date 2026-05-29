"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, ChevronLeft, ChevronRight, Eye, Save, Settings, Trophy } from "lucide-react";
import { authFetch } from "@/lib/auth";

type TournamentFormat = "SINGLE_ELIM" | "DOUBLE_ELIM" | "ROUND_ROBIN";

const STEPS = [
  { key: "info", label: "Info" },
  { key: "format", label: "Format" },
  { key: "rules", label: "Rules" },
  { key: "schedule", label: "Schedule" },
  { key: "prize", label: "Prize" },
] as const;

const FORMAT_OPTIONS: Array<{ value: TournamentFormat; label: string; description: string }> = [
  { value: "SINGLE_ELIM", label: "Single Elim", description: "Thua 1 tran la bi loai. Nhanh, de van hanh." },
  { value: "DOUBLE_ELIM", label: "Double Elim", description: "Co nhanh thua. Phu hop giai nghiem tuc." },
  { value: "ROUND_ROBIN", label: "Round Robin", description: "Moi doi gap nhau mot lan. Tot cho vong bang." },
];

export function CreateTournamentClient({ organizerName }: { organizerName: string }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [format, setFormat] = useState<TournamentFormat>("SINGLE_ELIM");
  const [maxTeams, setMaxTeams] = useState(8);
  const [costCap, setCostCap] = useState(36);
  const [fearless, setFearless] = useState(false);
  const [bankTime, setBankTime] = useState(120);
  const [patch, setPatch] = useState("");
  const [region, setRegion] = useState("");
  const [rulesText, setRulesText] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [prizeInfo, setPrizeInfo] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const rulesSummary = useMemo(() => {
    return [
      `Format: ${formatLabel(format)}`,
      `Cost cap: ${costCap}`,
      `Bank time: ${bankTime}s`,
      `Fearless: ${fearless ? "On" : "Off"}`,
    ].join(" | ");
  }, [bankTime, costCap, fearless, format]);

  function autoSlug(value: string) {
    setName(value);
    if (!slug || slug === slugify(name)) {
      setSlug(slugify(value));
    }
  }

  function validateCurrentStep() {
    setError("");
    if (step === 0) {
      if (!name.trim()) return setError("Ten giai dau khong duoc trong"), false;
      if (!slug.trim()) return setError("Slug khong duoc trong"), false;
      if (!/^[a-z0-9-]+$/.test(slug)) return setError("Slug chi chua chu thuong, so va dau gach ngang"), false;
    }
    if (step === 3 && startDate && endDate && new Date(endDate) < new Date(startDate)) {
      return setError("Ngay ket thuc phai sau ngay bat dau"), false;
    }
    return true;
  }

  function nextStep() {
    if (!validateCurrentStep()) return;
    setStep((value) => Math.min(STEPS.length - 1, value + 1));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateCurrentStep()) return;

    setSubmitting(true);
    setError("");
    try {
      const res = await authFetch("/api/tournaments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim(),
          description: description.trim() || null,
          format,
          maxTeams,
          costCap,
          bankTime,
          fearlessDraft: fearless,
          patch: patch.trim() || null,
          region: region.trim() || null,
          rulesText: rulesText.trim() || null,
          startDate: startDate || null,
          endDate: endDate || null,
          bannerUrl: bannerUrl.trim() || null,
          prizeInfo: prizeInfo.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Tao giai dau that bai");
        return;
      }
      router.push(`/tournaments/${data.tournament.slug}`);
    } catch {
      setError("Loi ket noi toi server");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="glass-strong rounded-3xl p-6 sm:p-8 space-y-6 animate-fade-in-up delay-100">
      <div className="grid gap-2 sm:grid-cols-5">
        {STEPS.map((item, index) => (
          <button
            key={item.key}
            type="button"
            onClick={() => {
              if (index <= step || validateCurrentStep()) setStep(index);
            }}
            className={`rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-wider transition-colors ${
              index === step
                ? "bg-violet-500/20 text-violet-200 ring-1 ring-violet-500/40"
                : index < step
                  ? "bg-emerald-500/10 text-emerald-300"
                  : "bg-slate-800/40 text-slate-500"
            }`}
          >
            {index + 1}. {item.label}
          </button>
        ))}
      </div>

      {step === 0 && (
        <section className="space-y-4">
          <StepTitle icon={<Trophy size={16} />} title="Thong tin giai dau" />
          <Field label="Ten giai dau *">
            <input value={name} onChange={(e) => autoSlug(e.target.value)} className="input-field" maxLength={100} required />
          </Field>
          <Field label="Slug (URL) *" hint={`URL: /tournaments/${slug || "your-slug"}`}>
            <input value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase())} className="input-base font-mono" maxLength={60} required />
          </Field>
          <Field label="Mo ta">
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} maxLength={700} className="input-base resize-none" />
          </Field>
          <Field label="Banner URL">
            <input type="url" value={bannerUrl} onChange={(e) => setBannerUrl(e.target.value)} placeholder="https://..." className="input-field" />
          </Field>
        </section>
      )}

      {step === 1 && (
        <section className="space-y-4">
          <StepTitle icon={<Settings size={16} />} title="Format va so doi" />
          <div className="grid gap-3 md:grid-cols-3">
            {FORMAT_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFormat(option.value)}
                className={`rounded-2xl border p-4 text-left transition-colors ${
                  format === option.value
                    ? "border-violet-400/60 bg-violet-500/10 text-violet-100"
                    : "border-slate-700/40 bg-slate-900/40 text-slate-300 hover:border-slate-500/60"
                }`}
              >
                <p className="text-sm font-black">{option.label}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">{option.description}</p>
              </button>
            ))}
          </div>
          <Field label="So doi toi da *">
            <select value={maxTeams} onChange={(e) => setMaxTeams(Number(e.target.value))} className="input-field">
              <option value={4}>4 doi</option>
              <option value={8}>8 doi</option>
              <option value={16}>16 doi</option>
              <option value={32}>32 doi</option>
            </select>
          </Field>
        </section>
      )}

      {step === 2 && (
        <section className="space-y-4">
          <StepTitle icon={<Settings size={16} />} title="Rules" />
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Cost cap">
              <input type="number" min={0} max={999} value={costCap} onChange={(e) => setCostCap(Number(e.target.value))} className="input-field font-mono" />
            </Field>
            <Field label="Bank time (giay)">
              <input type="number" min={30} max={600} value={bankTime} onChange={(e) => setBankTime(Number(e.target.value))} className="input-field font-mono" />
            </Field>
            <label className="flex items-center gap-3 rounded-2xl border border-slate-700/40 bg-slate-900/40 px-4 py-3">
              <input type="checkbox" checked={fearless} onChange={(e) => setFearless(e.target.checked)} />
              <span className="text-sm font-bold text-slate-200">Fearless draft</span>
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Patch">
              <input value={patch} onChange={(e) => setPatch(e.target.value)} className="input-field font-mono" placeholder="VD: 5.7" />
            </Field>
            <Field label="Region">
              <select value={region} onChange={(e) => setRegion(e.target.value)} className="input-field">
                <option value="">All regions</option>
                <option value="Asia">Asia</option>
                <option value="America">America</option>
                <option value="Europe">Europe</option>
                <option value="TW/HK/MO">TW/HK/MO</option>
              </select>
            </Field>
          </div>
          <Field label="Rules markdown / ghi chu TO">
            <textarea
              value={rulesText}
              onChange={(e) => setRulesText(e.target.value)}
              rows={5}
              className="input-base resize-none"
              placeholder="Luật cấm retry, deadline submit kết quả, quy định tranh chấp..."
            />
          </Field>
          <div className="rounded-2xl border border-slate-700/40 bg-slate-900/40 px-4 py-3 text-xs text-slate-400">
            {rulesSummary}
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="space-y-4">
          <StepTitle icon={<CalendarDays size={16} />} title="Schedule" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Ngay bat dau">
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="input-field" />
            </Field>
            <Field label="Ngay ket thuc">
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="input-field" />
            </Field>
          </div>
        </section>
      )}

      {step === 4 && (
        <section className="space-y-4">
          <StepTitle icon={<Eye size={16} />} title="Prize va preview" />
          <Field label="Giai thuong">
            <input value={prizeInfo} onChange={(e) => setPrizeInfo(e.target.value)} className="input-field" maxLength={200} placeholder="VD: 500k VND + Battle Pass" />
          </Field>
          <div className="rounded-3xl border border-slate-700/40 bg-slate-900/40 p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-500">Preview</p>
            <h2 className="mt-2 text-2xl font-black text-slate-100">{name || "Ten giai dau"}</h2>
            <p className="mt-1 font-mono text-xs text-violet-300">/{slug || "slug"}</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <PreviewRow label="Organizer" value={organizerName} />
              <PreviewRow label="Format" value={formatLabel(format)} />
              <PreviewRow label="Teams" value={`${maxTeams} doi`} />
              <PreviewRow label="Rules" value={rulesSummary} />
              <PreviewRow label="Patch" value={patch || "TBD"} />
              <PreviewRow label="Region" value={region || "All"} />
              <PreviewRow label="Start" value={startDate || "TBD"} />
              <PreviewRow label="Prize" value={prizeInfo || "TBD"} />
            </div>
          </div>
        </section>
      )}

      {error && <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-xs text-rose-200">{error}</div>}

      <div className="flex flex-wrap justify-between gap-2">
        <button type="button" onClick={() => setStep((value) => Math.max(0, value - 1))} disabled={step === 0 || submitting} className="btn-outline">
          <ChevronLeft size={14} />
          Back
        </button>
        {step < STEPS.length - 1 ? (
          <button type="button" onClick={nextStep} className="btn-primary">
            Next
            <ChevronRight size={14} />
          </button>
        ) : (
          <button type="submit" disabled={submitting} className="btn-primary">
            <Save size={14} />
            {submitting ? "Dang tao..." : "Publish giai dau"}
          </button>
        )}
      </div>
    </form>
  );
}

function StepTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300">{icon}</div>
      <h2 className="text-sm font-black uppercase tracking-wider text-slate-200">{title}</h2>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-300">{label}</label>
      {children}
      {hint && <p className="text-[10px] text-slate-500">{hint}</p>}
    </div>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-800/60 bg-slate-950/35 px-3 py-2">
      <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 truncate text-xs font-bold text-slate-200">{value}</p>
    </div>
  );
}

function formatLabel(format: TournamentFormat) {
  if (format === "DOUBLE_ELIM") return "Double Elimination";
  if (format === "ROUND_ROBIN") return "Round Robin";
  return "Single Elimination";
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
