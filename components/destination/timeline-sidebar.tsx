"use client";

import { useEffect, useMemo, useRef } from "react";

import { CalendarRange, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";

import { formatStopCount, formatStopOrdinal, useLanguage } from "@/lib/i18n";
import type { TimelineExpedition } from "@/lib/types";
import { WATER_TYPE_META, cn, formatDateRange, formatLocation } from "@/lib/utils";

type TimelineSidebarProps = {
  canEdit: boolean;
  collapsed: boolean;
  onDeleteDestination: (destinationId: string) => void;
  onDeleteExpedition: (expeditionId: string) => void;
  sections: Array<{ id: string; label: string; items: TimelineExpedition[] }>;
  onSelectDestination: (id: string) => void;
  onToggleCollapsed: () => void;
  selectedExpeditionId: string | null;
  selectedId: string | null;
};

export function TimelineSidebar({
  canEdit,
  collapsed,
  onDeleteDestination,
  onDeleteExpedition,
  sections,
  onSelectDestination,
  onToggleCollapsed,
  selectedExpeditionId,
  selectedId
}: TimelineSidebarProps) {
  const { language, locale, t } = useLanguage();
  const expeditionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const timelineAnchorId = useMemo(() => getTimelineAnchorId(sections), [sections]);

  useEffect(() => {
    if (collapsed || !timelineAnchorId) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const target = expeditionRefs.current[timelineAnchorId];

      target?.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
    }, 180);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [collapsed, timelineAnchorId]);

  return (
    <div
      className={cn(
        "pointer-events-none absolute bottom-24 left-3 top-[6.1rem] z-20 flex transition-transform duration-300 sm:bottom-28 lg:bottom-6 xl:inset-y-[8.75rem] xl:left-6 xl:right-auto xl:bottom-6",
        collapsed
          ? "-translate-x-[calc(100%-3.25rem)]"
          : "translate-x-0 translate-y-0"
      )}
    >
      <div className="w-[18rem] sm:w-[20rem] xl:w-[24rem]">
      <div className="pointer-events-auto flex h-full max-h-none flex-col overflow-hidden rounded-[30px] border border-emerald-950/80 bg-[#051007]/98 shadow-[0_28px_80px_rgba(0,0,0,0.52)] backdrop-blur-2xl xl:rounded-[32px]">
        <div className="border-b border-emerald-950/70 bg-[linear-gradient(180deg,rgba(6,20,10,1),rgba(3,11,5,0.98))] px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl border border-emerald-900/70 bg-[#102014] text-emerald-100 shadow-[0_0_24px_rgba(34,197,94,0.12)]">
              <CalendarRange className="size-5" />
            </div>
            <div>
              <p className="eyebrow text-emerald-100/38">{t("timeline.tripTimeline")}</p>
              <h2 className="mt-1 font-display text-2xl text-white">{t("timeline.heading")}</h2>
            </div>
          </div>
        </div>

        <div className="overflow-y-auto px-5 py-5">
          <div className="relative space-y-8 pl-5">
            <div className="pointer-events-none absolute bottom-0 left-[0.45rem] top-0 w-px bg-[linear-gradient(180deg,rgba(34,197,94,0.3),rgba(34,197,94,0.06))]" />
            {sections.map((section) => (
              <section className="relative" key={section.id}>
                <div className="mb-4 flex items-center gap-3">
                  <div className="absolute left-[-1.02rem] top-1.5 size-3 rounded-full border border-emerald-800/50 bg-[#0d1b11] shadow-[0_0_18px_rgba(34,197,94,0.18)]" />
                  <p className="rounded-full border border-emerald-950/70 bg-[#0a160d] px-3 py-1 text-[0.68rem] uppercase tracking-[0.24em] text-emerald-100/72">
                    {section.id === "past" ? t("timeline.past") : t("timeline.upcoming")}
                  </p>
                  <div className="h-px flex-1 bg-emerald-950/80" />
                </div>

                <div className="space-y-4">
                  {section.items.map((expedition) => {
                    const selected = selectedExpeditionId === expedition.id;
                    const leadDestinationId = expedition.destinations[0]?.id ?? null;
                    const accent =
                      expedition.waterType === "freshwater"
                        ? {
                            card: "border-emerald-950/75 bg-[#031713]",
                            node: "bg-emerald-400/85",
                            line: "bg-emerald-500/30"
                          }
                        : expedition.waterType === "urban"
                          ? {
                              card: "border-slate-700/75 bg-[#10161b]",
                              node: "bg-slate-200/90",
                              line: "bg-slate-300/28"
                            }
                          : {
                              card: "border-sky-950/75 bg-[#071221]",
                              node: "bg-sky-300/85",
                              line: "bg-sky-400/24"
                            };
                    const leadDestination = expedition.destinations[0];
                    const date = getTimelineDate(expedition.startDate || expedition.endDate, locale);

                    return (
                      <div
                        className={`relative w-full overflow-hidden rounded-[24px] border px-4 py-4 text-left transition ${
                          selected
                            ? "border-lime-300/30 bg-[#102014] shadow-[0_0_32px_rgba(190,242,100,0.08)]"
                            : `${accent.card} hover:bg-[#102014]`
                        }`}
                        key={expedition.id}
                        ref={(node) => {
                          expeditionRefs.current[expedition.id] = node;
                        }}
                        onClick={() => {
                          if (leadDestinationId) {
                            onSelectDestination(leadDestinationId);
                          }
                        }}
                        onKeyDown={(event) => {
                          if ((event.key === "Enter" || event.key === " ") && leadDestinationId) {
                            event.preventDefault();
                            onSelectDestination(leadDestinationId);
                          }
                        }}
                        role="button"
                        tabIndex={0}
                      >
                        <div className={`pointer-events-none absolute inset-0 ${WATER_TYPE_META[expedition.waterType || "saltwater"].haloClassName} opacity-55`} />
                        <div className={cn("absolute inset-y-0 left-0 w-[3px]", accent.line)} />
                        <div className="absolute left-[-1.02rem] top-7 flex size-3 items-center justify-center rounded-full border border-white/10 bg-[#06101d]">
                          <div className={cn("size-1.5 rounded-full", accent.node)} />
                        </div>
                        <div className="relative flex items-start gap-4">
                          <div className="min-w-[4.1rem] shrink-0 rounded-[18px] border border-white/6 bg-black/20 px-3 py-2 text-left">
                            <p className="text-[0.65rem] uppercase tracking-[0.24em] text-white/34">
                              {date.month}
                            </p>
                            <p className="mt-1 font-display text-3xl leading-none text-white/94">
                              {date.day}
                            </p>
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="text-[0.68rem] uppercase tracking-[0.26em] text-white/34">
                              {formatDateRange(expedition, locale)}
                            </p>
                            <div className="mt-2 flex items-start justify-between gap-3">
                              <h3 className="font-display text-xl text-white">{expedition.name}</h3>
                              {canEdit ? (
                                <button
                                  className="rounded-full border border-white/8 bg-[#091725] p-2 text-white/60 transition hover:border-white/14 hover:text-white"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    onDeleteExpedition(expedition.id);
                                  }}
                                  type="button"
                                >
                                  <Trash2 className="size-4" />
                                  <span className="sr-only">{t("timeline.deleteTrip")}</span>
                                </button>
                              ) : null}
                            </div>
                            <p className="mt-1 text-sm text-white/66">
                              {leadDestination ? formatLocation(leadDestination) : t("timeline.routeNotSet")}
                            </p>
                            <p className="mt-2 text-xs uppercase tracking-[0.22em] text-white/34">
                              {formatStopCount(expedition.destinations.length, language)}
                            </p>

                            {selected ? (
                              <div className="mt-4 space-y-2 border-t border-white/8 pt-3">
                                {expedition.destinations.map((destination) => (
                                  <div className="flex items-center gap-2" key={destination.id}>
                                    <button
                                      className={`flex flex-1 items-center justify-between rounded-2xl border px-3 py-2.5 text-left transition ${
                                        selectedId === destination.id
                                          ? "border-lime-300/28 bg-[#18281b] text-white"
                                          : "border-white/6 bg-[#09130b] text-white/78 hover:bg-[#101b13]"
                                      }`}
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        onSelectDestination(destination.id);
                                      }}
                                      type="button"
                                    >
                                      <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
                                        <span className="min-w-0">
                                          <span className="block text-[0.68rem] uppercase tracking-[0.24em] text-white/36">
                                            {formatDateRange(destination, locale)}
                                          </span>
                                          <span className="mt-1 block truncate text-sm font-medium">{destination.city || destination.title}</span>
                                          <span className="block text-xs uppercase tracking-[0.18em] text-white/40">
                                            {destination.country}
                                          </span>
                                        </span>
                                        <span className="ml-3 text-right text-[0.68rem] uppercase tracking-[0.22em] text-white/32">
                                          {formatStopOrdinal(destination.stopOrder || 1, language)}
                                        </span>
                                      </div>
                                    </button>
                                    {canEdit ? (
                                      <button
                                        className="rounded-full border border-white/8 bg-[#091725] p-2 text-white/60 transition hover:border-white/14 hover:text-white"
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          onDeleteDestination(destination.id);
                                        }}
                                        type="button"
                                      >
                                        <Trash2 className="size-4" />
                                        <span className="sr-only">{t("timeline.deleteStop")}</span>
                                      </button>
                                    ) : null}
                                  </div>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
      </div>

      <div className="pointer-events-auto flex items-start pt-4">
        <button
          className="flex min-h-24 w-12 flex-col items-center justify-center gap-2 rounded-r-[22px] border border-l-0 border-white/8 bg-[#03101a]/98 px-2 text-white/72 shadow-[0_24px_60px_rgba(0,0,0,0.42)] backdrop-blur-2xl transition hover:text-white"
          onClick={onToggleCollapsed}
          type="button"
        >
          {collapsed ? <ChevronRight className="size-5" /> : <ChevronLeft className="size-5" />}
          <span className="text-[0.62rem] uppercase tracking-[0.24em] text-white/48 [writing-mode:vertical-rl]">
            {t("timeline.tripTimeline")}
          </span>
          <span className="sr-only">{collapsed ? t("timeline.show") : t("timeline.hide")}</span>
        </button>
      </div>
    </div>
  );
}

function getTimelineDate(value?: string, locale = "en-US") {
  if (!value) {
    return {
      month: locale === "zh-CN" ? "待定" : "TBD",
      day: "--"
    };
  }

  const date = new Date(`${value}T00:00:00`);

  return {
    month: date.toLocaleDateString(locale, { month: "short" }),
    day: date.toLocaleDateString(locale, { day: "2-digit" })
  };
}

function getTimelineAnchorId(sections: TimelineSidebarProps["sections"]) {
  const now = new Date();
  const expeditions = sections.flatMap((section) => section.items);

  const current = expeditions.find((expedition) => isCurrentExpedition(expedition, now));

  if (current) {
    return current.id;
  }

  const next = expeditions
    .filter((expedition) => getExpeditionStartTime(expedition) >= now.getTime())
    .sort((a, b) => getExpeditionStartTime(a) - getExpeditionStartTime(b))[0];

  if (next) {
    return next.id;
  }

  const latestPast = expeditions
    .filter((expedition) => getExpeditionEndTime(expedition) < now.getTime())
    .sort((a, b) => getExpeditionEndTime(b) - getExpeditionEndTime(a))[0];

  return latestPast?.id ?? expeditions[0]?.id ?? null;
}

function isCurrentExpedition(expedition: TimelineExpedition, now: Date) {
  const start = getExpeditionStartTime(expedition);
  const end = getExpeditionEndTime(expedition);

  return start <= now.getTime() && end >= now.getTime();
}

function getExpeditionStartTime(expedition: Pick<TimelineExpedition, "startDate" | "endDate">) {
  return new Date(`${expedition.startDate || expedition.endDate || "2100-01-01"}T00:00:00`).getTime();
}

function getExpeditionEndTime(expedition: Pick<TimelineExpedition, "startDate" | "endDate">) {
  return new Date(`${expedition.endDate || expedition.startDate || "2100-01-01"}T23:59:59`).getTime();
}
