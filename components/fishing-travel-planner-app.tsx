"use client";

import { useDeferredValue, useEffect, useState, useTransition } from "react";

import seedDestinations from "@/data/destinations.json";
import { DestinationPanel } from "@/components/destination/destination-panel";
import { MapToolbar } from "@/components/map/map-toolbar";
import { WorldMap } from "@/components/map/world-map";
import { loadStoredDestinations, saveStoredDestinations } from "@/lib/client-storage";
import { LANGUAGE_STORAGE_KEY, LanguageProvider, type Language } from "@/lib/i18n";
import {
  STATUS_ORDER,
  STORAGE_KEY,
  WATER_TYPE_META,
  buildTimelineSections,
  cn,
  createEmptyDestination,
  createEmptyTransportSegment,
  formatDateRange,
  normalizeDestination,
  normalizeTransportSegment,
  parseStoredDestinations
} from "@/lib/utils";
import type {
  Destination,
  DestinationStatus,
  LocationSuggestion,
  TransportSegment
} from "@/lib/types";

const seeded = (seedDestinations as Destination[]).map(normalizeDestination);

export function FishingTravelPlannerApp() {
  const [destinations, setDestinations] = useState<Destination[]>(seeded);
  const [language, setLanguage] = useState<Language>("en");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draftDestination, setDraftDestination] = useState<Destination | null>(null);
  const [formMode, setFormMode] = useState<"add" | "edit" | null>(null);
  const [transportDraft, setTransportDraft] = useState<{
    destinationId: string;
    segment: TransportSegment;
  } | null>(null);
  const [timelineCollapsed, setTimelineCollapsed] = useState(false);
  const [detailsCollapsed, setDetailsCollapsed] = useState(false);
  const [searchCollapsed, setSearchCollapsed] = useState(false);
  const [mapPickMode, setMapPickMode] = useState(false);
  const [isResolvingLocation, setIsResolvingLocation] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<DestinationStatus[]>(STATUS_ORDER);
  const [isLoaded, setIsLoaded] = useState(false);
  const deferredSearch = useDeferredValue(searchQuery);
  const [isPending, startTransition] = useTransition();

  function isMobileViewport() {
    return typeof window !== "undefined" && window.innerWidth < 1024;
  }

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const indexedDbStored = await loadStoredDestinations();
        const legacyStored =
          parseStoredDestinations(window.localStorage.getItem(STORAGE_KEY))
          ?? parseStoredDestinations(window.localStorage.getItem("fishing-travel-planner.destinations.v5"));
        const stored = indexedDbStored?.length ? indexedDbStored : legacyStored;
        const storedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);

        if (!cancelled && stored?.length) {
          setDestinations(stored);
        }

        if (!cancelled && (storedLanguage === "en" || storedLanguage === "zh")) {
          setLanguage(storedLanguage as Language);
        }

        if (!cancelled && window.innerWidth < 1024) {
          setTimelineCollapsed(true);
          setDetailsCollapsed(true);
          setSearchCollapsed(true);
        }

        if (stored?.length) {
          await saveStoredDestinations(stored);
        }
      } catch {
        const fallbackStored =
          parseStoredDestinations(window.localStorage.getItem(STORAGE_KEY))
          ?? parseStoredDestinations(window.localStorage.getItem("fishing-travel-planner.destinations.v5"));
        const storedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);

        if (!cancelled && fallbackStored?.length) {
          setDestinations(fallbackStored);
        }

        if (!cancelled && (storedLanguage === "en" || storedLanguage === "zh")) {
          setLanguage(storedLanguage as Language);
        }

        if (!cancelled && window.innerWidth < 1024) {
          setTimelineCollapsed(true);
          setDetailsCollapsed(true);
          setSearchCollapsed(true);
        }
      } finally {
        if (!cancelled) {
          setIsLoaded(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    void saveStoredDestinations(destinations);

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(destinations));
    } catch {
      return;
    }
  }, [destinations, isLoaded]);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }, [isLoaded, language]);

  useEffect(() => {
    if (selectedId && !destinations.some((destination) => destination.id === selectedId)) {
      setSelectedId(null);
    }
  }, [destinations, selectedId]);

  const normalizedSearch = deferredSearch.trim().toLowerCase();

  const filteredDestinations = destinations.filter((destination) => {
    const matchesStatus = activeFilters.includes(destination.status);
    const matchesSearch =
      normalizedSearch.length === 0 ||
      destination.title.toLowerCase().includes(normalizedSearch) ||
      destination.city?.toLowerCase().includes(normalizedSearch) ||
      destination.country.toLowerCase().includes(normalizedSearch) ||
      destination.region?.toLowerCase().includes(normalizedSearch);

    return matchesStatus && matchesSearch;
  });

  const selectedDestination =
    destinations.find((destination) => destination.id === selectedId) ?? null;
  const transportTarget =
    transportDraft
      ? destinations.find((destination) => destination.id === transportDraft.destinationId) ?? null
      : null;

  const mapDestinations =
    selectedDestination && !filteredDestinations.some((item) => item.id === selectedDestination.id)
      ? [...filteredDestinations, selectedDestination]
      : filteredDestinations;

  const statusCounts = STATUS_ORDER.reduce(
    (accumulator, status) => {
      accumulator[status] = destinations.filter(
        (destination) => destination.status === status
      ).length;
      return accumulator;
    },
    {
      planned: 0,
      visited: 0
    } as Record<DestinationStatus, number>
  );

  const panelMode = transportDraft && transportTarget
    ? "transport"
    : formMode
      ? "form"
      : selectedDestination
        ? "details"
        : "overview";
  const focusTarget = formMode === "add" && draftDestination ? draftDestination : selectedDestination;
  const timelineSections = buildTimelineSections(destinations);
  const selectedExpeditionId =
    transportTarget?.expeditionId ||
    selectedDestination?.expeditionId ||
    draftDestination?.expeditionId ||
    null;
  const selectedExpedition =
    timelineSections
      .flatMap((section) => section.items)
      .find((item) => item.id === selectedExpeditionId) ?? null;
  const expeditionSuggestions = [...new Set(
    destinations
      .map((destination) => destination.expeditionName?.trim())
      .filter((name): name is string => Boolean(name))
  )].sort((a, b) => a.localeCompare(b));
  const activeWaterTheme =
    WATER_TYPE_META[(draftDestination?.waterType || selectedDestination?.waterType || "saltwater")];

  function handleToggleFilter(status: DestinationStatus) {
    setActiveFilters((current) => {
      if (current.includes(status)) {
        if (current.length === 1) {
          return current;
        }

        return STATUS_ORDER.filter(
          (item) => item !== status && current.includes(item)
        );
      }

      return STATUS_ORDER.filter((item) => current.includes(item) || item === status);
    });
  }

  function handleSelectDestination(id: string) {
    startTransition(() => {
      setSelectedId(id);
      setFormMode(null);
      setDetailsCollapsed(false);
      if (isMobileViewport()) {
        setTimelineCollapsed(true);
        setSearchCollapsed(true);
      }
      setMapPickMode(false);
      setIsResolvingLocation(false);
      setTransportDraft(null);
      setDraftDestination(null);
    });
  }

  function handleStartAdd() {
    startTransition(() => {
      setSelectedId(null);
      setFormMode("add");
      setDetailsCollapsed(false);
      if (isMobileViewport()) {
        setTimelineCollapsed(true);
        setSearchCollapsed(true);
      }
      setMapPickMode(false);
      setIsResolvingLocation(false);
      setTransportDraft(null);
      setDraftDestination(createEmptyDestination());
    });
  }

  function handleAddStopToExpedition() {
    if (!selectedExpedition) {
      handleStartAdd();
      return;
    }

    const lastStop =
      [...selectedExpedition.destinations].sort(
        (a, b) => (a.stopOrder ?? 1) - (b.stopOrder ?? 1)
      )[selectedExpedition.destinations.length - 1];
    const carryDate = lastStop?.endDate || lastStop?.startDate || new Date().toISOString().slice(0, 10);

    startTransition(() => {
      setSelectedId(null);
      setDetailsCollapsed(false);
      if (isMobileViewport()) {
        setTimelineCollapsed(true);
        setSearchCollapsed(true);
      }
      setTransportDraft(null);
      setFormMode("add");
      setMapPickMode(false);
      setIsResolvingLocation(false);
      setDraftDestination({
        ...createEmptyDestination(lastStop?.lat ?? 6, lastStop?.lng ?? 12),
        expeditionId: selectedExpedition.id,
        expeditionName: selectedExpedition.name,
        stopOrder: (lastStop?.stopOrder ?? selectedExpedition.destinations.length) + 1,
        status: selectedExpedition.status,
        waterType: selectedExpedition.waterType,
        startDate: carryDate,
        endDate: carryDate,
        tripDate: formatDateRange({
          startDate: carryDate,
          endDate: carryDate,
          tripDate: ""
        }),
        transportFromPrevious: createEmptyTransportSegment(
          selectedExpedition.waterType === "saltwater" ? "boat" : "drive"
        )
      });
    });
  }

  async function handleMapPlacement(nextCoordinates: { lat: number; lng: number }) {
    if (!formMode || !draftDestination || !mapPickMode) {
      return;
    }

    const roundedCoordinates = {
      lat: Number(nextCoordinates.lat.toFixed(4)),
      lng: Number(nextCoordinates.lng.toFixed(4))
    };
    const draftId = draftDestination.id;

    setDraftDestination((current) =>
      current && current.id === draftId
        ? {
            ...current,
            lat: roundedCoordinates.lat,
            lng: roundedCoordinates.lng
          }
        : current
    );
    setIsResolvingLocation(true);

    try {
      const suggestion = await reverseGeocodeLocation(roundedCoordinates);

      if (!suggestion) {
        return;
      }

      setDraftDestination((current) =>
        current && current.id === draftId
          ? applyLocationSuggestionToDraft(current, suggestion)
          : current
      );
    } catch {
      return;
    } finally {
      setIsResolvingLocation(false);
    }
  }

  function handleEditSelected() {
    if (!selectedDestination) {
      return;
    }

    startTransition(() => {
      setDraftDestination({
        ...selectedDestination,
        photos: [...selectedDestination.photos]
      });
      setDetailsCollapsed(false);
      if (isMobileViewport()) {
        setTimelineCollapsed(true);
        setSearchCollapsed(true);
      }
      setMapPickMode(false);
      setIsResolvingLocation(false);
      setTransportDraft(null);
      setFormMode("edit");
    });
  }

  function handleEditTransport(destinationId: string) {
    const destination = destinations.find((item) => item.id === destinationId);

    if (!destination || (destination.stopOrder ?? 1) <= 1) {
      return;
    }

    startTransition(() => {
      setSelectedId(destinationId);
      setFormMode(null);
      setDetailsCollapsed(false);
      if (isMobileViewport()) {
        setTimelineCollapsed(true);
        setSearchCollapsed(true);
      }
      setMapPickMode(false);
      setIsResolvingLocation(false);
      setDraftDestination(null);
      setTransportDraft({
        destinationId,
        segment:
          normalizeTransportSegment(destination.transportFromPrevious) ||
          createEmptyTransportSegment(destination.waterType === "saltwater" ? "boat" : "drive")
      });
    });
  }

  function handleTransportChange(segment: TransportSegment) {
    if (!transportDraft) {
      return;
    }

    setTransportDraft({
      ...transportDraft,
      segment
    });
  }

  function handleSaveTransport() {
    if (!transportDraft) {
      return;
    }

    setDestinations((current) =>
      current.map((destination) =>
        destination.id === transportDraft.destinationId
          ? {
              ...destination,
              transportFromPrevious: normalizeTransportSegment(transportDraft.segment),
              updatedAt: new Date().toISOString()
            }
          : destination
      )
    );

    startTransition(() => {
      setTransportDraft(null);
      setMapPickMode(false);
    });
  }

  function handleSaveDraft() {
    if (!draftDestination) {
      return;
    }

    const now = new Date().toISOString();
    const trimmedExpeditionName =
      draftDestination.expeditionName?.trim() || draftDestination.title.trim();
    const matchedExpedition = destinations.find(
      (destination) =>
        destination.expeditionName?.trim().toLowerCase() ===
        trimmedExpeditionName.toLowerCase()
    );
    const normalized = normalizeDestination({
      ...draftDestination,
      title: draftDestination.title.trim(),
      expeditionId:
        formMode === "add"
          ? matchedExpedition?.expeditionId || draftDestination.expeditionId
          : draftDestination.expeditionId,
      expeditionName: trimmedExpeditionName,
      city: draftDestination.city?.trim(),
      country: draftDestination.country.trim(),
      region: draftDestination.region?.trim(),
      stopOrder: draftDestination.stopOrder ?? 1,
      season: draftDestination.season?.trim(),
      startDate: draftDestination.startDate?.trim(),
      endDate: draftDestination.endDate?.trim() || draftDestination.startDate?.trim(),
      tripDate: draftDestination.tripDate?.trim(),
      summary: draftDestination.summary?.trim(),
      notes: draftDestination.notes?.trim(),
      updatedAt: now,
      createdAt: formMode === "add" ? now : draftDestination.createdAt
    });

    normalized.tripDate = formatDateRange(normalized);

    if (!normalized.title || !normalized.country) {
      return;
    }

    setDestinations((current) => {
      if (formMode === "edit") {
        return current.map((destination) =>
          destination.id === normalized.id ? normalized : destination
        );
      }

      return [normalized, ...current];
    });

    startTransition(() => {
      setSelectedId(normalized.id);
      setFormMode(null);
      setMapPickMode(false);
      setIsResolvingLocation(false);
      setDraftDestination(null);
    });
  }

  function handleCancelForm() {
    startTransition(() => {
      setFormMode(null);
      setMapPickMode(false);
      setIsResolvingLocation(false);
      setTransportDraft(null);
      setDraftDestination(null);
    });
  }

  function handleDeleteDestination(destinationId: string) {
    setDestinations((current) => deleteDestinationFromList(current, destinationId));

    startTransition(() => {
      if (selectedId === destinationId) {
        setSelectedId(null);
      }

      if (draftDestination?.id === destinationId) {
        setDraftDestination(null);
        setFormMode(null);
      }

      if (transportDraft?.destinationId === destinationId) {
        setTransportDraft(null);
      }
    });
  }

  function handleDeleteExpedition(expeditionId: string) {
    setDestinations((current) =>
      current.filter((destination) => destination.expeditionId !== expeditionId)
    );

    startTransition(() => {
      if (selectedExpeditionId === expeditionId) {
        setSelectedId(null);
        setDraftDestination(null);
        setFormMode(null);
        setTransportDraft(null);
      }
    });
  }

  function handleSetTimelineCollapsed(collapsed: boolean) {
    setTimelineCollapsed(collapsed);

    if (!collapsed && isMobileViewport()) {
      setDetailsCollapsed(true);
      setSearchCollapsed(true);
    }
  }

  function handleSetDetailsCollapsed(collapsed: boolean) {
    setDetailsCollapsed(collapsed);

    if (!collapsed && isMobileViewport()) {
      setTimelineCollapsed(true);
      setSearchCollapsed(true);
    }
  }

  function handleSetSearchCollapsed(collapsed: boolean) {
    setSearchCollapsed(collapsed);

    if (!collapsed && isMobileViewport()) {
      setTimelineCollapsed(true);
      setDetailsCollapsed(true);
    }
  }

  return (
    <LanguageProvider language={language} setLanguage={setLanguage}>
      <main className="relative min-h-screen overflow-hidden">
      <WorldMap
        addMode={Boolean(formMode && mapPickMode)}
        destinations={mapDestinations}
        draftCoordinates={
          formMode && draftDestination
            ? {
                lat: draftDestination.lat,
                lng: draftDestination.lng
              }
            : null
        }
        leftPanelCollapsed={timelineCollapsed}
        rightPanelCollapsed={detailsCollapsed}
        selectedExpedition={selectedExpedition}
        focusTarget={focusTarget}
        onEditTransport={handleEditTransport}
        onMapPlace={handleMapPlacement}
        onSelectDestination={handleSelectDestination}
        searchPanelCollapsed={searchCollapsed}
        selectedId={selectedId}
      />

      <div className={cn("pointer-events-none absolute inset-0", activeWaterTheme.haloClassName)} />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(215,170,90,0.08),transparent_28%)]" />

      <MapToolbar
        activeFilters={activeFilters}
        addMode={formMode === "add"}
        isBusy={isPending}
        manualPinMode={Boolean(formMode && mapPickMode)}
        onAddDestination={handleStartAdd}
        onLanguageChange={setLanguage}
        onSearchChange={setSearchQuery}
        onSearchPanelCollapsedChange={handleSetSearchCollapsed}
        onToggleFilter={handleToggleFilter}
        searchQuery={searchQuery}
        searchPanelCollapsed={searchCollapsed}
        statusCounts={statusCounts}
        language={language}
      />

      <DestinationPanel
        addMode={formMode === "add"}
        detailsCollapsed={detailsCollapsed}
        draftDestination={draftDestination}
        expeditionSuggestions={expeditionSuggestions}
        filteredDestinations={filteredDestinations}
        formMode={formMode}
        isResolvingLocation={isResolvingLocation}
        mapPickMode={mapPickMode}
        onDeleteDestination={handleDeleteDestination}
        onDeleteExpedition={handleDeleteExpedition}
        selectedExpeditionId={selectedExpeditionId}
        setDetailsCollapsed={handleSetDetailsCollapsed}
        setTimelineCollapsed={handleSetTimelineCollapsed}
        timelineCollapsed={timelineCollapsed}
        timelineSections={timelineSections}
        mode={panelMode}
        onAddStopToExpedition={handleAddStopToExpedition}
        onCancelForm={handleCancelForm}
        onDraftChange={setDraftDestination}
        onDisableMapPick={() => setMapPickMode(false)}
        onEditSelected={handleEditSelected}
        onEditTransport={handleEditTransport}
        onEnableMapPick={() => setMapPickMode(true)}
        onSaveDraft={handleSaveDraft}
        onSaveTransport={handleSaveTransport}
        onSelectDestination={handleSelectDestination}
        onShowOverview={() => setSelectedId(null)}
        searchQuery={searchQuery}
        selectedExpedition={selectedExpedition}
        selectedDestination={selectedDestination}
        statusCounts={statusCounts}
        transportTarget={transportTarget}
        transportDraft={transportDraft}
        onTransportChange={handleTransportChange}
      />

      <div className="pointer-events-none absolute bottom-4 left-4 z-10 hidden rounded-full border border-white/10 bg-black/30 px-4 py-2 text-xs uppercase tracking-[0.25em] text-white/45 backdrop-blur-md md:block">
        {language === "zh" ? "沉浸式远征地图 · 本地优先 MVP" : "Immersive expedition atlas · local-first MVP"}
      </div>
      </main>
    </LanguageProvider>
  );
}

