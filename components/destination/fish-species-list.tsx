"use client";

import { buildFishIllustrationDataUrl } from "@/lib/fish-illustrations";

type FishSpeciesListProps = {
  species: string[];
};

export function FishSpeciesList({ species }: FishSpeciesListProps) {
  return (
    <div className="space-y-2">
      {species.map((item) => (
        <div
          className="flex items-center gap-3 rounded-[22px] border border-white/8 bg-[#08130d] px-3 py-3"
          key={item}
        >
          <img
            alt={item}
            className="h-12 w-12 shrink-0 rounded-2xl border border-white/8 bg-[#08130d] object-cover"
            src={buildFishIllustrationDataUrl(item)}
          />
          <span className="min-w-0 flex-1 text-sm font-medium text-white">{item}</span>
        </div>
      ))}
    </div>
  );
}
