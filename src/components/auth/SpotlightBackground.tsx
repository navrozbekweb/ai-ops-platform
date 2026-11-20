"use client";

import { useEffect, useRef } from "react";

/**
 * Kursor ortidan yumshoq doira ochiladi va ikkinchi qatlamni ko'rsatadi.
 * Canvas o'rniga CSS mask va ikkita CSS o'zgaruvchisi (--sx, --sy) ishlatiladi.
 * Sensorli qurilmalarda va "harakatni kamaytirish" yoqilganda effekt statik qoladi.
 */
export function SpotlightBackground({ children }: { children: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const fine = window.matchMedia("(pointer: fine)").matches;
    if (reduce || !fine) return;

    const target = { x: el.clientWidth * 0.3, y: el.clientHeight * 0.52 };
    const current = { ...target };
    let frame = 0;

    const tick = () => {
      current.x += (target.x - current.x) * 0.1;
      current.y += (target.y - current.y) * 0.1;
      el.style.setProperty("--sx", `${current.x.toFixed(1)}px`);
      el.style.setProperty("--sy", `${current.y.toFixed(1)}px`);
      if (Math.abs(target.x - current.x) > 0.5 || Math.abs(target.y - current.y) > 0.5) {
        frame = requestAnimationFrame(tick);
      } else {
        frame = 0;
      }
    };

    const onMove = (event: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      target.x = event.clientX - rect.left;
      target.y = event.clientY - rect.top;
      if (!frame) frame = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      ref={root}
      className="spotlight-root relative isolate flex min-h-screen flex-col overflow-hidden bg-[#050a14] text-white"
    >
      <div aria-hidden="true" className="spotlight-base absolute inset-0 -z-20" />
      <div aria-hidden="true" className="spotlight-reveal absolute inset-0 -z-10" />
      {children}
    </div>
  );
}
