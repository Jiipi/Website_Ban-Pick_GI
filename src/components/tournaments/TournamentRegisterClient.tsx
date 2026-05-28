"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, ShieldCheck, UserCheck } from "lucide-react";

type TournamentSummary = {
  slug: string;
  name: string;
  maxTeams: number;
  participantCount: number;
  status: string;
};

type VerifiedProfile = {
  uid: string;
  nickname: string;
  level: number;
  avatarUrl?: string | null;
};

type VerifyState = {
  loading: boolean;
  error: string;
  profile: VerifiedProfile | null;
};

function makeVerifyState(): VerifyState {
  return { loading: false, error: "", profile: null };
}

function makeCaptcha() {
  const a = 2 + Math.floor(Math.random() * 8);
  const b = 2 + Math.floor(Math.random() * 8);
  return { a, b, answer: a + b };
}

export function TournamentRegisterClient({ tournament }: { tournament: TournamentSummary }) {
  const router = useRouter();
  const [teamName, setTeamName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [captainUid, setCaptainUid] = useState("");
  const [playerUids, setPlayerUids] = useState(["", "", ""]);
  const [captain, setCaptain] = useState<VerifyState>(() => makeVerifyState());
  const [players, setPlayers] = useState<VerifyState[]>(() => [makeVerifyState(), makeVerifyState(), makeVerifyState()]);
  const [rulesAccepted, setRulesAccepted] = useState(false);
  const [captcha, setCaptcha] = useState(() => makeCaptcha());
  const [captchaInput, setCaptchaInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const verifiedPlayers = useMemo(() => players.filter((p) => p.profile), [players]);
  const canSubmit =
    tournament.status === "UPCOMING" &&
    tournament.participantCount < tournament.maxTeams &&
    teamName.trim().length >= 2 &&
    captain.profile &&
    verifiedPlayers.length >= 2 &&
    rulesAccepted &&
    Number(captchaInput) === captcha.answer;

  async function verifyUid(uid: string, apply: (state: VerifyState) => void) {
    const trimmed = uid.trim();
    if (!/^\d{9,10}$/.test(trimmed)) {
      apply({ loading: false, error: "UID phai gom 9-10 chu so.", profile: null });
      return;
    }

    apply({ loading: true, error: "", profile: null });
    try {
      const res = await fetch(`/api/enka?uid=${encodeURIComponent(trimmed)}`);
      const body = await res.json();
      if (!res.ok) {
        apply({ loading: false, error: body.message ?? "Khong verify duoc UID.", profile: null });
        return;
      }
      apply({
        loading: false,
        error: "",
        profile: {
          uid: body.profile.uid,
          nickname: body.profile.nickname,
          level: body.profile.level,
          avatarUrl: body.profile.avatarUrl ?? null,
        },
      });
    } catch {
      apply({ loading: false, error: "Loi ket noi Enka.", profile: null });
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    if (!canSubmit || !captain.profile) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/tournaments/${tournament.slug}/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerUid: captain.profile.uid,
          playerNickname: teamName.trim(),
          playerAvatarUrl: logoUrl.trim() || captain.profile.avatarUrl || null,
          teamName: teamName.trim(),
          logoUrl: logoUrl.trim() || captain.profile.avatarUrl || null,
          captainUid: captain.profile.uid,
          members: [
            {
              uid: captain.profile.uid,
              nickname: captain.profile.nickname,
              avatarUrl: captain.profile.avatarUrl ?? null,
              arLevel: captain.profile.level,
              role: "CAPTAIN",
            },
            ...verifiedPlayers.map((item) => ({
              uid: item.profile!.uid,
              nickname: item.profile!.nickname,
              avatarUrl: item.profile!.avatarUrl ?? null,
              arLevel: item.profile!.level,
              role: "PLAYER",
            })),
          ],
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        setMessage(body.message ?? "Dang ky that bai.");
        return;
      }
      router.push(`/tournaments/${tournament.slug}`);
      router.refresh();
    } catch {
      setMessage("Loi ket noi server.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="glass-strong rounded-3xl p-6 sm:p-8 space-y-5 animate-fade-in-up delay-100">
      <div className="rounded-2xl border border-cyan-500/25 bg-cyan-500/[0.04] px-4 py-3 text-xs leading-relaxed text-slate-300">
        Moi slot trong bracket hien duoc luu theo doi/nhom. UID captain la dinh danh chong trung, cac UID thanh vien duoc verify truoc khi gui.
      </div>

      <Field label="Ten doi *">
        <input value={teamName} onChange={(e) => setTeamName(e.target.value)} className="input-field" maxLength={50} required />
      </Field>

      <Field label="Logo URL">
        <input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} className="input-field" placeholder="https://..." />
      </Field>

      <Field label="Captain UID *">
        <div className="flex gap-2">
          <input
            value={captainUid}
            onChange={(e) => {
              setCaptainUid(e.target.value);
              setCaptain(makeVerifyState());
            }}
            className="input-field flex-1 font-mono"
            inputMode="numeric"
            maxLength={10}
            required
          />
          <button
            type="button"
            onClick={() => verifyUid(captainUid, setCaptain)}
            disabled={captain.loading}
            className="btn-outline shrink-0"
          >
            {captain.loading ? <Loader2 size={14} className="animate-spin" /> : <UserCheck size={14} />}
            Verify
          </button>
        </div>
        <VerifiedCard state={captain} />
      </Field>

      <div className="space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-300">Thanh vien 2-3 UID *</p>
        {playerUids.map((uid, index) => (
          <div key={index} className="rounded-2xl border border-slate-700/40 bg-slate-900/40 p-3">
            <div className="flex gap-2">
              <input
                value={uid}
                onChange={(e) => {
                  const next = [...playerUids];
                  next[index] = e.target.value;
                  setPlayerUids(next);
                  setPlayers((prev) => prev.map((p, i) => (i === index ? makeVerifyState() : p)));
                }}
                className="input-field flex-1 font-mono"
                inputMode="numeric"
                maxLength={10}
                placeholder={`Player ${index + 1} UID`}
              />
              <button
                type="button"
                onClick={() =>
                  verifyUid(uid, (state) => setPlayers((prev) => prev.map((p, i) => (i === index ? state : p))))
                }
                disabled={players[index].loading || !uid.trim()}
                className="btn-outline shrink-0"
              >
                {players[index].loading ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                Verify
              </button>
            </div>
            <VerifiedCard state={players[index]} compact />
          </div>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex items-start gap-3 rounded-2xl border border-slate-700/40 bg-slate-900/40 p-4 text-xs text-slate-300">
          <input type="checkbox" checked={rulesAccepted} onChange={(e) => setRulesAccepted(e.target.checked)} className="mt-0.5" />
          <span>Toi da doc va chap nhan luat giai dau.</span>
        </label>
        <Field label={`Captcha: ${captcha.a} + ${captcha.b} = ?`}>
          <div className="flex gap-2">
            <input
              value={captchaInput}
              onChange={(e) => setCaptchaInput(e.target.value)}
              className="input-field font-mono"
              inputMode="numeric"
            />
            <button
              type="button"
              onClick={() => {
                setCaptcha(makeCaptcha());
                setCaptchaInput("");
              }}
              className="btn-outline shrink-0"
            >
              Doi
            </button>
          </div>
        </Field>
      </div>

      {message && <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-xs text-rose-200">{message}</div>}

      <button type="submit" disabled={!canSubmit || submitting} className="btn-primary w-full">
        {submitting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
        {submitting ? "Dang dang ky..." : "Dang ky doi"}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-300">{label}</label>
      {children}
    </div>
  );
}

function VerifiedCard({ state, compact }: { state: VerifyState; compact?: boolean }) {
  if (state.loading) return <p className="mt-2 text-xs text-slate-500">Dang verify...</p>;
  if (state.error) return <p className="mt-2 text-xs font-bold text-rose-300">{state.error}</p>;
  if (!state.profile) return null;

  return (
    <div className={`mt-2 flex items-center gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.06] ${compact ? "px-3 py-2" : "px-4 py-3"}`}>
      {state.profile.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={state.profile.avatarUrl} alt={state.profile.nickname} className="h-9 w-9 rounded-full object-cover" />
      ) : (
        <div className="h-9 w-9 rounded-full bg-slate-800" />
      )}
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-emerald-100">{state.profile.nickname}</p>
        <p className="font-mono text-[10px] text-emerald-300/80">UID {state.profile.uid} - AR {state.profile.level}</p>
      </div>
    </div>
  );
}
