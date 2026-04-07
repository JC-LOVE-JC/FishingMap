"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Edit3,
  MapPinned,
  Phone,
  Ship,
  Sparkles,
  Trash2,
  UserRound,
  Waves
} from "lucide-react";

import { DestinationCard } from "@/components/destination/destination-card";
import { DestinationForm } from "@/components/destination/destination-form";
import { FishSpeciesList } from "@/components/destination/fish-species-list";
import { PhotoGallery } from "@/components/destination/photo-gallery";
import { TimelineSidebar } from "@/components/destination/timeline-sidebar";
import { TransportForm } from "@/components/destination/transport-form";
import { WeatherForecastCard } from "@/components/destination/weather-forecast-card";
import { BottomSheet, type BottomSheetSnap } from "@/components/ui/bottom-sheet";
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
  mobileDetailSheetSnap: BottomSheetSnap;
  mode: "overview" | "details" | "form" | "transport";
  onAddStopToExpedition: () => void;
  onCancelForm: () => void;
  onDeleteDestination: (destinationId: string) => void;
  onDeleteExpedition: (expeditionId: string) => void;
  onDraftChange: (destination: Destination) => void;
  onDisableMapPick: () => void;
  onEditSelected: () => void;
  onEditTransport: (destinationId: string) => void;
  onEnableMapPick: () => void;
  onMobileDetailSheetSnapChange: (snap: BottomSheetSnap) => void;
  onSaveDraft: () => void;
  onSaveTransport: () => void;
  onSelectDestination: (id: string) => void;
  onShowOverview: () => void;
  onTransportChange: (segment: TransportSegment) => void;
  searchQuery: string;
  selectedDestination: Destination | null;
  selectedExpedition: TimelineExpedition | null;
  selectedExpeditionId: string | null;
  setDetailsCollapsed: (collapsed: boolean) => void;
  setTimelineCollapsed: (collapsed: boolean) => void;
  statusCounts: Record<DestinationStatus, number>;
  timelineCollapsed: boolean;
  timelineSections: Array<{ id: string; label: string; items: TimelineExpedition[] }>;
  transportDraft: {
    destinationId: string;
    segment: TransportSegment;
  } | null;
  transportTarget: Destination | null;
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
  mobileDetailSheetSnap,
  mode,
  onAddStopToExpedition,
  onCancelForm,
  onDeleteDestination,
  onDeleteExpedition,
  onDraftChange,
  onDisableMapPick,
  onEditSelected,
  onEditTransport,
  onEnableMapPick,
  onMobileDetailSheetSnapChange,
  onSaveDraft,
  onSaveTransport,
  onSelectDestination,
  onShowOverview,
  onTransportChange,
  searchQuery,
  selectedDestination,
  selectedExpedition,
  selectedExpeditionId,
  setDetailsCollapsed,
  setTimelineCollapsed,
  statusCounts,
  timelineCollapsed,
  timelineSections,
  transportDraft,
  transportTarget
}: DestinationPanelProps) {
  const { language, locale, t } = useLanguage();
  const activeTheme =
    WATER_TYPE_META[
      draftDestination?.waterType || transportTarget?.waterType || selectedDestination?.waterType || "saltwater"
    ];
  const hasGuideOrBoatInfo = Boolean(
    selectedDestination?.guideInfo?.name?.trim() ||
      selectedDestination?.guideInfo?.contact?.trim() ||
      selectedDestination?.boatInfo?.boatName?.trim() ||
      selectedDestination?.boatInfo?.length?.trim() ||
      selectedDestination?.boatInfo?.boatType?.trim() ||
      selectedDestination?.boatInfo?.engineSetup?.trim() ||
      selectedDestination?.boatInfo?.maxAnglers ||
      selectedDestination?.boatInfo?.fightingChair ||
      selectedDestination?.boatInfo?.liveBaitTank ||
      selectedDestination?.boatInfo?.outriggers ||
      selectedDestination?.boatInfo?.birdRadar ||
      selectedDestination?.boatInfo?.tubes ||
      selectedDestination?.boatInfo?.hasCabin ||
      selectedDestination?.boatInfo?.hasToilet
  );
  const transportOrigin =
    transportTarget && selectedExpedition
      ? selectedExpedition.destinations.find(
          (destination) => (destination.stopOrder ?? 1) === (transportTarget.stopOrder ?? 1) - 1
        ) ?? null
      : null;
  const panelShellClass = cn(
    "pointer-events-auto relative flex h-full min-h-0 flex-col overflow-hidden rounded-[30px] border border-white/8 bg-[#030d17]/96 shadow-[0_30px_90px_rgba(0,0,0,0.48)] backdrop-blur-2xl",
    activeTheme.panelClassName
  );

  const panelInner = (
    <>
      <div className={cn("pointer-events-none absolute inset-0 opacity-55", activeTheme.haloClassName)} />
      <AnimatePresence mode="wait">
        {mode === "transport" && transportDraft && transportTarget ? (
          <motion.div
            animate={{ opacity: 1, x: 0 }}
            className="relative flex-1 min-h-0 overflow-y-auto p-5 pb-4 md:p-6"
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
            className="relative flex-1 min-h-0 overflow-y-auto p-5 md:p-6"
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
            className="relative flex-1 min-h-0 overflow-y-auto p-5 md:p-6"
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

              {selectedDestination.notes ? (
                <div className="panel-section rounded-[28px] p-5">
                  <p className="eyebrow">{t("overview.notes")}</p>
                  <p className="mt-3 whitespace-pre-line text-sm leading-7 text-white/74">
                    {selectedDestination.notes}
                  </p>
                </div>
              ) : null}

              {hasGuideOrBoatInfo ? (
                <details className="panel-section group overflow-hidden rounded-[28px]">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 marker:hidden">
                    <div>
                      <p className="eyebrow">{t("overview.guideBoatInfo")}</p>
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/5 p-2 text-white/55 transition group-open:rotate-180">
                      <ChevronDown className="size-4" />
                    </span>
                  </summary>

                  <div className="grid gap-4 border-t border-white/8 px-5 pb-5 pt-4">
                    {(selectedDestination.guideInfo?.name?.trim() ||
                      selectedDestination.guideInfo?.contact?.trim()) ? (
                      <div className="rounded-[24px] border border-white/8 bg-[#07131d] p-4">
                        <div className="flex items-center gap-2">
                          <UserRound className="size-4 text-gold-200" />
                          <p className="eyebrow">{t("overview.guide")}</p>
                        </div>
                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                          <div>
                            <p className="text-[0.68rem] uppercase tracking-[0.18em] text-white/40">
                              {t("overview.guideName")}
                            </p>
                            <p className="mt-2 text-sm text-white/82">
                              {selectedDestination.guideInfo?.name || t("overview.notProvided")}
                            </p>
                          </div>
                          <div>
                            <p className="flex items-center gap-2 text-[0.68rem] uppercase tracking-[0.18em] text-white/40">
                              <Phone className="size-3.5" />
                              {t("overview.contact")}
                            </p>
                            <p className="mt-2 text-sm text-white/82">
                              {selectedDestination.guideInfo?.contact || t("overview.notProvided")}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {selectedDestination.boatInfo ? (
                      <div className="rounded-[24px] border border-white/8 bg-[#07131d] p-4">
                        <div className="flex items-center gap-2">
                          <Ship className="size-4 text-lagoon-300" />
                          <p className="eyebrow">{t("overview.boatInfo")}</p>
                        </div>
                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                          <InfoField
                            label={t("overview.boatName")}
                            fallback={t("overview.notProvided")}
                            value={selectedDestination.boatInfo.boatName}
                          />
                          <InfoField
                            label={t("overview.length")}
                            fallback={t("overview.notProvided")}
                            value={selectedDestination.boatInfo.length}
                          />
                          <InfoField
                            label={t("overview.boatType")}
                            fallback={t("overview.notProvided")}
                            value={selectedDestination.boatInfo.boatType}
                          />
                          <InfoField
                            label={t("overview.maxAnglers")}
                            fallback={t("overview.notProvided")}
                            value={
                              selectedDestination.boatInfo.maxAnglers
                                ? String(selectedDestination.boatInfo.maxAnglers)
                                : ""
                            }
                          />
                          <div className="md:col-span-2">
                            <InfoField
                              label={t("overview.engineSetup")}
                              fallback={t("overview.notProvided")}
                              value={selectedDestination.boatInfo.engineSetup}
                            />
                          </div>
                        </div>
                        <div className="mt-4">
                          <p className="text-[0.68rem] uppercase tracking-[0.18em] text-white/40">
                            {t("overview.features")}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {buildBoatFeatures(selectedDestination, {
                              notProvided: t("overview.notProvided"),
                              fightingChair: t("overview.fightingChair"),
                              liveBaitTank: t("overview.liveBaitTank"),
                              outriggers: t("overview.outriggers"),
                              birdRadar: t("overview.birdRadar"),
                              tubes: t("overview.tubes"),
                              cabin: t("overview.cabin"),
                              toilet: t("overview.toilet")
                            }).map((feature) => (
                              <Badge key={feature}>{feature}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </details>
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

              <WeatherForecastCard destination={selectedDestination} />
            </div>
          </motion.div>
        ) : null}

        {mode === "overview" ? (
          <motion.div
            animate={{ opacity: 1, x: 0 }}
            className="relative flex-1 min-h-0 overflow-y-auto p-5 md:p-6"
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
                {(Object.entries(statusCounts) as Array<[DestinationStatus, number]>).map(([status, count]) => (
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
    </>
  );

  return (
    <>
      <TimelineSidebar
        collapsed={timelineCollapsed}
        onDeleteDestination={onDeleteDestination}
        onDeleteExpedition={onDeleteExpedition}
        onSelectDestination={onSelectDestination}
        onToggleCollapsed={() => setTimelineCollapsed(!timelineCollapsed)}
        sections={timelineSections}
        selectedExpeditionId={selectedExpeditionId}
        selectedId={selectedDestination?.id ?? transportTarget?.id ?? draftDestination?.id ?? null}
      />

      <BottomSheet
        className={panelShellClass}
        onSnapChange={onMobileDetailSheetSnapChange}
        snap={mobileDetailSheetSnap}
      >
        {panelInner}
      </BottomSheet>

      <div
        className={cn(
          "pointer-events-none absolute bottom-6 right-6 top-[8.75rem] z-20 hidden flex-row items-start transition-transform duration-300 lg:flex",
          detailsCollapsed ? "translate-x-[calc(100%-3.25rem)]" : "translate-x-0"
        )}
      >
        <div className="pointer-events-auto flex items-start">
          <button
            className="flex min-h-24 w-12 flex-col items-center justify-center gap-2 rounded-l-[22px] rounded-r-none border border-r-0 border-white/8 bg-[#03101a]/98 px-2 text-white/72 shadow-[0_24px_60px_rgba(0,0,0,0.42)] backdrop-blur-2xl transition hover:text-white"
            onClick={() => setDetailsCollapsed(!detailsCollapsed)}
            type="button"
          >
            {detailsCollapsed ? <ChevronLeft className="size-5" /> : <ChevronRight className="size-5" />}
            <span className="text-[0.62rem] uppercase tracking-[0.24em] text-white/48 [writing-mode:vertical-rl]">
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

        <div className="h-full w-[30rem] max-w-[calc(100vw-6rem)]">
          <div className={panelShellClass}>{panelInner}</div>
        </div>
      </div>
    </>
  );
}

function InfoField({
  fallback,
  label,
  value
}: {
  fallback: string;
  label: string;
  value?: string;
}) {
  return (
    <div>
      <p className="text-[0.68rem] uppercase tracking-[0.18em] text-white/40">{label}</p>
      <p className="mt-2 text-sm text-white/82">{value?.trim() || fallback}</p>
    </div>
  );
}

function buildBoatFeatures(
  destination: Destination,
  labels: {
    notProvided: string;
    fightingChair: string;
    liveBaitTank: string;
    outriggers: string;
    birdRadar: string;
    tubes: string;
    cabin: string;
    toilet: string;
  }
) {
  const boatInfo = destination.boatInfo;

  if (!boatInfo) {
    return [labels.notProvided];
  }

  const features = [
    boatInfo.fightingChair ? labels.fightingChair : null,
    boatInfo.liveBaitTank ? labels.liveBaitTank : null,
    boatInfo.outriggers ? labels.outriggers : null,
    boatInfo.birdRadar ? labels.birdRadar : null,
    boatInfo.tubes ? labels.tubes : null,
    boatInfo.hasCabin ? labels.cabin : null,
    boatInfo.hasToilet ? labels.toilet : null
  ].filter(Boolean);

  return features.length ? features : [labels.notProvided];
}
