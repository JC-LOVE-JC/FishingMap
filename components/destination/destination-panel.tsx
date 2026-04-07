"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";

import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Edit3,
  MapPinned,
  Sparkles,
  Trash2,
  Waves
} from "lucide-react";

import { DestinationCard } from "@/components/destination/destination-card";
import { DestinationForm } from "@/components/destination/destination-form";
import { FishSpeciesList } from "@/components/destination/fish-species-list";
import { PhotoGallery } from "@/components/destination/photo-gallery";
import { TimelineSidebar } from "@/components/destination/timeline-sidebar";
import { TransportForm } from "@/components/destination/transport-form";
import { WeatherForecastCard } from "@/components/destination/weather-forecast-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatStopOrdinal, getStatusLabel, getWaterTypeLabel, useLanguage } from "@/lib/i18n";
import type {
  Destination,
  DestinationStatus,
  TimelineExpedition,
  TransportSegment
} from "@/lib/types";
import {
  STATUS_META,
  WATER_TYPE_META,
  cn,
  formatDateRange,
  formatLocation,
  formatTransportSummary
} from "@/lib/utils";

type DestinationPanelProps = {
  addMode: boolean;
  detailsCollapsed: boolean;
  draftDestination: Destination | null;
  expeditionSuggestions: string[];
  filteredDestinations: Destination[];
  formMode: "add" | "edit" | null;
  isResolvingLocation: boolean;
  mapPickMode: boolean;
  mobileDetailsSheetMode: "half" | "full";
  mode: "overview" | "details" | "form" | "transport";
  onDeleteDestination: (destinationId: string) => void;
  onDeleteExpedition: (expeditionId: string) => void;
  onAddStopToExpedition: () => void;
  onCancelForm: () => void;
  onDraftChange: (destination: Destination) => void;
  onDisableMapPick: () => void;
  onEditSelected: () => void;
  onEditTransport: (destinationId: string) => void;
  onEnableMapPick: () => void;
  onMobileDetailsSheetModeChange: (mode: "half" | "full") => void;
  onSaveDraft: () => void;
  onSaveTransport: () => void;
  onSelectDestination: (id: string) => void;
  onShowOverview: () => void;
  onTransportChange: (segment: TransportSegment) => void;
  searchQuery: string;
  setDetailsCollapsed: (collapsed: boolean) => void;
  setTimelineCollapsed: (collapsed: boolean) => void;
  selectedExpedition: TimelineExpedition | null;
  selectedDestination: Destination | null;
  selectedExpeditionId: string | null;
  statusCounts: Record<DestinationStatus, number>;
  timelineCollapsed: boolean;
  timelineSections: Array<{ id: string; label: string; items: TimelineExpedition[] }>;
  transportTarget: Destination | null;
  transportDraft: {
    destinationId: string;
    segment: TransportSegment;
  } | null;
};

