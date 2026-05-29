import { LobbyClient } from "@/components/LobbyClient";
import { PageHeader } from "@/components/shell/PageHeader";
import { Gamepad2 } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function LobbyPage() {
  return (
    <main id="main" className="site-shell__main">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <PageHeader
          eyebrow="Tuyển thủ"
          title="Sảnh chờ"
          Icon={Gamepad2}
          accent="cyan"
          description="Nhập UID Genshin để trọng tài xác nhận và mời bạn vào trận draft."
          backHref="/"
          backLabel="Trang chủ"
        >
          <LobbySteps />
        </PageHeader>

        <LobbyClient />
      </div>
    </main>
  );
}

function LobbySteps() {
  const steps = [
    { num: 1, label: "Nhập UID" },
    { num: 2, label: "Chờ lời mời" },
    { num: 3, label: "Vào phòng draft" },
  ];
  return (
    <div className="lobby-steps" role="list" aria-label="Các bước vào sảnh chờ">
      {steps.map((step, idx) => (
        <span key={step.num} style={{ display: "contents" }}>
          <span className={`lobby-step ${idx === 0 ? "is-active" : ""}`} role="listitem">
            <span className="lobby-step__num">{step.num}</span>
            {step.label}
          </span>
          {idx < steps.length - 1 && <span className="lobby-step__sep" aria-hidden="true" />}
        </span>
      ))}
    </div>
  );
}
