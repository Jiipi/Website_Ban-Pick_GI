"use client";

import { useRef } from "react";
import { playClickSound } from "@/lib/sounds";

type ExportImageProps = {
  roomCode: string;
  blueCost: number;
  redCost: number;
  handicap: { diff: number; seconds: number; penalizedTeam: string };
  bluePlayerName?: string | null;
  redPlayerName?: string | null;
};

export function ExportImageButton({ roomCode, blueCost, redCost, handicap, bluePlayerName, redPlayerName }: ExportImageProps) {
  async function handleExport() {
    playClickSound();

    try {
      const html2canvas = (await import("html2canvas")).default;

      // Find the result card element on the page
      const card = document.querySelector('[data-export-card]') as HTMLElement;
      if (!card) {
        console.warn("No export card found on page");
        drawFallbackCanvas(roomCode, blueCost, redCost, handicap);
        return;
      }

      const canvas = await html2canvas(card, {
        backgroundColor: "#060a14",
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
      });

      const link = document.createElement("a");
      link.download = `banpick-${roomCode}-result.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch {
      // Fallback: draw a meaningful canvas directly
      drawFallbackCanvas(roomCode, blueCost, redCost, handicap);
    }
  }

  return (
    <button
      className="btn-gold flex items-center gap-2"
      onClick={handleExport}
      type="button"
    >
      📷 Tải ảnh kết quả
    </button>
  );
}

function drawFallbackCanvas(
  roomCode: string,
  blueCost: number,
  redCost: number,
  handicap: { diff: number; seconds: number; penalizedTeam: string }
) {
  const W = 800;
  const H = 500;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Background
  ctx.fillStyle = "#060a14";
  ctx.fillRect(0, 0, W, H);

  // Subtle gradient overlay
  const bg = ctx.createRadialGradient(W / 2, 0, 0, W / 2, 0, H);
  bg.addColorStop(0, "rgba(14,30,60,0.9)");
  bg.addColorStop(1, "rgba(6,10,20,1)");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Divider lines
  ctx.strokeStyle = "rgba(148,163,184,0.1)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, 90);
  ctx.lineTo(W, 90);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, H - 40);
  ctx.lineTo(W, H - 40);
  ctx.stroke();

  // Title
  ctx.font = "bold 28px Inter, sans-serif";
  ctx.fillStyle = "#fbbf24";
  ctx.textAlign = "center";
  ctx.fillText("KẾT QUẢ HANDICAP", W / 2, 55);

  // Room code badge
  ctx.font = "12px Inter, sans-serif";
  ctx.fillStyle = "#64748b";
  ctx.fillText(`Room: ${roomCode}`, W / 2, 78);

  // ── BLUE SIDE ──
  const blueX = W * 0.2;
  const redX = W * 0.8;

  ctx.font = "bold 16px Inter, sans-serif";
  ctx.fillStyle = "#7dd3fc";
  ctx.textAlign = "center";
  ctx.fillText("ĐỘI XANH", blueX, 130);

  ctx.font = "bold 72px Inter, sans-serif";
  ctx.fillStyle = blueCost >= redCost ? "#7dd3fc" : "#94a3b8";
  ctx.fillText(String(blueCost), blueX, 200);

  ctx.font = "14px Inter, sans-serif";
  ctx.fillStyle = "#64748b";
  ctx.fillText("TỔNG COST", blueX, 220);

  // Blue bar
  const barW = 120;
  const barH = 8;
  const blueBarX = blueX - barW / 2;
  const blueBarY = 235;
  ctx.fillStyle = "rgba(148,163,184,0.1)";
  roundRect(ctx, blueBarX, blueBarY, barW, barH, 4);
  ctx.fill();
  const blueFrac = Math.max(blueCost / Math.max(blueCost, redCost, 1), 0.05);
  ctx.fillStyle = "#38bdf8";
  roundRect(ctx, blueBarX, blueBarY, barW * blueFrac, barH, 4);
  ctx.fill();

  // VS
  ctx.font = "bold 20px Inter, sans-serif";
  ctx.fillStyle = "#fbbf24";
  ctx.textAlign = "center";
  ctx.fillText("VS", W / 2, 165);

  // ── RED SIDE ──
  ctx.font = "bold 16px Inter, sans-serif";
  ctx.fillStyle = "#fda4af";
  ctx.textAlign = "center";
  ctx.fillText("ĐỘI ĐỎ", redX, 130);

  ctx.font = "bold 72px Inter, sans-serif";
  ctx.fillStyle = redCost >= blueCost ? "#fda4af" : "#94a3b8";
  ctx.fillText(String(redCost), redX, 200);

  ctx.font = "14px Inter, sans-serif";
  ctx.fillStyle = "#64748b";
  ctx.fillText("TỔNG COST", redX, 220);

  // Red bar
  const redBarX = redX - barW / 2;
  ctx.fillStyle = "rgba(148,163,184,0.1)";
  roundRect(ctx, redBarX, blueBarY, barW, barH, 4);
  ctx.fill();
  const redFrac = Math.max(redCost / Math.max(blueCost, redCost, 1), 0.05);
  ctx.fillStyle = "#fb7185";
  roundRect(ctx, redBarX, blueBarY, barW * redFrac, barH, 4);
  ctx.fill();

  // ── HANDICAP CENTER ──
  const centerY = 295;
  ctx.font = "bold 12px Inter, sans-serif";
  ctx.fillStyle = "#64748b";
  ctx.textAlign = "center";
  ctx.fillText("CHÊNH LỆCH", W / 2, centerY - 30);

  ctx.font = "bold 40px Inter, sans-serif";
  ctx.fillStyle = "#fbbf24";
  ctx.fillText(String(handicap.diff), W / 2, centerY + 10);

  // Penalty box
  const boxW = 240;
  const boxH = 40;
  const boxX = W / 2 - boxW / 2;
  const boxY = centerY + 20;
  ctx.fillStyle = "rgba(15,23,42,0.8)";
  roundRect(ctx, boxX, boxY, boxW, boxH, 8);
  ctx.fill();
  ctx.strokeStyle = "rgba(148,163,184,0.15)";
  ctx.lineWidth = 1;
  roundRect(ctx, boxX, boxY, boxW, boxH, 8);
  ctx.stroke();

  if (handicap.penalizedTeam === "NONE") {
    ctx.font = "bold 14px Inter, sans-serif";
    ctx.fillStyle = "#34d399";
    ctx.fillText("⚖️ Cân bằng — Không phạt", W / 2, boxY + 26);
  } else {
    ctx.font = "bold 13px Inter, sans-serif";
    ctx.fillStyle = handicap.penalizedTeam === "BLUE" ? "#7dd3fc" : "#fda4af";
    ctx.fillText(
      `${handicap.penalizedTeam === "BLUE" ? "Đội Xanh" : "Đội Đỏ"} phải nhanh hơn`,
      W / 2,
      boxY + 16
    );
    ctx.font = "bold 16px Inter, sans-serif";
    ctx.fillStyle = "#fbbf24";
    ctx.fillText(`⏱️ ${handicap.seconds}s`, W / 2, boxY + 34);
  }

  // Footer
  ctx.font = "11px Inter, sans-serif";
  ctx.fillStyle = "#475569";
  ctx.fillText("Genshin Impact Ban/Pick Tool — La Hoàn Cảnh Giới", W / 2, H - 20);

  const link = document.createElement("a");
  link.download = `banpick-${roomCode}-result.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
