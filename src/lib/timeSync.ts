/**
 * Tiện ích đồng bộ hóa thời gian giữa client và server.
 * Giúp giải quyết triệt để việc lệch giây do sai múi giờ/đồng hồ máy hoặc độ trễ mạng.
 */

let clockOffsetMs = 0;

export function syncWithServer(serverTimeIso: string) {
  if (!serverTimeIso) return;
  try {
    const serverTime = new Date(serverTimeIso).getTime();
    const clientTime = Date.now();
    clockOffsetMs = serverTime - clientTime;
    console.log(`[TimeSync] Đã đồng bộ với Server. Khoảng lệch: ${clockOffsetMs}ms`);
  } catch (err) {
    console.error("[TimeSync] Lỗi khi đồng bộ thời gian:", err);
  }
}

export function getSynchronizedTime(): number {
  return Date.now() + clockOffsetMs;
}
