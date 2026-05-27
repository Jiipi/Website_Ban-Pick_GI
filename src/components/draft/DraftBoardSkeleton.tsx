import { PICKS_PER_TEAM } from "@/lib/constants";

export function DraftBoardSkeleton() {
  return (
    <div className="draft-arena-shell">
      {/* Ban header skeleton */}
      <div className="draft-ban-header">
        <div className="draft-ban-zone draft-ban-zone-blue">
          <div role="presentation" className="draft-ban-row">
            {[0, 1, 2].map((i) => (
              <div key={i} className="draft-empty-slot draft-empty-ban-slot skeleton" />
            ))}
          </div>
        </div>
        <div className="draft-step-pill skeleton" style={{ minWidth: 200 }} />
        <div className="draft-ban-zone draft-ban-zone-red">
          <div role="presentation" className="draft-ban-row">
            {[0, 1, 2].map((i) => (
              <div key={i} className="draft-empty-slot draft-empty-ban-slot skeleton" />
            ))}
          </div>
        </div>
      </div>

      {/* Pick grids skeleton */}
      <div className="draft-field">
        <div className="draft-player-anchor draft-player-anchor-blue">
          <div className="skeleton" style={{ width: 64, height: 64, borderRadius: "50%" }} />
        </div>
        <div className="draft-pick-side draft-pick-side-blue">
          <div className="draft-pick-grid">
            {Array.from({ length: PICKS_PER_TEAM }).map((_, i) => (
              <div key={i} className="draft-empty-slot draft-empty-pick-slot skeleton" />
            ))}
          </div>
        </div>
        <div className="draft-center-clock">
          <div className="skeleton" style={{ width: 96, height: 96, borderRadius: "50%" }} />
        </div>
        <div className="draft-pick-side draft-pick-side-red">
          <div className="draft-pick-grid">
            {Array.from({ length: PICKS_PER_TEAM }).map((_, i) => (
              <div key={i} className="draft-empty-slot draft-empty-pick-slot skeleton" />
            ))}
          </div>
        </div>
        <div className="draft-player-anchor draft-player-anchor-red">
          <div className="skeleton" style={{ width: 64, height: 64, borderRadius: "50%" }} />
        </div>
      </div>

      {/* Pool skeleton */}
      <div className="draft-pool-layout">
        {["blue", "red"].map((color) => (
          <div key={color} className="draft-pool-panel">
            <div className="draft-pool-toolbar">
              <div className="skeleton" style={{ width: "100%", height: 34 }} />
            </div>
            <div className="draft-character-grid">
              {Array.from({ length: 91 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ width: "100%", aspectRatio: 1 }} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
