export type Phase = "draft" | "build" | "result";

type PhaseIndicatorProps = {
  current: Phase;
  roomCode: string;
};

const phases: { key: Phase; label: string }[] = [
  { key: "draft", label: "Draft" },
  { key: "build", label: "Build" },
  { key: "result", label: "Result" },
];

export function PhaseIndicator({ current, roomCode }: PhaseIndicatorProps) {
  const currentIdx = phases.findIndex((p) => p.key === current);

  return (
    <nav className="flex items-center gap-1" aria-label="Phase progress">
      {phases.map((phase, i) => {
        const isActive = i === currentIdx;
        const isPast = i < currentIdx;
        const isFuture = i > currentIdx;

        return (
          <div key={phase.key} className="flex items-center gap-1">
            {i > 0 && (
              <div
                className={`h-px w-5 transition-colors ${
                  isPast || isActive ? "bg-cyan-500/60" : "bg-slate-700/40"
                }`}
              />
            )}
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider transition-all ${
                isActive
                  ? "bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-500/30"
                  : isPast
                    ? "bg-cyan-500/5 text-cyan-400/60"
                    : "bg-slate-800/40 text-slate-500"
              }`}
            >
              {isPast && (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              )}
              {phase.label}
            </span>
          </div>
        );
      })}
    </nav>
  );
}
