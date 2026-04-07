"use client";

import type { Destination } from "@/lib/types";
import { STATUS_META, WATER_TYPE_META, cn } from "@/lib/utils";

type DestinationMarkerProps = {
  destination: Destination;
  isSelected: boolean;
  onSelect: (id: string) => void;
};

export function DestinationMarker({
  destination,
  isSelected,
  onSelect
}: DestinationMarkerProps) {
  const meta = STATUS_META[destination.status];
  const waterTheme = WATER_TYPE_META[destination.waterType || "saltwater"];

  return (
    <button
      className="group relative -m-3 flex items-center justify-center p-3"
      onClick={(event) => {
        event.stopPropagation();
        onSelect(destination.id);
      }}
      type="button"
    >
      <span
        className={cn(
          "absolute rounded-full blur-xl transition duration-300",
          "size-12",
          meta.markerGlow,
          waterTheme.haloClassName,
          isSelected ? "scale-100 opacity-100" : "scale-75 opacity-65 group-hover:scale-100"
        )}
      />
      <span
        className={cn(
          "relative flex items-center justify-center rounded-full border transition duration-300",
          "size-6",
          meta.markerShell,
          isSelected ? "scale-110" : "group-hover:scale-105"
        )}
      >
        <span
          className={cn(
            "rounded-full",
            "size-2.5",
            meta.markerCore
          )}
        />
      </span>
      <span
        className={cn(
          "pointer-events-none absolute -bottom-10 whitespace-nowrap rounded-full border px-3 py-1 text-[0.68rem] uppercase tracking-[0.24em] text-white/78 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100",
          "border-white/12 bg-[#07111f]/90 backdrop-blur-xl",
          isSelected ? "translate-y-0 opacity-100" : "translate-y-1"
        )}
      >
        {destination.title}
      </span>
    </button>
  );
}
