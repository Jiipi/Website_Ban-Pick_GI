"use client";

import { useState } from "react";
import { Send, CheckCircle } from "lucide-react";

const CATEGORIES = [
  { value: "bug", label: "Bug report" },
  { value: "feature", label: "Feature request" },
  { value: "balance", label: "Cân bằng / Luật" },
  { value: "content", label: "Nội dung / UI" },
  { value: "other", label: "Khác" },
];

export function FeedbackFormClient() {
  const [category, setCategory] = useState("feature");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [contactUid, setContactUid] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Vui lòng nhập tiêu đề.");
      return;
    }
    if (!body.trim()) {
      setError("Vui lòng mô tả chi tiết.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          title: title.trim(),
          body: body.trim(),
          contactUid: contactUid.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "Gửi thất bại");
      } else {
        setSubmitted(true); // eslint-disable-line react-hooks/set-state-in-effect
      }
    } catch {
      setError("Lỗi kết nối");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="glass-strong rounded-3xl p-8 text-center animate-fade-in-up delay-100">
        <CheckCircle size={48} className="mx-auto text-emerald-300" />
        <h2 className="mt-4 text-xl font-black text-slate-100">Đã gửi thành công!</h2>
        <p className="mt-2 text-sm text-slate-400">
          Cảm ơn bạn đã góp ý. Đội ngũ sẽ xem xét sớm nhất có thể.
        </p>
        <button
          onClick={() => {
            setSubmitted(false);
            setTitle("");
            setBody("");
            setContactUid("");
            setCategory("feature");
          }}
          className="btn-outline mt-6"
        >
          Gửi góp ý khác
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="glass-strong rounded-3xl p-6 sm:p-8 space-y-5 animate-fade-in-up delay-100">
      <div>
        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">
          Loại góp ý
        </label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setCategory(c.value)}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
                category === c.value
                  ? "bg-cyan-500/20 text-cyan-200 ring-1 ring-cyan-500/40"
                  : "bg-slate-800/40 text-slate-400 hover:bg-slate-800/70 hover:text-slate-200"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">
          Tiêu đề <span className="text-rose-400">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="VD: Không thể xem bracket trên mobile"
          className="input-field w-full"
          maxLength={200}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">
          Mô tả chi tiết <span className="text-rose-400">*</span>
        </label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Mô tả rõ ràng: bước tái hiện, expected vs actual, ảnh chụp nếu có..."
          className="input-field w-full min-h-[120px] resize-y"
          maxLength={2000}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">
          UID liên hệ (tuỳ chọn)
        </label>
        <input
          type="text"
          value={contactUid}
          onChange={(e) => setContactUid(e.target.value)}
          placeholder="UID Genshin để đội ngũ liên hệ"
          className="input-field w-full"
          maxLength={20}
        />
      </div>

      {error && (
        <p className="rounded-xl border border-rose-500/30 bg-rose-500/[0.06] px-4 py-2 text-xs text-rose-300">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="btn-primary flex items-center gap-2 disabled:opacity-50"
      >
        <Send size={14} />
        {submitting ? "Đang gửi..." : "Gửi góp ý"}
      </button>
    </form>
  );
}
