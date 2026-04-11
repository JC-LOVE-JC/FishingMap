"use client";

import { useDeferredValue, useEffect, useMemo, useRef, useState, useTransition } from "react";

import type { User } from "@supabase/supabase-js";

import seedDestinations from "@/data/destinations.json";
import { AccountControls } from "@/components/auth/account-controls";
import { AuthGate } from "@/components/auth/auth-gate";
import { DestinationPanel } from "@/components/destination/destination-panel";
import { MapToolbar } from "@/components/map/map-toolbar";
import { WorldMap } from "@/components/map/world-map";
import { loadStoredDestinations, saveStoredDestinations } from "@/lib/client-storage";
import { LANGUAGE_STORAGE_KEY, LanguageProvider, type Language } from "@/lib/i18n";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  createTripMap,
  deleteTripMap,
  ensureOwnedTripMap,
  loadOwnedTripMapSnapshot,
  loadSharedTripMapSnapshot,
  saveTripMapSnapshot,
  setTripMapPublicState
} from "@/lib/supabase/repository";
import type {
  Destination,
  DestinationStatus,
  LocationSuggestion,
  TransportSegment,
  TripMap
} from "@/lib/types";
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

const seeded = (seedDestinations as Destination[]).map(normalizeDestination);

export function FishingTravelPlannerApp({ sharedSlug }: { sharedSlug?: string }) {
  const supabaseEnabled = isSupabaseConfigured();
  const supabase = useMemo(
    () => (supabaseEnabled ? getSupabaseBrowserClient() : null),
    [supabaseEnabled]
  );
  const [destinations, setDestinations] = useState<Destination[]>(supabaseEnabled ? [] : seeded);
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
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authResolved, setAuthResolved] = useState(!supabaseEnabled);
  const [guestMode, setGuestMode] = useState(Boolean(sharedSlug));
  const [authBusy, setAuthBusy] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [tripMaps, setTripMaps] = useState<TripMap[]>([]);
  const [activeTripMapId, setActiveTripMapId] = useState<string | null>(null);
  const [viewerError, setViewerError] = useState<string | null>(null);
  const [autoFocusExpeditionId, setAutoFocusExpeditionId] = useState<string | null>(null);
  const deferredSearch = useDeferredValue(searchQuery);
  const [isPending, startTransition] = useTransition();
  const skipRemoteSyncRef = useRef(false);
  const autoFocusAppliedScopeRef = useRef<string | null>(null);

  function isMobileViewport() {
    return typeof window !== "undefined" && window.innerWidth < 1024;
  }

  const currentTripMap =
    tripMaps.find((tripMap) => tripMap.id === activeTripMapId) ?? null;
  const canEdit = !supabaseEnabled || (!!authUser && !sharedSlug);
  const shouldShowAuthGate =
    supabaseEnabled &&
    !sharedSlug &&
    ((authDialogOpen || (!authUser && !guestMode)));

  useEffect(() => {
    if (typeof window === "undefined" || window.innerWidth >= 1024) {
      return;
    }

    setTimelineCollapsed(true);
    setDetailsCollapsed(true);
    setSearchCollapsed(true);
  }, []);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let mounted = true;

    void supabase.auth.getSession().then(({ data }) => {
      if (!mounted) {
        return;
      }

      setAuthUser(data.session?.user ?? null);
      setAuthResolved(true);
      if (data.session?.user) {
        setGuestMode(false);
      }
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) {
        return;
      }

      setAuthUser(session?.user ?? null);
      setAuthResolved(true);
      if (session?.user) {
        setGuestMode(false);
        setAuthDialogOpen(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      if (!supabaseEnabled) {
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
        } finally {
          if (!cancelled) {
            setIsLoaded(true);
          }
        }

        return;
      }

      if (!supabase) {
        return;
      }

      if (!sharedSlug && !authResolved) {
        return;
      }

      try {
        setViewerError(null);

        if (sharedSlug) {
          const snapshot = await loadSharedTripMapSnapshot(supabase, sharedSlug);

          if (cancelled) {
            return;
          }

          setTripMaps(snapshot ? [snapshot.tripMap] : []);
          setActiveTripMapId(snapshot?.tripMap.id ?? null);
          setDestinations(snapshot?.destinations ?? []);
          setIsLoaded(true);
          return;
        }

        if (authUser) {
          const maps = await ensureOwnedTripMap(supabase, authUser);

          if (cancelled) {
            return;
          }

          setTripMaps(maps);
          const nextTripMapId =
            activeTripMapId && maps.some((tripMap) => tripMap.id === activeTripMapId)
              ? activeTripMapId
              : maps[0]?.id ?? null;

          if (!nextTripMapId) {
            setDestinations([]);
            setIsLoaded(true);
            return;
          }

          if (nextTripMapId !== activeTripMapId) {
            setActiveTripMapId(nextTripMapId);
          }

          const snapshot = await loadOwnedTripMapSnapshot(supabase, authUser.id, nextTripMapId);

          if (cancelled) {
            return;
          }

          skipRemoteSyncRef.current = true;
          setDestinations(snapshot?.destinations ?? []);
          setIsLoaded(true);
          return;
        }

        if (guestMode) {
          setTripMaps([]);
          setActiveTripMapId(null);
          setDestinations([]);
          setIsLoaded(true);
          return;
        }

        setTripMaps([]);
        setActiveTripMapId(null);
        setDestinations([]);
        setIsLoaded(true);
      } catch (error) {
        if (!cancelled) {
          setViewerError(error instanceof Error ? error.message : "Supabase sync failed");
          setIsLoaded(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeTripMapId, authResolved, authUser, guestMode, sharedSlug, supabase, supabaseEnabled]);

  useEffect(() => {
    if (!isLoaded || supabaseEnabled) {
      return;
    }

    void saveStoredDestinations(destinations);

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(destinations));
    } catch {
      return;
    }
  }, [destinations, isLoaded, supabaseEnabled]);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }, [isLoaded, language]);

  useEffect(() => {
    if (
      !supabaseEnabled ||
      !supabase ||
      !authUser ||
      !currentTripMap ||
      !isLoaded ||
      sharedSlug
    ) {
      return;
    }

    if (skipRemoteSyncRef.current) {
      skipRemoteSyncRef.current = false;
      return;
    }

    let cancelled = false;
    const timeoutId = window.setTimeout(async () => {
      try {
        const syncedDestinations = await saveTripMapSnapshot(supabase, {
          destinations,
          tripMap: currentTripMap,
          user: authUser
        });

        if (cancelled) {
          return;
        }

        if (JSON.stringify(syncedDestinations) !== JSON.stringify(destinations)) {
          skipRemoteSyncRef.current = true;
          setDestinations(syncedDestinations);
        }
      } catch (error) {
        if (!cancelled) {
          setViewerError(error instanceof Error ? error.message : "Saving to Supabase failed");
        }
      }
    }, 180);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [authUser, currentTripMap, destinations, isLoaded, sharedSlug, supabase, supabaseEnabled]);

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
  const autoFocusExpedition =
    timelineSections
      .flatMap((section) => section.items)
      .find((item) => item.id === autoFocusExpeditionId) ?? null;
  const expeditionSuggestions = [...new Set(
    destinations
      .map((destination) => destination.expeditionName?.trim())
      .filter((name): name is string => Boolean(name))
  )].sort((a, b) => a.localeCompare(b));
  const activeWaterTheme =
    WATER_TYPE_META[(draftDestination?.waterType || selectedDestination?.waterType || "saltwater")];
  const autoFocusScopeKey = sharedSlug ?? activeTripMapId ?? (supabaseEnabled ? "supabase" : "local");
  const focusTarget =
    (formMode === "add" && draftDestination ? draftDestination : selectedDestination)
    ?? autoFocusExpedition?.destinations[0]
    ?? null;
  const mapSelectedExpedition = selectedExpedition ?? autoFocusExpedition ?? null;

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (autoFocusAppliedScopeRef.current === autoFocusScopeKey) {
      return;
    }

    autoFocusAppliedScopeRef.current = autoFocusScopeKey;

    if (destinations.length === 0) {
      setAutoFocusExpeditionId(null);
      return;
    }

    const expedition = getAutoFocusExpedition(timelineSections);
    setAutoFocusExpeditionId(expedition?.id ?? null);
  }, [autoFocusScopeKey, destinations.length, isLoaded, timelineSections]);

  async function handleSignIn(email: string, password: string) {
    if (!supabase) {
      return;
    }

    setAuthBusy(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    setAuthBusy(false);

    if (error) {
      throw error;
    }
  }

  async function handleSignUp(email: string, password: string) {
    if (!supabase) {
      return;
    }

    setAuthBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });
    setAuthBusy(false);

    if (error) {
      throw error;
    }

    if (!data.session) {
      throw new Error("Account created. Check your email for confirmation, then sign in.");
    }
  }

  async function handleSignOut() {
    if (!supabase) {
      return;
    }

    await supabase.auth.signOut();
    setAuthUser(null);
    setSelectedId(null);
    setDraftDestination(null);
    setFormMode(null);
    setTransportDraft(null);
  }

  async function handleCreateTripMap(title: string) {
    if (!supabase || !authUser) {
      return;
    }

    const nextTripMap = await createTripMap(supabase, authUser.id, title);
    setTripMaps((current) => [nextTripMap, ...current]);
    setActiveTripMapId(nextTripMap.id);
    skipRemoteSyncRef.current = true;
    setDestinations([]);
  }

  async function handleDeleteTripMap() {
    if (!supabase || !authUser || !currentTripMap) {
      return;
    }

    await deleteTripMap(supabase, currentTripMap.id);

    const remainingTripMaps = tripMaps.filter((tripMap) => tripMap.id !== currentTripMap.id);
    setTripMaps(remainingTripMaps);
    setSelectedId(null);
    setDraftDestination(null);
    setFormMode(null);
    setTransportDraft(null);

    if (remainingTripMaps.length > 0) {
      setActiveTripMapId(remainingTripMaps[0].id);
      skipRemoteSyncRef.current = true;
      setDestinations([]);
      return;
    }

    const fallbackTripMap = await createTripMap(supabase, authUser.id, "My Fishing Atlas");
    setTripMaps([fallbackTripMap]);
    setActiveTripMapId(fallbackTripMap.id);
    skipRemoteSyncRef.current = true;
    setDestinations([]);
  }

  async function handleTogglePublic(isPublic: boolean) {
    if (!supabase || !currentTripMap) {
      return;
    }

    await setTripMapPublicState(supabase, currentTripMap.id, isPublic);
    setTripMaps((current) =>
      current.map((tripMap) =>
        tripMap.id === currentTripMap.id
          ? {
              ...tripMap,
              isPublic
            }
          : tripMap
      )
    );
  }

  async function handleCopyShareLink() {
    if (!currentTripMap) {
      return;
    }

    if (!currentTripMap.isPublic) {
      await handleTogglePublic(true);
    }

    await navigator.clipboard.writeText(
      new URL(`/share/${currentTripMap.shareSlug}`, window.location.origin).toString()
    );
  }

  async function persistDestinationsImmediately(nextDestinations: Destination[]) {
    if (!supabaseEnabled || sharedSlug) {
      setDestinations(nextDestinations);
      return nextDestinations;
    }

    if (!supabase || !authUser || !currentTripMap) {
      throw new Error("Supabase session is not ready yet. Please try saving again.");
    }

    const syncedDestinations = await saveTripMapSnapshot(supabase, {
      destinations: nextDestinations,
      tripMap: currentTripMap,
      user: authUser
    });

    skipRemoteSyncRef.current = true;
    setDestinations(syncedDestinations);
    return syncedDestinations;
  }

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
    if (!canEdit) {
      return;
    }

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
    if (!canEdit) {
      return;
    }

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
    if (!canEdit || !formMode || !draftDestination || !mapPickMode) {
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
    if (!canEdit || !selectedDestination) {
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
    if (!canEdit) {
      return;
    }

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
    if (!canEdit || !transportDraft) {
      return;
    }

    const nextDestinations = destinations.map((destination) =>
      destination.id === transportDraft.destinationId
        ? {
            ...destination,
            transportFromPrevious: normalizeTransportSegment(transportDraft.segment),
            updatedAt: new Date().toISOString()
          }
        : destination
    );

    void persistDestinationsImmediately(nextDestinations)
      .then(() => {
        startTransition(() => {
          setTransportDraft(null);
          setMapPickMode(false);
        });
      })
      .catch((error) => {
        setViewerError(error instanceof Error ? error.message : "Saving to Supabase failed");
      });
  }

  async function handleSaveDraft() {
    if (!canEdit || !draftDestination) {
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

    const nextDestinations =
      formMode === "edit"
        ? destinations.map((destination) =>
            destination.id === normalized.id ? normalized : destination
          )
        : [normalized, ...destinations];

    try {
      await persistDestinationsImmediately(nextDestinations);
    } catch (error) {
      setViewerError(error instanceof Error ? error.message : "Saving to Supabase failed");
      return;
    }

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
    if (!canEdit) {
      return;
    }

    const nextDestinations = deleteDestinationFromList(destinations, destinationId);

    void persistDestinationsImmediately(nextDestinations)
      .then(() => {
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
      })
      .catch((error) => {
        setViewerError(error instanceof Error ? error.message : "Saving to Supabase failed");
      });
  }

  function handleDeleteExpedition(expeditionId: string) {
    if (!canEdit) {
      return;
    }

    const nextDestinations = destinations.filter(
      (destination) => destination.expeditionId !== expeditionId
    );

    void persistDestinationsImmediately(nextDestinations)
      .then(() => {
        startTransition(() => {
          if (selectedExpeditionId === expeditionId) {
            setSelectedId(null);
            setDraftDestination(null);
            setFormMode(null);
            setTransportDraft(null);
          }
        });
      })
      .catch((error) => {
        setViewerError(error instanceof Error ? error.message : "Saving to Supabase failed");
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

  const authSlot = supabaseEnabled ? (
    <AccountControls
      currentTripMap={currentTripMap}
      guestMode={guestMode || Boolean(sharedSlug)}
      onCopyShareLink={handleCopyShareLink}
      onCreateTripMap={handleCreateTripMap}
      onDeleteTripMap={handleDeleteTripMap}
      onOpenAuth={() => {
        setGuestMode(false);
        setAuthDialogOpen(true);
      }}
      onSelectTripMap={setActiveTripMapId}
      onSignOut={handleSignOut}
      onTogglePublic={handleTogglePublic}
      tripMaps={tripMaps}
      userEmail={authUser?.email ?? null}
    />
  ) : null;

  return (
    <LanguageProvider language={language} setLanguage={setLanguage}>
      <main className="relative min-h-screen overflow-hidden">
        <WorldMap
          addMode={Boolean(formMode && mapPickMode && canEdit)}
          canEdit={canEdit}
          destinations={mapDestinations}
          draftCoordinates={
            formMode && draftDestination
              ? {
                  lat: draftDestination.lat,
                  lng: draftDestination.lng
                }
              : null
          }
          focusTarget={focusTarget}
          leftPanelCollapsed={timelineCollapsed}
          onEditTransport={handleEditTransport}
          onMapPlace={handleMapPlacement}
          onSelectDestination={handleSelectDestination}
          rightPanelCollapsed={detailsCollapsed}
          searchPanelCollapsed={searchCollapsed}
          selectedExpedition={mapSelectedExpedition}
          selectedId={selectedId}
        />

        <div className={cn("pointer-events-none absolute inset-0", activeWaterTheme.haloClassName)} />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(215,170,90,0.08),transparent_28%)]" />

        <MapToolbar
          activeFilters={activeFilters}
          addMode={formMode === "add"}
          authSlot={authSlot}
          canEdit={canEdit}
          isBusy={isPending || authBusy}
          language={language}
          manualPinMode={Boolean(formMode && mapPickMode)}
          onAddDestination={handleStartAdd}
          onLanguageChange={setLanguage}
          onSearchChange={setSearchQuery}
          onSearchPanelCollapsedChange={handleSetSearchCollapsed}
          onToggleFilter={handleToggleFilter}
          searchPanelCollapsed={searchCollapsed}
          searchQuery={searchQuery}
          statusCounts={statusCounts}
        />

        <DestinationPanel
          addMode={formMode === "add"}
          canEdit={canEdit}
          detailsCollapsed={detailsCollapsed}
          draftDestination={draftDestination}
          expeditionSuggestions={expeditionSuggestions}
          filteredDestinations={filteredDestinations}
          formMode={formMode}
          isResolvingLocation={isResolvingLocation}
          mapPickMode={mapPickMode}
          mode={panelMode}
          onAddStopToExpedition={handleAddStopToExpedition}
          onCancelForm={handleCancelForm}
          onDeleteDestination={handleDeleteDestination}
          onDeleteExpedition={handleDeleteExpedition}
          onDraftChange={setDraftDestination}
          onDisableMapPick={() => setMapPickMode(false)}
          onEditSelected={handleEditSelected}
          onEditTransport={handleEditTransport}
          onEnableMapPick={() => setMapPickMode(true)}
          onSaveDraft={handleSaveDraft}
          onSaveTransport={handleSaveTransport}
          onSelectDestination={handleSelectDestination}
          onShowOverview={() => setSelectedId(null)}
          onTransportChange={handleTransportChange}
          searchQuery={searchQuery}
          selectedDestination={selectedDestination}
          selectedExpedition={selectedExpedition}
          selectedExpeditionId={selectedExpeditionId}
          setDetailsCollapsed={handleSetDetailsCollapsed}
          setTimelineCollapsed={handleSetTimelineCollapsed}
          statusCounts={statusCounts}
          timelineCollapsed={timelineCollapsed}
          timelineSections={timelineSections}
          transportDraft={transportDraft}
          transportTarget={transportTarget}
        />

        {viewerError ? (
          <div className="pointer-events-none absolute bottom-4 right-4 z-30 rounded-2xl border border-red-400/20 bg-[#221011]/94 px-4 py-3 text-sm text-red-100 shadow-panel backdrop-blur-xl">
            {viewerError}
          </div>
        ) : null}

        <div className="pointer-events-none absolute bottom-4 left-4 z-10 hidden rounded-full border border-white/10 bg-black/30 px-4 py-2 text-xs uppercase tracking-[0.25em] text-white/45 backdrop-blur-md md:block">
          {language === "zh" ? "沉浸式远征地图 · 本地优先 MVP" : "Immersive expedition atlas · local-first MVP"}
        </div>

        {shouldShowAuthGate ? (
          <AuthGate
            busy={authBusy}
            onContinueAsGuest={() => {
              setGuestMode(true);
              setAuthDialogOpen(false);
            }}
            onSignIn={handleSignIn}
            onSignUp={handleSignUp}
          />
        ) : null}
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

function getAutoFocusExpedition(sections: Array<{ items: Array<{ id: string; startDate?: string; endDate?: string; destinations: Destination[] }> }>) {
  const expeditions = sections.flatMap((section) => section.items);

  if (expeditions.length === 0) {
    return null;
  }

  const now = new Date();
  const current = expeditions.find((expedition) => isTripActive(expedition, now));

  if (current) {
    return current;
  }

  const next = expeditions
    .filter((expedition) => getTripStartTime(expedition) >= now.getTime())
    .sort((a, b) => getTripStartTime(a) - getTripStartTime(b))[0];

  return next ?? expeditions[0] ?? null;
}

function isTripActive(
  expedition: { startDate?: string; endDate?: string },
  now: Date
) {
  const start = getTripStartTime(expedition);
  const end = getTripEndTime(expedition);

  return start <= now.getTime() && end >= now.getTime();
}

function getTripStartTime(expedition: { startDate?: string; endDate?: string }) {
  return new Date(`${expedition.startDate || expedition.endDate || "2100-01-01"}T00:00:00`).getTime();
}

function getTripEndTime(expedition: { startDate?: string; endDate?: string }) {
  return new Date(`${expedition.endDate || expedition.startDate || "2100-01-01"}T23:59:59`).getTime();
}
