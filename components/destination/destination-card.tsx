"use client";

import { ArrowUpRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { getStatusLabel, getWaterTypeLabel, useLanguage } from "@/lib/i18n";
import type { Destination } from "@/lib/types";
import { STATUS_META, WATER_TYPE_META, cn, formatDateRange, formatLocation } from "@/lib/utils";

type DestinationCardProps = {
  destination: Destination;
  isSelected?: boolean;
  onClick: () => void;
};

export function DestinationCard({
  destination,
  isSelected = false,
  onClick
}: DestinationCardProps) {
  const waterTheme = WATER_TYPE_META[destination.waterType || "saltwater"];
  const { language, locale, t } = useLanguage();

  return (
    <button
      className={cn(
        "group panel-section relative w-full overflow-hidden rounded-[26px] text-left transition duration-300",
        waterTheme.panelClassName,
        isSelected
          ? "border-lime-300/28 bg-[#18281b] shadow-[0_0_28px_rgba(190,242,100,0.08)]"
          : "hover:-translate-y-0.5 hover:bg-[#102014]"
      )}
      onClick={onClick}
      type="button"
    >
      <div className={cn("pointer-events-none absolute inset-0 opacity-90", waterTheme.haloClassName)} />
      <div className="flex gap-4 p-4">
        <div className="relative hidden h-24 w-24 shrink-0 overflow-hidden rounded-[20px] sm:block">
          {destination.photos[0] ? (
            <img
              alt={destination.photos[0].alt || destination.title}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              src={destination.photos[0].url}
            />
          ) : (
            <div className="h-full w-full bg-[linear-gradient(135deg,rgba(73,198,199,0.2),rgba(2,7,18,0.2))]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#020712]/85 to-transparent" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="eyebrow">{t("overview.destination")}</p>
              <h3 className="truncate font-display text-2xl text-white">{destination.title}</h3>
              <p className="mt-1 truncate text-sm text-white/60">{formatLocation(destination)}</p>
            </div>
            <ArrowUpRight className="mt-1 size-4 shrink-0 text-white/35 transition group-hover:text-white/70" />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge className={STATUS_META[destination.status].badgeClassName}>
              {getStatusLabel(destination.status, language)}
            </Badge>
            <Badge className={waterTheme.badgeClassName}>
              {getWaterTypeLabel(destination.waterType || "saltwater", language)}
            </Badge>
            {(destination.startDate || destination.endDate || destination.tripDate) ? (
              <Badge>{formatDateRange(destination, locale)}</Badge>
            ) : null}
            {destination.species[0] ? <Badge>{destination.species[0]}</Badge> : null}
          </div>

          {destination.summary ? (
            <p className="mt-3 line-clamp-2 text-sm leading-6 text-white/72">
              {destination.summary}
            </p>
          ) : null}
        </div>
      </div>
    </button>
  );
}
