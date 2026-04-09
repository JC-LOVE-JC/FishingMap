"use client";

import type { ReactNode } from "react";

import { ChevronLeft, ChevronRight, Plus, Search, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getStatusLabel, type Language, useLanguage } from "@/lib/i18n";
import type { DestinationStatus } from "@/lib/types";
import { STATUS_META, cn } from "@/lib/utils";

type MapToolbarProps = {
  activeFilters: DestinationStatus[];
  addMode: boolean;
  authSlot?: ReactNode;
  canEdit: boolean;
  isBusy: boolean;
  language: Language;
  manualPinMode: boolean;
  onAddDestination: () => void;
  onLanguageChange: (language: Language) => void;
  onSearchChange: (value: string) => void;
  onSearchPanelCollapsedChange: (collapsed: boolean) => void;
  onToggleFilter: (status: DestinationStatus) => void;
  searchQuery: string;
  searchPanelCollapsed: boolean;
  statusCounts: Record<DestinationStatus, number>;
};

export function MapToolbar({
  activeFilters,
  addMode,
  authSlot,
  canEdit,
  isBusy,
  language,
  manualPinMode,
  onAddDestination,
  onLanguageChange,
  onSearchChange,
  onSearchPanelCollapsedChange,
  onToggleFilter,
  searchQuery,
  searchPanelCollapsed,
  statusCounts
}: MapToolbarProps) {
  const { t } = useLanguage();

  const filters = (
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0 lg:pb-0">
      {Object.entries(STATUS_META).map(([status, meta]) => {
        const typedStatus = status as DestinationStatus;
        const active = activeFilters.includes(typedStatus);

        return (
          <button
            className={cn(
              "shrink-0 rounded-full border px-3 py-2 text-xs uppercase tracking-[0.22em] transition",
              active
                ? `${meta.badgeClassName} border-white/10 shadow-[0_0_22px_rgba(255,255,255,0.08)]`
                : "border-white/8 bg-[#06131d] text-white/55 hover:bg-[#0b1d2a]"
            )}
            key={status}
            onClick={() => onToggleFilter(typedStatus)}
            type="button"
          >
            {getStatusLabel(typedStatus, language)} · {statusCounts[typedStatus]}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="safe-top safe-x pointer-events-none absolute inset-x-0 top-0 z-20 p-3 md:p-6">
      <div className="mx-auto hidden max-w-7xl lg:block">
        <div className="pointer-events-auto flex flex-col gap-3 rounded-[28px] border border-emerald-950/80 bg-[#051007]/98 px-4 py-3 shadow-[0_28px_80px_rgba(0,0,0,0.48)] backdrop-blur-2xl md:flex-row md:items-center md:justify-between md:px-5 md:py-4">
          <div className="flex items-center gap-4">
            <div className="flex size-11 items-center justify-center rounded-2xl border border-emerald-700/24 bg-emerald-500/10 text-emerald-200 shadow-[0_0_30px_rgba(74,222,128,0.14)] md:size-12">
              <Sparkles className="size-5" />
            </div>
            <div>
              <p className="hidden text-[0.68rem] font-medium uppercase tracking-[0.24em] text-white/42 sm:block">
                {t("toolbar.journal")}
              </p>
              <h1 className="font-display text-[1.65rem] tracking-[0.03em] text-white md:text-3xl">
                {t("toolbar.title")}
              </h1>
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-3 md:max-w-3xl md:flex-row md:items-center md:justify-end">
            <div className="flex items-center justify-between gap-2 md:justify-start">
              <span className="text-[0.62rem] uppercase tracking-[0.22em] text-white/45">
                {t("toolbar.language")}
              </span>
              <div className="flex rounded-full border border-white/8 bg-[#06120a]/96 p-1">
                <button
                  className={cn(
                    "rounded-full px-3 py-1.5 text-[0.68rem] font-medium uppercase tracking-[0.18em] transition",
                    language === "en" ? "bg-[#122217] text-white" : "text-white/55 hover:text-white"
                  )}
                  onClick={() => onLanguageChange("en")}
                  type="button"
                >
                  {t("toolbar.english")}
                </button>
                <button
                  className={cn(
                    "rounded-full px-3 py-1.5 text-[0.68rem] font-medium tracking-[0.12em] transition",
                    language === "zh" ? "bg-[#122217] text-white" : "text-white/55 hover:text-white"
                  )}
                  onClick={() => onLanguageChange("zh")}
                  type="button"
                >
                  {t("toolbar.chinese")}
                </button>
              </div>
            </div>

            <div className="relative min-w-0 flex-1 md:max-w-sm">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-white/45" />
              <Input
                className="pl-11"
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder={t("toolbar.searchPlaceholder")}
                value={searchQuery}
              />
            </div>

            {filters}

            {authSlot}

            <Button className="w-full justify-center md:w-auto" disabled={!canEdit} onClick={onAddDestination} variant={addMode ? "accent" : "primary"}>
              <Plus className="size-4" />
              {addMode
                ? t("toolbar.placingDestination")
                : isBusy
                  ? t("toolbar.working")
                  : t("toolbar.addDestination")}
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto lg:hidden">
        <div className="pointer-events-auto rounded-[26px] border border-emerald-950/80 bg-[#051007]/98 px-4 py-3 shadow-[0_28px_80px_rgba(0,0,0,0.48)] backdrop-blur-2xl">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-2xl border border-emerald-700/24 bg-emerald-500/10 text-emerald-200 shadow-[0_0_24px_rgba(74,222,128,0.12)]">
                <Sparkles className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[0.6rem] font-medium uppercase tracking-[0.22em] text-white/34">
                  {t("toolbar.journal")}
                </p>
                <h1 className="truncate font-display text-[1.2rem] tracking-[0.03em] text-white">
                  {t("toolbar.title")}
                </h1>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {authSlot}
              <div className="flex rounded-full border border-white/8 bg-[#06120a]/96 p-1">
                <button
                  className={cn(
                    "rounded-full px-2.5 py-1.5 text-[0.64rem] font-medium uppercase tracking-[0.16em] transition",
                    language === "en" ? "bg-[#122217] text-white" : "text-white/55 hover:text-white"
                  )}
                  onClick={() => onLanguageChange("en")}
                  type="button"
                >
                  {t("toolbar.english")}
                </button>
                <button
                  className={cn(
                    "rounded-full px-2.5 py-1.5 text-[0.64rem] font-medium tracking-[0.1em] transition",
                    language === "zh" ? "bg-[#122217] text-white" : "text-white/55 hover:text-white"
                  )}
                  onClick={() => onLanguageChange("zh")}
                  type="button"
                >
                  {t("toolbar.chinese")}
                </button>
              </div>

              <Button className="h-11 shrink-0 rounded-2xl px-4" disabled={!canEdit} onClick={onAddDestination} variant={addMode ? "accent" : "primary"}>
                <Plus className="size-4" />
                <span className="sr-only">
                  {addMode
                    ? t("toolbar.placingDestination")
                    : isBusy
                      ? t("toolbar.working")
                      : t("toolbar.addDestination")}
                </span>
              </Button>
            </div>
          </div>
        </div>

        <div
          className={cn(
            "pointer-events-none absolute right-3 top-[5.9rem] z-30 flex transition-transform duration-300",
            searchPanelCollapsed ? "translate-x-[calc(100%-3.25rem)]" : "translate-x-0"
          )}
        >
          <button
            className="pointer-events-auto mt-4 flex min-h-24 w-12 flex-col items-center justify-center gap-2 rounded-l-[22px] border border-r-0 border-white/8 bg-[#03101a]/98 px-2 text-white/72 shadow-[0_24px_60px_rgba(0,0,0,0.42)] backdrop-blur-2xl transition hover:text-white"
            onClick={() => onSearchPanelCollapsedChange(!searchPanelCollapsed)}
            type="button"
          >
            {searchPanelCollapsed ? <ChevronLeft className="size-5" /> : <ChevronRight className="size-5" />}
            <span className="text-[0.62rem] uppercase tracking-[0.24em] [writing-mode:vertical-rl]">
              {t("toolbar.search")}
            </span>
            <span className="sr-only">{searchPanelCollapsed ? t("toolbar.showSearch") : t("toolbar.hideSearch")}</span>
          </button>

          <div className="pointer-events-auto w-[18rem] overflow-hidden rounded-[28px] border border-emerald-950/80 bg-[#051007]/98 shadow-[0_28px_80px_rgba(0,0,0,0.52)] backdrop-blur-2xl">
            <div className="border-b border-emerald-950/70 bg-[linear-gradient(180deg,rgba(6,20,10,1),rgba(3,11,5,0.98))] px-4 py-4">
              <p className="eyebrow">{t("toolbar.search")}</p>
              <div className="relative mt-3">
                <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-white/45" />
                <Input
                  className="pl-11"
                  onChange={(event) => onSearchChange(event.target.value)}
                  placeholder={t("toolbar.searchPlaceholder")}
                  value={searchQuery}
                />
              </div>
            </div>

            <div className="px-4 py-4">
              {filters}
            </div>
          </div>
        </div>
      </div>

      {manualPinMode ? (
        <div className="pointer-events-auto mx-auto mt-3 max-w-fit rounded-full border border-emerald-700/20 bg-[#08120a]/96 px-4 py-2 text-xs uppercase tracking-[0.24em] text-emerald-200 shadow-panel backdrop-blur-xl lg:mt-3">
          {t("toolbar.manualPinMode")}
        </div>
      ) : null}
    </div>
  );
}