export function DestinationPanel({
  addMode,
  detailsCollapsed,
  draftDestination,
  expeditionSuggestions,
  filteredDestinations,
  formMode,
  isResolvingLocation,
  mapPickMode,
  mobileDetailsSheetMode,
  mode,
  onDeleteDestination,
  onDeleteExpedition,
  onAddStopToExpedition,
  onCancelForm,
  onDraftChange,
  onDisableMapPick,
  onEditSelected,
  onEditTransport,
  onEnableMapPick,
  onMobileDetailsSheetModeChange,
  onSaveDraft,
  onSaveTransport,
  onSelectDestination,
  onShowOverview,
  onTransportChange,
  searchQuery,
  setDetailsCollapsed,
  setTimelineCollapsed,
  selectedExpedition,
  selectedDestination,
  selectedExpeditionId,
  statusCounts,
  timelineCollapsed,
  timelineSections,
  transportTarget,
  transportDraft
}: DestinationPanelProps) {
  const { language, locale, t } = useLanguage();
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const dragStartYRef = useRef(0);
  const dragModeRef = useRef<"half" | "full">(mobileDetailsSheetMode);
  const draggingRef = useRef(false);
  const activeTheme =
    WATER_TYPE_META[
      draftDestination?.waterType || transportTarget?.waterType || selectedDestination?.waterType || "saltwater"
    ];
  const transportOrigin =
    transportTarget && selectedExpedition
      ? selectedExpedition.destinations.find(
          (destination) => (destination.stopOrder ?? 1) === (transportTarget.stopOrder ?? 1) - 1
        ) ?? null
      : null;

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const syncViewport = () => {
      setIsMobileViewport(window.innerWidth < 1024);
    };

    syncViewport();
    window.addEventListener("resize", syncViewport);

    return () => {
      window.removeEventListener("resize", syncViewport);
    };
  }, []);

  useEffect(() => {
    if (detailsCollapsed) {
      setDragOffset(0);
    }
  }, [detailsCollapsed]);

  function handleMobileSheetPointerDown(event: ReactPointerEvent<HTMLButtonElement>) {
    if (!isMobileViewport) {
      return;
    }

    dragStartYRef.current = event.clientY;
    dragModeRef.current = mobileDetailsSheetMode;
    draggingRef.current = true;
    setDragOffset(0);

    const target = event.currentTarget;
    target.setPointerCapture(event.pointerId);
  }

  function handleMobileSheetPointerMove(event: ReactPointerEvent<HTMLButtonElement>) {
    if (!isMobileViewport || !draggingRef.current) {
      return;
    }

    const delta = event.clientY - dragStartYRef.current;
    const clamped =
      dragModeRef.current === "full"
        ? Math.max(-140, Math.min(240, delta))
        : Math.max(-240, Math.min(200, delta));

    setDragOffset(clamped);
  }

  function handleMobileSheetPointerEnd(event: ReactPointerEvent<HTMLButtonElement>) {
    if (!isMobileViewport || !draggingRef.current) {
      return;
    }

    draggingRef.current = false;
    event.currentTarget.releasePointerCapture(event.pointerId);
    const delta = event.clientY - dragStartYRef.current;

    if (dragModeRef.current === "full") {
      if (delta > 110) {
        onMobileDetailsSheetModeChange("half");
      }
    } else if (delta < -80) {
      onMobileDetailsSheetModeChange("full");
    } else if (delta > 120) {
      setDetailsCollapsed(true);
    }

    setDragOffset(0);
  }

  function handleMobileHandleClick() {
    if (detailsCollapsed) {
      setDetailsCollapsed(false);
      onMobileDetailsSheetModeChange("half");
      return;
    }

    onMobileDetailsSheetModeChange(mobileDetailsSheetMode === "half" ? "full" : "half");
  }

  const mobileSheetTransform = getMobileSheetTransform({
    collapsed: detailsCollapsed,
    dragOffset,
    mode,
    mobileDetailsSheetMode
  });

  return (
    <>
      <TimelineSidebar
        collapsed={timelineCollapsed}
        onDeleteDestination={onDeleteDestination}
        onDeleteExpedition={onDeleteExpedition}
        sections={timelineSections}
        onSelectDestination={onSelectDestination}
        onToggleCollapsed={() => setTimelineCollapsed(!timelineCollapsed)}
        selectedExpeditionId={selectedExpeditionId}
        selectedId={selectedDestination?.id ?? transportTarget?.id ?? draftDestination?.id ?? null}
      />

      <div
        className={cn(
          "safe-x safe-bottom pointer-events-none absolute inset-x-3 top-[5.9rem] bottom-3 z-20 flex flex-col transition-transform duration-300 lg:inset-y-[8.75rem] lg:left-auto lg:right-6 lg:bottom-6 lg:top-auto lg:flex-row",
          detailsCollapsed
            ? "lg:translate-y-0 lg:translate-x-[calc(100%-3.25rem)]"
            : "lg:translate-x-0 lg:translate-y-0"
        )}
        style={isMobileViewport ? { transform: mobileSheetTransform } : undefined}
      >
        <div className="pointer-events-auto hidden justify-center lg:order-1 lg:mt-0 lg:flex lg:items-start lg:pt-4">
          <button
            className="flex h-12 w-full max-w-[11rem] items-center justify-center gap-2 rounded-full border border-white/8 bg-[#03101a]/98 px-4 text-white/72 shadow-[0_24px_60px_rgba(0,0,0,0.42)] backdrop-blur-2xl transition hover:text-white lg:min-h-24 lg:w-12 lg:max-w-none lg:flex-col lg:rounded-l-[22px] lg:rounded-r-none lg:border-r-0 lg:px-2"
            onClick={() => setDetailsCollapsed(!detailsCollapsed)}
            type="button"
          >
            {detailsCollapsed ? <ChevronUp className="size-5 lg:hidden" /> : <ChevronDown className="size-5 lg:hidden" />}
            {detailsCollapsed ? <ChevronLeft className="hidden size-5 lg:block" /> : <ChevronRight className="hidden size-5 lg:block" />}
            <span className="text-[0.62rem] uppercase tracking-[0.24em] text-white/48 lg:[writing-mode:vertical-rl]">
              {language === "zh" ? "详情" : "Details"}
            </span>
            <span className="sr-only">
              {detailsCollapsed
                ? language === "zh"
                  ? "显示目的地详情"
                  : "Show destination detail"
                : language === "zh"
                  ? "隐藏目的地详情"
                  : "Hide destination detail"}
            </span>
          </button>
        </div>

        <div className="order-1 w-full lg:order-2 lg:w-[30rem]">
        <div className={cn(
          "pointer-events-auto relative flex h-full min-h-0 flex-col overflow-hidden rounded-[30px] border border-white/8 bg-[#030d17]/96 shadow-[0_30px_90px_rgba(0,0,0,0.48)] backdrop-blur-2xl lg:h-full lg:max-h-none lg:min-h-0",
          activeTheme.panelClassName
        )}>
          <button
            className="relative z-10 border-b border-white/8 px-5 pb-3 pt-3 text-left lg:hidden"
            onClick={handleMobileHandleClick}
            onPointerDown={handleMobileSheetPointerDown}
            onPointerMove={handleMobileSheetPointerMove}
            onPointerUp={handleMobileSheetPointerEnd}
            onPointerCancel={handleMobileSheetPointerEnd}
            style={{ touchAction: "none" }}
            type="button"
          >
            <div className="sheet-handle" />
            <div className="mt-3 flex items-center justify-between gap-3">
              <span>
                <span className="block text-[0.62rem] uppercase tracking-[0.24em] text-white/42">
                  {language === "zh" ? "目的地详情" : "Destination Detail"}
                </span>
                <span className="mt-1 block text-sm font-medium text-white/88">
                  {mode === "transport"
                    ? language === "zh"
                      ? "交通信息"
                      : "Transport"
                    : mode === "form"
                      ? language === "zh"
                        ? "编辑中"
                        : "Editing"
                      : mode === "details" && selectedDestination
                        ? selectedDestination.title
                        : language === "zh"
                          ? "总览"
                          : "Overview"}
                </span>
              </span>
              <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[0.66rem] uppercase tracking-[0.2em] text-white/62">
                {mobileDetailsSheetMode === "half"
                  ? language === "zh"
                    ? "半屏"
                    : "Half"
                  : language === "zh"
                    ? "全屏"
                    : "Full"}
              </span>
            </div>
          </button>
          <div className={cn("pointer-events-none absolute inset-0 opacity-55", activeTheme.haloClassName)} />
          <AnimatePresence mode="wait">
            {mode === "transport" && transportDraft && transportTarget ? (
              <motion.div
                animate={{ opacity: 1, x: 0 }}
                className="relative flex-1 overflow-y-auto p-5 md:p-6"
                exit={{ opacity: 0, x: 16 }}
                initial={{ opacity: 0, x: 16 }}
                key={`transport-${transportDraft.destinationId}`}
                transition={{ duration: 0.28, ease: "easeOut" }}
              >
                <TransportForm
                  fromLabel={transportOrigin ? formatLocation(transportOrigin) : language === "zh" ? "行程起点" : "Trip start"}
                  onCancel={onCancelForm}
                  onChange={onTransportChange}
                  onSave={onSaveTransport}
                  toLabel={formatLocation(transportTarget)}
                  value={transportDraft.segment}
                />
              </motion.div>
            ) : null}

            {mode === "form" && draftDestination && formMode ? (
              <motion.div
                animate={{ opacity: 1, x: 0 }}
                className="relative flex-1 overflow-y-auto p-5 md:p-6"
                exit={{ opacity: 0, x: 16 }}
                initial={{ opacity: 0, x: 16 }}
                key={`form-${draftDestination.id}`}
                transition={{ duration: 0.28, ease: "easeOut" }}
              >
                <DestinationForm
                  addMode={addMode}
                  expeditionSuggestions={expeditionSuggestions}
                  isResolvingLocation={isResolvingLocation}
                  mapPickMode={mapPickMode}
                  mode={formMode}
                  onCancel={onCancelForm}
                  onChange={onDraftChange}
                  onDisableMapPick={onDisableMapPick}
                  onEnableMapPick={onEnableMapPick}
                  onSave={onSaveDraft}
                  value={draftDestination}
                />
              </motion.div>
            ) : null}

            {mode === "details" && selectedDestination ? (
              <motion.div
                animate={{ opacity: 1, x: 0 }}
                className="relative flex-1 overflow-y-auto p-5 md:p-6"
                exit={{ opacity: 0, x: 16 }}
                initial={{ opacity: 0, x: 16 }}
                key={selectedDestination.id}
                transition={{ duration: 0.28, ease: "easeOut" }}
              >
                <div className="space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="eyebrow">{t("overview.destinationDetail")}</p>
                    <h2 className="mt-2 font-display text-3xl text-white">
                      {selectedDestination.title}
                    </h2>
                    <p className="mt-2 text-sm text-white/60">
                      {formatLocation(selectedDestination)}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button onClick={() => onDeleteDestination(selectedDestination.id)} type="button" variant="ghost">
                      <Trash2 className="size-4" />
                      {t("overview.deleteStop")}
                    </Button>
                    <Button onClick={onShowOverview} type="button" variant="ghost">
                      {t("overview.atlas")}
                    </Button>
                  </div>
                </div>

                <PhotoGallery
                  photos={selectedDestination.photos}
                  title={selectedDestination.title}
                />

                <div className="flex flex-wrap gap-2">
                  <Badge className={STATUS_META[selectedDestination.status].badgeClassName}>
                    {getStatusLabel(selectedDestination.status, language)}
                  </Badge>
                  <Badge className={WATER_TYPE_META[selectedDestination.waterType || "saltwater"].badgeClassName}>
                    {getWaterTypeLabel(selectedDestination.waterType || "saltwater", language)}
                  </Badge>
                  {(selectedDestination.startDate ||
                    selectedDestination.endDate ||
                    selectedDestination.tripDate) ? (
                    <Badge>{formatDateRange(selectedDestination, locale)}</Badge>
                  ) : null}
                  {selectedDestination.season ? <Badge>{selectedDestination.season}</Badge> : null}
                  {selectedDestination.featured ? <Badge>{t("overview.featured")}</Badge> : null}
                </div>

                <div className="panel-section space-y-4 rounded-[28px] p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="eyebrow">{t("overview.overview")}</p>
                      <p className="mt-2 text-sm leading-6 text-white/74">
                        {selectedDestination.summary || (language === "zh" ? "尚未填写简介。" : "No summary added yet.")}
                      </p>
                    </div>
                    <Button onClick={onEditSelected} type="button" variant="secondary">
                      <Edit3 className="size-4" />
                      {t("overview.edit")}
                    </Button>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="panel-section rounded-[24px] p-4">
                    <div className="flex items-center gap-2 text-gold-200">
                      <CalendarDays className="size-4" />
                      <p className="eyebrow text-gold-100/70">{t("overview.timing")}</p>
                    </div>
                    <p className="mt-3 text-sm text-white/78">
                      {formatDateRange(selectedDestination, locale)}
                    </p>
                  </div>
                  <div className="panel-section rounded-[24px] p-4">
                    <div className="flex items-center gap-2 text-lagoon-400">
                      <MapPinned className="size-4" />
                      <p className="eyebrow text-lagoon-200/70">{t("overview.coordinates")}</p>
                    </div>
                    <p className="mt-3 text-sm text-white/78">
                      {selectedDestination.lat.toFixed(3)}, {selectedDestination.lng.toFixed(3)}
                    </p>
                  </div>
                </div>

                <WeatherForecastCard destination={selectedDestination} />

                {selectedDestination.notes ? (
                  <div className="panel-section rounded-[28px] p-5">
                    <p className="eyebrow">{t("overview.notes")}</p>
                    <p className="mt-3 whitespace-pre-line text-sm leading-7 text-white/74">
                      {selectedDestination.notes}
                    </p>
                  </div>
                ) : null}

                {selectedDestination.species.length ? (
                  <div className="panel-section rounded-[28px] p-5">
                    <div className="flex items-center gap-2">
                      <Waves className="size-4 text-lagoon-300" />
                      <p className="eyebrow">{t("overview.targetSpecies")}</p>
                    </div>
                    <div className="mt-4">
                      <FishSpeciesList species={selectedDestination.species} />
                    </div>
                  </div>
                ) : null}

                {selectedDestination.techniques.length ? (
                  <div className="panel-section rounded-[28px] p-5">
                    <p className="eyebrow">{t("overview.techniques")}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {selectedDestination.techniques.map((item) => (
                        <Badge key={item}>{item}</Badge>
                      ))}
                    </div>
                  </div>
                ) : null}

                {selectedDestination.tags.length ? (
                  <div className="panel-section rounded-[28px] p-5">
                    <div className="flex items-center gap-2">
                      <Sparkles className="size-4 text-gold-300" />
                      <p className="eyebrow">{t("overview.tags")}</p>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {selectedDestination.tags.map((item) => (
                        <Badge key={item}>{item}</Badge>
                      ))}
                    </div>
                  </div>
                ) : null}

                {selectedExpedition && selectedExpedition.destinations.length > 1 ? (
                  <div className="panel-section rounded-[28px] p-5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="eyebrow">{t("overview.expeditionRoute")}</p>
                      <div className="flex flex-wrap gap-2">
                        <Button onClick={onAddStopToExpedition} type="button" variant="secondary">
                          {t("overview.addStop")}
                        </Button>
                        <Button
                          onClick={() => onDeleteExpedition(selectedExpedition.id)}
                          type="button"
                          variant="ghost"
                        >
                          <Trash2 className="size-4" />
                          {t("overview.deleteTrip")}
                        </Button>
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      {selectedExpedition.destinations.map((stop) => (
                        <div
                          className={cn(
                            "rounded-2xl border px-3 py-3 transition",
                            stop.id === selectedDestination.id
                              ? "border-lime-300/28 bg-[#18281b]"
                              : "border-white/6 bg-[#09130b]"
                          )}
                          key={stop.id}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <button
                              className="flex flex-1 items-center justify-between text-left"
                              onClick={() => onSelectDestination(stop.id)}
                              type="button"
                            >
                              <span>
                                <span className="block text-sm font-medium text-white">
                                  {formatStopOrdinal(stop.stopOrder || 1, language)} · {stop.city || stop.title}
                                </span>
                                <span className="block text-xs uppercase tracking-[0.18em] text-white/40">
                                  {formatLocation(stop)}
                                </span>
                              </span>
                              <span className="text-xs text-white/45">{formatDateRange(stop, locale)}</span>
                            </button>
                            <button
                              className="rounded-full border border-white/8 bg-[#091725] p-2 text-white/60 transition hover:border-white/14 hover:text-white"
                              onClick={() => onDeleteDestination(stop.id)}
                              type="button"
                            >
                              <Trash2 className="size-4" />
                              <span className="sr-only">{t("timeline.deleteStop")}</span>
                            </button>
                          </div>

                          {(stop.stopOrder ?? 1) > 1 ? (
                            <button
                              className="mt-3 w-full rounded-xl border border-white/6 bg-[#101b13] px-3 py-2 text-left text-xs text-white/72 transition hover:bg-[#18281b]"
                              onClick={() => onEditTransport(stop.id)}
                              type="button"
                            >
                              {formatTransportSummary(
                                stop.transportFromPrevious,
                                t("map.transferDetailsNotSet")
                              )}
                            </button>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : selectedExpedition ? (
                  <div className="panel-section rounded-[28px] p-5">
                    <div className="flex items-center justify-between gap-3">
                      <p className="eyebrow">{t("overview.expeditionRoute")}</p>
                      <div className="flex flex-wrap gap-2">
                        <Button onClick={onAddStopToExpedition} type="button" variant="secondary">
                          {t("overview.addStop")}
                        </Button>
                        <Button
                          onClick={() => onDeleteExpedition(selectedExpedition.id)}
                          type="button"
                          variant="ghost"
                        >
                          <Trash2 className="size-4" />
                          {t("overview.deleteTrip")}
                        </Button>
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-white/68">
                      {t("overview.oneStopMessage")}
                    </p>
                  </div>
                ) : null}
                </div>
              </motion.div>
            ) : null}

            {mode === "overview" ? (
              <motion.div
                animate={{ opacity: 1, x: 0 }}
                className="relative flex-1 overflow-y-auto p-5 md:p-6"
                exit={{ opacity: 0, x: 16 }}
                initial={{ opacity: 0, x: 16 }}
                key="overview"
                transition={{ duration: 0.28, ease: "easeOut" }}
              >
                <div className="space-y-5">
                <div className="rounded-[28px] border border-emerald-950/75 bg-[linear-gradient(145deg,rgba(9,23,11,0.98),rgba(4,11,5,0.98)),radial-gradient(circle_at_top,rgba(34,197,94,0.1),transparent_42%)] p-5">
                  <p className="eyebrow">{t("overview.atlasOverview")}</p>
                  <h2 className="mt-2 font-display text-3xl text-white">
                    {t("overview.chartDream")}
                  </h2>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {(
                    Object.entries(statusCounts) as Array<[DestinationStatus, number]>
                  ).map(([status, count]) => (
                    <div className="panel-section rounded-[24px] p-4" key={status}>
                      <p className="eyebrow">{getStatusLabel(status, language)}</p>
                      <p className="mt-2 font-display text-3xl text-white">{count}</p>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="eyebrow">{t("overview.visibleExpeditions")}</p>
                    <p className="mt-1 text-sm text-white/60">
                      {searchQuery
                        ? t("overview.resultsFor", { count: filteredDestinations.length, query: searchQuery })
                        : t("overview.destinationsReady", { count: filteredDestinations.length })}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {filteredDestinations.length ? (
                    filteredDestinations.map((destination) => (
                      <DestinationCard
                        destination={destination}
                        key={destination.id}
                        onClick={() => onSelectDestination(destination.id)}
                      />
                    ))
                  ) : (
                    <div className="panel-section rounded-[28px] p-6 text-sm leading-6 text-white/58">
                      {t("overview.noDestinations")}
                    </div>
                  )}
                </div>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
      </div>
    </>
  );
}

function getMobileSheetTransform({
  collapsed,
  dragOffset,
  mode,
  mobileDetailsSheetMode
}: {
  collapsed: boolean;
  dragOffset: number;
  mode: DestinationPanelProps["mode"];
  mobileDetailsSheetMode: "half" | "full";
}) {
  const base =
    collapsed
      ? "calc(100% - 5rem)"
      : mobileDetailsSheetMode === "full"
        ? "0px"
        : mode === "transport"
          ? "calc(100% - min(38rem, 72vh))"
          : mode === "form"
            ? "calc(100% - min(40rem, 78vh))"
            : "calc(100% - min(30rem, 56vh))";

  return `translateY(calc(${base} + ${dragOffset}px))`;
}
