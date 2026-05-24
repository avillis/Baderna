"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

const MAX_SCALE = 4;
const MIN_SCALE = 1;
const DOUBLE_TAP_MS = 300;

type Gesture = {
  mode: "none" | "pan" | "pinch";
  startDist: number;
  startScale: number;
  startX: number;
  startY: number;
  startTx: number;
  startTy: number;
};

function touchDist(touches: React.TouchList): number {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.hypot(dx, dy);
}

export function ImageLightbox({
  src,
  alt = "",
  onClose,
}: {
  src: string;
  alt?: string;
  onClose: () => void;
}) {
  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);
  const [interacting, setInteracting] = useState(false);

  const gesture = useRef<Gesture>({
    mode: "none",
    startDist: 0,
    startScale: 1,
    startX: 0,
    startY: 0,
    startTx: 0,
    startTy: 0,
  });
  const lastTap = useRef(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  function reset() {
    setScale(1);
    setTx(0);
    setTy(0);
  }

  function onTouchStart(e: React.TouchEvent) {
    if (e.touches.length === 2) {
      gesture.current = {
        ...gesture.current,
        mode: "pinch",
        startDist: touchDist(e.touches),
        startScale: scale,
      };
      setInteracting(true);
      return;
    }
    if (e.touches.length === 1) {
      const now = Date.now();
      if (now - lastTap.current < DOUBLE_TAP_MS) {
        lastTap.current = 0;
        if (scale > 1) reset();
        else setScale(2.5);
        gesture.current.mode = "none";
        return;
      }
      lastTap.current = now;
      gesture.current = {
        ...gesture.current,
        mode: scale > 1 ? "pan" : "none",
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY,
        startTx: tx,
        startTy: ty,
      };
      if (scale > 1) setInteracting(true);
    }
  }

  function onTouchMove(e: React.TouchEvent) {
    const g = gesture.current;
    if (g.mode === "pinch" && e.touches.length === 2) {
      const ratio = touchDist(e.touches) / (g.startDist || 1);
      const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, g.startScale * ratio));
      setScale(next);
      if (next <= 1) {
        setTx(0);
        setTy(0);
      }
    } else if (g.mode === "pan" && e.touches.length === 1) {
      setTx(g.startTx + (e.touches[0].clientX - g.startX));
      setTy(g.startTy + (e.touches[0].clientY - g.startY));
    }
  }

  function onTouchEnd() {
    if (scale <= 1) {
      setTx(0);
      setTy(0);
    }
    gesture.current.mode = "none";
    setInteracting(false);
  }

  function onWheel(e: React.WheelEvent) {
    const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale - e.deltaY * 0.0025));
    setScale(next);
    if (next <= 1) {
      setTx(0);
      setTy(0);
    }
  }

  function onDoubleClick() {
    if (scale > 1) reset();
    else setScale(2.5);
  }

  const zoomed = scale > 1;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Fechar"
        className="absolute right-[16px] top-[16px] z-10 flex h-[40px] w-[40px] items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition-colors hover:bg-white/25"
      >
        <X className="h-[20px] w-[20px]" strokeWidth={2.4} />
      </button>

      <div
        className="flex h-full w-full items-center justify-center overflow-hidden"
        style={{ touchAction: "none" }}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onWheel={onWheel}
        onDoubleClick={onDoubleClick}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          draggable={false}
          className="max-h-full max-w-full select-none object-contain"
          style={{
            transform: `translate(${tx}px, ${ty}px) scale(${scale})`,
            transition: interacting ? "none" : "transform 0.15s ease-out",
            cursor: zoomed ? "grab" : "zoom-in",
          }}
        />
      </div>
    </div>
  );
}
