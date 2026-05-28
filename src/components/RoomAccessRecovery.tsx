"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession, syncClientIdCookie } from "@/lib/auth";

type RoomAccessRecoveryProps = {
  roomCode: string;
};

export function RoomAccessRecovery({ roomCode }: RoomAccessRecoveryProps) {
  const router = useRouter();
  const [recovering, setRecovering] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function recover() {
      const session = getSession(roomCode);
      if (!session?.clientId) return;

      const retryKey = `bp_room_access_recovered:${roomCode}:${session.clientId}`;
      if (window.sessionStorage.getItem(retryKey) === "1") return;

      window.sessionStorage.setItem(retryKey, "1");
      setRecovering(true);
      await syncClientIdCookie(session.clientId);

      if (!cancelled) {
        router.refresh();
      }
    }

    void recover();

    return () => {
      cancelled = true;
    };
  }, [roomCode, router]);

  if (!recovering) return null;

  return (
    <p className="mt-3 text-xs font-semibold text-cyan-200">
      Dang khoi phuc phien cua tab nay...
    </p>
  );
}
