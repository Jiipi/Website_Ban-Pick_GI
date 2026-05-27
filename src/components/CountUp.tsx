"use client";

import { useEffect, useRef, useState } from "react";

type CountUpProps = {
  target: number;
  className?: string;
  duration?: number;
};

export function CountUp({ target, className, duration = 800 }: CountUpProps) {
  const [current, setCurrent] = useState(0);
  const currentRef = useRef(0);
  const raf = useRef<number | null>(null);
  const startTime = useRef<number | null>(null);
  const from = useRef(0);

  useEffect(() => {
    from.current = currentRef.current;
    startTime.current = null;
    if (raf.current) cancelAnimationFrame(raf.current);

    function animate(now: number) {
      if (!startTime.current) startTime.current = now;
      const elapsed = now - startTime.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = Math.round(from.current + (target - from.current) * eased);
      currentRef.current = next;
      setCurrent(next);

      if (progress < 1) {
        raf.current = requestAnimationFrame(animate);
      }
    }

    raf.current = requestAnimationFrame(animate);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [target, duration]);

  return <span className={className}>{current}</span>;
}