function deleteDestinationFromList(destinations: Destination[], destinationId: string) {
  const target = destinations.find((item) => item.id === destinationId);

  if (!target) {
    return destinations;
  }

  const expeditionId = target.expeditionId;

  if (!expeditionId) {
    return destinations.filter((item) => item.id !== destinationId);
  }

  const expeditionStops = destinations
    .filter((item) => item.expeditionId === expeditionId)
    .sort((a, b) => (a.stopOrder ?? 1) - (b.stopOrder ?? 1));

  if (expeditionStops.length <= 1) {
    return destinations.filter((item) => item.id !== destinationId);
  }

  const predecessorById = new Map<string, string | null>();
  expeditionStops.forEach((stop, index) => {
    predecessorById.set(stop.id, expeditionStops[index - 1]?.id ?? null);
  });

  const remainingStops = expeditionStops.filter((item) => item.id !== destinationId);
  const rewrittenStops = remainingStops.map((stop, index) => {
    const newPreviousId = remainingStops[index - 1]?.id ?? null;
    const previousUnchanged = predecessorById.get(stop.id) === newPreviousId;

    return {
      ...stop,
      stopOrder: index + 1,
      transportFromPrevious:
        index === 0
          ? null
          : previousUnchanged
            ? stop.transportFromPrevious ?? null
            : null
    };
  });
  const rewrittenById = new Map(rewrittenStops.map((stop) => [stop.id, stop]));

  return destinations
    .filter((item) => item.id !== destinationId)
    .map((item) => rewrittenById.get(item.id) ?? item);
}

function applyLocationSuggestionToDraft(
  destination: Destination,
  suggestion: LocationSuggestion
) {
  return {
    ...destination,
    title: destination.title.trim() ? destination.title : suggestion.name,
    city: suggestion.city || suggestion.name,
    region: suggestion.region || "",
    country: suggestion.country || destination.country,
    lat: Number(suggestion.lat.toFixed(4)),
    lng: Number(suggestion.lng.toFixed(4))
  };
}

async function reverseGeocodeLocation(coordinates: { lat: number; lng: number }) {
  const response = await fetch(
    `/api/location-reverse?lat=${coordinates.lat}&lng=${coordinates.lng}`
  );

  if (!response.ok) {
    throw new Error("Reverse geocoding failed");
  }

  const payload = await response.json();
  return (payload.result ?? null) as LocationSuggestion | null;
}
