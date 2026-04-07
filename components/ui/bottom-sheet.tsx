"use client";

import { useDragControls, motion, type PanInfo } from "framer-motion";
import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export type BottomSheetSnap = "closed" | "half" | "expanded";

type BottomSheetProps = {
  children: ReactNode;
  className?: string;
  snap: BottomSheetSnap;
  onSnapChange: (snap: BottomSheetSnap) => void;
  topInset?: number;
};

export function BottomSheet({
  children,
  className,
  snap,
  onSnapChange,
  topInset,
}: BottomSheetProps) {
  const dragControls = useDragControls();
  const activeSnapRef = useRef<BottomSheetSnap>(snap);
  const [viewportHeight, setViewportHeight] = useState(780);
  const [didDrag, setDidDrag] = useState(false);

  useEffect(() => {
    activeSnapRef.current = snap;
  }, [snap]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const syncViewport = () => {
      setViewportHeight(window.innerHeight);
    };

    syncViewport();
    window.addEventListener("resize", syncViewport);

    return () => {
      window.removeEventListener("resize", syncViewport);
    };
  }, []);

  const metrics = useMemo(() => {
    const topGap = topInset ?? Math.max(76, viewportHeight * 0.08);
    const bottomGap = 12;
    const availableHeight = Math.max(320, viewportHeight - topGap - bottomGap);
    const peekHeight = 34;
    const halfVisible = Math.min(Math.max(viewportHeight * 0.46, 320), availableHeight - 48);
    const expandedVisible = Math.min(Math.max(viewportHeight * 0.88, 540), availableHeight);

    return {
      availableHeight,
      snapOffsets: {
        closed: availableHeight - peekHeight,
        half: availableHeight - halfVisible,
        expanded: availableHeight - expandedVisible,
      } satisfies Record<BottomSheetSnap, number>,
    };
  }, [topInset, viewportHeight]);

  function handleDragStart() {
    setDidDrag(false);
  }

  function handleDrag(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    if (Math.abs(info.offset.y) > 6) {
      setDidDrag(true);
    }
  }

  function handleDragEnd(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    const currentOffset = metrics.snapOffsets[activeSnapRef.current];
    const projected = currentOffset + info.offset.y + info.velocity.y * 0.18;
    const nextSnap = (Object.entries(metrics.snapOffsets) as Array<[BottomSheetSnap, number]>).reduce(
      (closest, candidate) => {
        return Math.abs(candidate[1] - projected) < Math.abs(closest[1] - projected) ? candidate : closest;
      }
    )[0];

    onSnapChange(nextSnap);
  }

  function handleHandlePointerDown(event: ReactPointerEvent<HTMLButtonElement>) {
    dragControls.start(event);
  }

  function handleHandleClick() {
    if (didDrag) {
      setDidDrag(false);
      return;
    }

    onSnapChange(snap === "closed" ? "half" : "closed");
  }

  return (
    <div className="pointer-events-none absolute inset-x-3 bottom-3 top-20 z-20 lg:hidden">
      <motion.div
        animate={{ y: metrics.snapOffsets[snap] }}
        className={cn("pointer-events-auto absolute inset-x-0 bottom-0 flex flex-col", className)}
        drag="y"
        dragControls={dragControls}
        dragElastic={0.12}
        dragListener={false}
        dragMomentum={false}
        dragTransition={{ bounceStiffness: 360, bounceDamping: 34 }}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        onDragStart={handleDragStart}
        style={{ height: metrics.availableHeight }}
        transition={{ type: "spring", stiffness: 360, damping: 34, mass: 0.72 }}
      >
        <button
          className="shrink-0 px-5 pt-3 text-left"
          onClick={handleHandleClick}
          onPointerDown={handleHandlePointerDown}
          style={{ touchAction: "none" }}
          type="button"
        >
          <div className="sheet-handle" />
          <span className="sr-only">Drag sheet</span>
        </button>
        <div className="min-h-0 flex-1">{children}</div>
      </motion.div>
    </div>
  );
}
