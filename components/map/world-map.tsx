"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import Map, { Layer, Marker, Popup, Source, type MapRef } from "@vis.gl/react-maplibre";
import { Minus, Navigation, Plus } from "lucide-react";

import { DestinationMarker } from "@/components/map/destination-marker";
import { getTransportModeLabel, useLanguage } from "@/lib/i18n";
import { INITIAL_VIEW_STATE, MAP_MAX_ZOOM, MAP_MIN_ZOOM, MAP_SKY, MAP_STYLE } from "@/lib/map";
import type { Destination, TimelineExpedition, TransportMode } from "@/lib/types";
import { TRANSPORT_MODE_META, cn } from "@/lib/utils";

type WorldMapProps = {
  addMode: boolean;
  destinations: Destination[];
  draftCoordinates: { lat: number; lng: number } | null;
  focusTarget: Pick<Destination, "lat" | "lng"> | null;
  leftPanelCollapsed: boolean;
  mobileDetailSheetMode: "half" | "full";
  onEditTransport: (destinationId: string) => void;
  onMapPlace: (coordinates: { lat: number; lng: number }) => void;
  onSelectDestination: (id: string) => void;
  rightPanelCollapsed: boolean;
  searchPanelCollapsed: boolean;
  selectedExpedition: TimelineExpedition | null;
  selectedId: string | null;
};

const TRANSPORT_ROUTE_META = {
  flight: {
    arrowClassName: "border-emerald-700/60 bg-[linear-gradient(180deg,#1c4d2d,#0f2617)] text-emerald-100",
    badgeClassName: "border-emerald-700/45 bg-[#163822] text-emerald-50",
    buttonClassName:
      "border-emerald-600/35 bg-[radial-gradient(circle_at_30%_25%,rgba(110,231,183,0.36),transparent_42%),linear-gradient(180deg,#215436,#0f2417)] text-emerald-50",
    casingColor: "rgba(10, 24, 15, 0.34)",
    dashArray: [1.1, 2.3] as [number, number],
    lineColor: "#14532d"
  },
  drive: {
    arrowClassName: "border-slate-500/60 bg-[linear-gradient(180deg,#5f6c79,#29313a)] text-slate-100",
    badgeClassName: "border-slate-400/35 bg-[#495460] text-slate-50",
    buttonClassName:
      "border-slate-400/28 bg-[radial-gradient(circle_at_30%_25%,rgba(226,232,240,0.3),transparent_42%),linear-gradient(180deg,#7b8793,#3a424c)] text-slate-50",
    casingColor: "rgba(34, 40, 49, 0.28)",
    dashArray: [1.8, 2.1] as [number, number],
    lineColor: "#cbd5e1"
  },
  boat: {
    arrowClassName: "border-blue-700/60 bg-[linear-gradient(180deg,#17396e,#0d1d36)] text-blue-100",
    badgeClassName: "border-blue-700/45 bg-[#112d57] text-blue-50",
    buttonClassName:
      "border-blue-500/28 bg-[radial-gradient(circle_at_30%_25%,rgba(96,165,250,0.34),transparent_42%),linear-gradient(180deg,#2959a2,#102445)] text-blue-50",
    casingColor: "rgba(12, 24, 48, 0.34)",
    dashArray: [2.6, 2.4] as [number, number],
    lineColor: "#1d4ed8"
  }
} satisfies Record<
  TransportMode,
  {
    arrowClassName: string;
    badgeClassName: string;
    buttonClassName: string;
    casingColor: string;
    dashArray: [number, number];
    lineColor: string;
  }
>;

export function WorldMap({
  addMode,
  destinations,
  draftCoordinates,
  focusTarget,
  leftPanelCollapsed,
  mobileDetailSheetMode,
  onEditTransport,
  onMapPlace,
  onSelectDestination,
  rightPanelCollapsed,
  searchPanelCollapsed,
  selectedExpedition,
  selectedId
}: WorldMapProps) {
  const mapRef = useRef<MapRef | null>(null);
  const previousFocus = useRef<string>("");
  const [hoveredTransportDestinationId, setHoveredTransportDestinationId] = useState<string | null>(null);
  const [mapZoom, setMapZoom] = useState(INITIAL_VIEW_STATE.zoom);
  const { language, t } = useLanguage();

  function syncMapZoom(nextZoom: number) {
    setMapZoom(Number(nextZoom.toFixed(3)));
  }

  useEffect(() => {
    if (!focusTarget || !mapRef.current) {
      return;
    }

    const focusKey = `${focusTarget.lat}:${focusTarget.lng}`;

    if (previousFocus.current === focusKey) {
      return;
    }

    previousFocus.current = focusKey;
    if (selectedExpedition && selectedExpedition.destinations.length > 1) {
      const bounds = selectedExpedition.destinations.reduce(
        (accumulator, destination) => {
          accumulator.minLng = Math.min(accumulator.minLng, destination.lng);
          accumulator.maxLng = Math.max(accumulator.maxLng, destination.lng);
          accumulator.minLat = Math.min(accumulator.minLat, destination.lat);
          accumulator.maxLat = Math.max(accumulator.maxLat, destination.lat);
          return accumulator;
        },
        {
          minLng: Infinity,
          maxLng: -Infinity,
          minLat: Infinity,
          maxLat: -Infinity
        }
      );

      mapRef.current.fitBounds(
        [
          [bounds.minLng, bounds.minLat],
          [bounds.maxLng, bounds.maxLat]
        ],
        {
          duration: 1800,
          essential: true,
          padding: getMapPadding(leftPanelCollapsed, rightPanelCollapsed, searchPanelCollapsed, mobileDetailSheetMode),
          maxZoom: 9.8
        }
      );
      return;
    }

    mapRef.current.flyTo({
      center: [focusTarget.lng, focusTarget.lat],
      duration: 1800,
      essential: true,
      padding: getMapPadding(leftPanelCollapsed, rightPanelCollapsed, searchPanelCollapsed, mobileDetailSheetMode),
      zoom: Math.max(mapRef.current.getZoom(), 10.2)
    });
  }, [focusTarget, leftPanelCollapsed, mobileDetailSheetMode, rightPanelCollapsed, searchPanelCollapsed, selectedExpedition]);

  const routeSegments = useMemo(
    () =>
      selectedExpedition
        ? buildRouteSegments(selectedExpedition)
        : [],
    [selectedExpedition]
  );

  const routeGeoJson =
    routeSegments.length > 0
      ? {
          type: "FeatureCollection" as const,
          features: routeSegments.map((segment) => ({
            type: "Feature" as const,
            geometry: {
              type: "LineString" as const,
              coordinates: segment.path
            },
            properties: {
              mode: segment.mode,
              segmentIndex: segment.segmentIndex
            }
          }))
        }
      : null;

  const transportMarkers = useMemo(
    () =>
      routeSegments
        .map((segment) => ({
          arrowBearing: segment.arrowBearing,
          arrowLat: segment.arrowLat,
          arrowLng: segment.arrowLng,
          destinationId: segment.destinationId,
          journeyNumber: segment.segmentIndex + 1,
          lat: segment.markerLat,
          lng: segment.markerLng,
          mode: segment.mode,
          from: segment.from,
          to: segment.to,
          segment: segment.segment
        })),
    [routeSegments]
  );
  const hoveredTransport =
    transportMarkers.find((item) => item.destinationId === hoveredTransportDestinationId) ?? null;
  const transportScale = getTransportScale(mapZoom);

  return (
    <div className="absolute inset-0">
      <Map
        attributionControl={{ compact: true }}
        dragRotate={true}
        initialViewState={INITIAL_VIEW_STATE}
        mapLib={import("maplibre-gl")}
        mapStyle={MAP_STYLE}
        maxPitch={45}
        maxZoom={MAP_MAX_ZOOM}
        minZoom={MAP_MIN_ZOOM}
        projection="globe"
        ref={mapRef}
        renderWorldCopies={false}
        sky={MAP_SKY}
        style={{ height: "100%", width: "100%" }}
        onMove={(event) => {
          syncMapZoom(event.viewState.zoom);
        }}
        onMoveEnd={(event) => {
          syncMapZoom(event.viewState.zoom);
        }}
        onZoom={(event) => {
          syncMapZoom(event.viewState.zoom);
        }}
        onZoomEnd={(event) => {
          syncMapZoom(event.viewState.zoom);
        }}
        onLoad={() => {
          mapRef.current?.getMap().setProjection({ type: "globe" });
          syncMapZoom(mapRef.current?.getZoom() ?? INITIAL_VIEW_STATE.zoom);
        }}
        onClick={(event) => {
          if (!addMode) {
            return;
          }

          onMapPlace({
            lat: event.lngLat.lat,
            lng: event.lngLat.lng
          });
        }}
      >
        {routeGeoJson ? (
          <Source data={routeGeoJson} id="selected-expedition-route" type="geojson">
            {(Object.entries(TRANSPORT_ROUTE_META) as Array<[TransportMode, (typeof TRANSPORT_ROUTE_META)[TransportMode]]>).map(
              ([mode, meta]) => (
                <Layer
                  filter={["==", ["get", "mode"], mode]}
                  id={`selected-expedition-route-casing-${mode}`}
                  key={`route-casing-${mode}`}
                  layout={{
                    "line-cap": "round",
                    "line-join": "round"
                  }}
                  paint={{
                    "line-blur": 0.25,
                    "line-color": meta.casingColor,
                    "line-dasharray": meta.dashArray,
                    "line-opacity": 0.64,
                    "line-width": 8
                  }}
                  type="line"
                />
              )
            )}
            {(Object.entries(TRANSPORT_ROUTE_META) as Array<[TransportMode, (typeof TRANSPORT_ROUTE_META)[TransportMode]]>).map(
              ([mode, meta]) => (
                <Layer
                  filter={["==", ["get", "mode"], mode]}
                  id={`selected-expedition-route-line-${mode}`}
                  key={`route-line-${mode}`}
                  layout={{
                    "line-cap": "round",
                    "line-join": "round"
                  }}
                  paint={{
                    "line-blur": 0.18,
                    "line-color": meta.lineColor,
                    "line-dasharray": meta.dashArray,
                    "line-opacity": 0.9,
                    "line-width": 4.3
                  }}
                  type="line"
                />
              )
            )}
          </Source>
        ) : null}

        {transportMarkers.map((marker) => {
          const routeMeta = TRANSPORT_ROUTE_META[marker.mode];

          return (
            <Marker
              anchor="center"
              key={`transport-arrow-${marker.destinationId}`}
              latitude={marker.arrowLat}
              longitude={marker.arrowLng}
            >
              <div
                className={`pointer-events-none flex size-8 items-center justify-center rounded-full border shadow-[0_10px_20px_rgba(0,0,0,0.28)] ${routeMeta.arrowClassName}`}
                style={{ transform: `rotate(${marker.arrowBearing}deg) scale(${Math.max(0.42, transportScale * 0.8)})` }}
              >
                <Navigation className="size-4" />
              </div>
            </Marker>
          );
        })}

        {transportMarkers.map((marker) => {
          const routeMeta = TRANSPORT_ROUTE_META[marker.mode];

          return (
            <Marker
              anchor="center"
              key={`transport-${marker.destinationId}`}
              latitude={marker.lat}
              longitude={marker.lng}
            >
              <button
                className={`group relative flex size-[3.8rem] items-center justify-center rounded-[1.55rem] border shadow-[0_16px_30px_rgba(0,0,0,0.34)] backdrop-blur-xl transition hover:brightness-110 ${routeMeta.buttonClassName}`}
                onClick={(event) => {
                  event.stopPropagation();
                  onEditTransport(marker.destinationId);
                }}
                onMouseEnter={() => setHoveredTransportDestinationId(marker.destinationId)}
                onMouseLeave={() => setHoveredTransportDestinationId((current) => (current === marker.destinationId ? null : current))}
                style={{ transform: `scale(${transportScale})`, transformOrigin: "center center" }}
                type="button"
              >
                <span className="pointer-events-none absolute inset-[2px] rounded-[1.4rem] border border-white/12 opacity-55" />
                <TransportIcon mode={marker.mode} />
                <span className={`absolute -right-1.5 -top-1.5 inline-flex min-w-6 items-center justify-center rounded-full border px-1.5 text-[0.66rem] font-semibold leading-6 shadow-[0_6px_12px_rgba(0,0,0,0.28)] ${routeMeta.badgeClassName}`}>
                  {marker.journeyNumber}
                </span>
              </button>
            </Marker>
          );
        })}

        {hoveredTransport ? (
          <Popup
            anchor="top"
            className="[&_.maplibregl-popup-content]:rounded-[18px] [&_.maplibregl-popup-content]:border [&_.maplibregl-popup-content]:border-white/10 [&_.maplibregl-popup-content]:bg-[#061521]/95 [&_.maplibregl-popup-content]:p-0 [&_.maplibregl-popup-content]:shadow-panel [&_.maplibregl-popup-tip]:border-t-[#061521]/95"
            closeButton={false}
            closeOnClick={false}
            latitude={hoveredTransport.lat}
            longitude={hoveredTransport.lng}
            offset={24}
            onClose={() => setHoveredTransportDestinationId(null)}
          >
            <div className="w-72 p-4">
              <div className="flex items-center gap-2">
                <span className={`inline-flex rounded-full border px-3 py-1 text-[0.68rem] uppercase tracking-[0.22em] ${TRANSPORT_MODE_META[hoveredTransport.mode].accentClassName}`}>
                  {getTransportModeLabel(hoveredTransport.mode, language)}
                </span>
                <span className="inline-flex rounded-full border border-white/8 bg-white/6 px-2 py-1 text-[0.68rem] uppercase tracking-[0.18em] text-white/68">
                  {t("map.leg", { number: hoveredTransport.journeyNumber })}
                </span>
                <span className="text-xs uppercase tracking-[0.18em] text-white/38">
                  {hoveredTransport.from.city || hoveredTransport.from.title} {t("map.to")} {hoveredTransport.to.city || hoveredTransport.to.title}
                </span>
              </div>
              <p className="mt-3 font-display text-xl text-white">
                {hoveredTransport.segment?.name || t("map.transferDetailsNotSet")}
              </p>
              <p className="mt-2 text-sm text-white/68">
                {hoveredTransport.segment?.departureTime || t("map.timeNotSet")}
              </p>
              <p className="mt-1 text-sm text-white/68">
                {hoveredTransport.segment?.duration || t("map.durationNotSet")}
              </p>
              {hoveredTransport.segment?.notes ? (
                <p className="mt-3 text-sm leading-6 text-white/58">{hoveredTransport.segment.notes}</p>
              ) : null}
            </div>
          </Popup>
        ) : null}

        {destinations.map((destination) => (
          <Marker
            anchor="center"
            key={destination.id}
            latitude={destination.lat}
            longitude={destination.lng}
          >
            <DestinationMarker
              destination={destination}
              isSelected={selectedId === destination.id}
              onSelect={onSelectDestination}
            />
          </Marker>
        ))}

        {draftCoordinates ? (
          <Marker
            anchor="center"
            latitude={draftCoordinates.lat}
            longitude={draftCoordinates.lng}
          >
            <div className="relative flex size-10 items-center justify-center">
              <div className="absolute size-10 animate-ping rounded-full bg-white/20" />
              <div className="relative size-4 rounded-full border-2 border-white bg-lime-300 shadow-[0_0_24px_rgba(190,242,100,0.42)]" />
            </div>
          </Marker>
        ) : null}
      </Map>

      <div
        className={cn(
          "pointer-events-none absolute right-3 z-20 flex flex-col gap-2 sm:right-4 lg:bottom-6 lg:left-6 lg:right-auto xl:bottom-8",
          rightPanelCollapsed
            ? "bottom-24 sm:bottom-28"
            : mobileDetailSheetMode === "full"
              ? "bottom-[33rem] sm:bottom-[36rem]"
              : "bottom-[18rem] sm:bottom-[21rem]",
          leftPanelCollapsed ? "xl:left-6" : "xl:left-[27.5rem]"
        )}
      >
        <button
          className="pointer-events-auto flex size-11 items-center justify-center rounded-2xl border border-emerald-950/70 bg-[#08120a]/96 text-white shadow-[0_18px_44px_rgba(0,0,0,0.42)] backdrop-blur-xl transition hover:border-emerald-700/55 hover:bg-[#102014] md:size-12"
          onClick={() => {
            const map = mapRef.current;

            if (!map) {
              return;
            }

            map.easeTo({
              duration: 240,
              zoom: Math.min(map.getZoom() + 1, MAP_MAX_ZOOM)
            });
          }}
          type="button"
        >
          <Plus className="size-4" />
          <span className="sr-only">{t("map.zoomIn")}</span>
        </button>
        <button
          className="pointer-events-auto flex size-11 items-center justify-center rounded-2xl border border-emerald-950/70 bg-[#08120a]/96 text-white shadow-[0_18px_44px_rgba(0,0,0,0.42)] backdrop-blur-xl transition hover:border-emerald-700/55 hover:bg-[#102014] md:size-12"
          onClick={() => {
            const map = mapRef.current;

            if (!map) {
              return;
            }

            map.easeTo({
              duration: 240,
              zoom: Math.max(map.getZoom() - 1, MAP_MIN_ZOOM)
            });
          }}
          type="button"
        >
          <Minus className="size-4" />
          <span className="sr-only">{t("map.zoomOut")}</span>
        </button>
      </div>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(73,198,199,0.14),transparent_28%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#020712]/84 via-[#020712]/28 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#020712]/68 via-[#020712]/18 to-transparent" />
    </div>
  );
}

function TransportIcon({ mode }: { mode: TransportMode }) {
  if (mode === "flight") {
    return (
      <svg aria-hidden="true" className="size-9 drop-shadow-[0_4px_6px_rgba(0,0,0,0.22)]" viewBox="0 0 64 64">
        <path
          d="M9 33.2L27.5 28.8L36.8 10.5C37.7 8.8 39.5 7.7 41.5 7.7C44.5 7.7 46.8 10.4 46.3 13.4L42.8 29.4L55 34.2C56.9 35 58.1 36.8 58.1 38.9C58.1 41.2 56.7 43.3 54.6 44L42.2 48.3L45 56.2L40.1 58.8L31.9 50.1L23.2 55.6L19.6 52.1L24.6 43.8L14 40.7L9 33.2Z"
          fill="#22C55E"
          stroke="#F0FDF4"
          strokeLinejoin="round"
          strokeWidth="1.9"
        />
        <path
          d="M40.8 12.5L37.8 29.5L50.6 34.6L38.9 38.9L41.2 51.7L31.8 44.2L23.8 49.3L28.2 39.6L17.7 36.7L29.9 33.3L40.8 12.5Z"
          fill="#166534"
          opacity="0.28"
        />
        <path d="M29.8 31.9L45.4 26.9" opacity="0.8" stroke="#ECFDF5" strokeLinecap="round" strokeWidth="1.5" />
        <path d="M28.6 41.2L38.1 47.8" opacity="0.8" stroke="#ECFDF5" strokeLinecap="round" strokeWidth="1.5" />
      </svg>
    );
  }

  if (mode === "drive") {
    return (
      <svg aria-hidden="true" className="size-9 drop-shadow-[0_4px_6px_rgba(0,0,0,0.22)]" viewBox="0 0 64 64">
        <circle cx="19" cy="45" fill="#0f172a" r="6.5" />
        <circle cx="45" cy="45" fill="#0f172a" r="6.5" />
        <circle cx="19" cy="45" fill="#e2e8f0" r="3" />
        <circle cx="45" cy="45" fill="#e2e8f0" r="3" />
        <path
          d="M10 31.8L17.8 21.2C18.9 19.7 20.6 18.8 22.5 18.8H39.4C41.1 18.8 42.7 19.5 43.9 20.6L49.9 26.1L55.2 27.4C58.5 28.2 60.8 31.2 60.8 34.6V41.2H8.4V35.1C8.4 33.9 8.9 32.7 10 31.8Z"
          fill="#D8DEE7"
          stroke="#F8FAFC"
          strokeLinejoin="round"
          strokeWidth="1.9"
        />
        <path d="M18.3 21.4H38.8C40.4 21.4 41.8 22 43 23.2L46.8 26.8H15.4L18.3 21.4Z" fill="#94A3B8" opacity="0.52" />
        <path d="M15.5 27H46.6" stroke="#64748B" strokeLinecap="round" strokeWidth="2.1" />
        <path d="M23.6 18.4L28.8 14.6H40.9" stroke="#F8FAFC" strokeLinecap="round" strokeWidth="1.6" />
        <path d="M12.3 32.1H56.7" opacity="0.22" stroke="#FFFFFF" strokeLinecap="round" strokeWidth="1.6" />
        <path d="M32.1 22.6V27" stroke="#475569" strokeLinecap="round" strokeWidth="1.4" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" className="size-9 drop-shadow-[0_4px_6px_rgba(0,0,0,0.22)]" viewBox="0 0 64 64">
      <path d="M13 39H55L49 48H26C20 48 15.4 44.5 13 39Z" fill="#2563EB" stroke="#DBEAFE" strokeLinejoin="round" strokeWidth="2" />
      <path d="M25 21H39L46 32H22L25 21Z" fill="#EFF6FF" stroke="#DBEAFE" strokeLinejoin="round" strokeWidth="2" />
      <path d="M31.5 15V32" stroke="#DBEAFE" strokeLinecap="round" strokeWidth="2" />
      <path d="M24 31.5H46" stroke="#93C5FD" strokeLinecap="round" strokeWidth="1.8" opacity="0.8" />
      <path d="M13 52C16 50.5 18.8 50.5 21.8 52C24.8 53.5 27.6 53.5 30.6 52C33.6 50.5 36.4 50.5 39.4 52C42.4 53.5 45.2 53.5 48.2 52C51.2 50.5 54 50.5 57 52" stroke="#93C5FD" strokeLinecap="round" strokeWidth="2.2" />
      <path d="M16 39H52L47 45H26.5C22 45 18.2 42.8 16 39Z" fill="#FFFFFF" opacity="0.14" />
    </svg>
  );
}

function getTransportScale(zoom: number) {
  const minScale = 0.18;
  const maxScale = 1;
  const normalized = Math.max(0, Math.min(1, (zoom - 2.2) / 6.2));
  const eased = normalized ** 1.35;
  return Math.max(minScale, Math.min(maxScale, eased * (maxScale - minScale) + minScale));
}

function getMapPadding(
  leftPanelCollapsed: boolean,
  rightPanelCollapsed: boolean,
  searchPanelCollapsed: boolean,
  mobileDetailSheetMode: "half" | "full"
) {
  if (typeof window === "undefined") {
    return {
      top: 156,
      right: 28,
      bottom: 88,
      left: 28
    };
  }

  if (window.innerWidth < 1024) {
    const bottomSheetOpen = !rightPanelCollapsed;
    const safeBottom = 24;

    return {
      top: 144,
      right: (searchPanelCollapsed ? 18 : 250),
      bottom: (bottomSheetOpen ? (mobileDetailSheetMode === "full" ? 520 : 290) : 110) + safeBottom,
      left: leftPanelCollapsed ? 18 : 244
    };
  }

  return {
    top: 156,
    right: window.innerWidth >= 1024 ? (rightPanelCollapsed ? 72 : 500) : 28,
    bottom: 88,
    left: window.innerWidth >= 1280 ? (leftPanelCollapsed ? 72 : 430) : 28
  };
}

function buildRouteSegments(selectedExpedition: TimelineExpedition) {
  const rawSegments = selectedExpedition.destinations.slice(1).map((destination, index) => {
    const from = selectedExpedition.destinations[index];
    const segment = destination.transportFromPrevious;
    const mode = segment?.mode || (selectedExpedition.waterType === "saltwater" ? "boat" : "drive");

    return {
      destinationId: destination.id,
      from,
      mode,
      segment,
      segmentIndex: index,
      to: destination
    };
  });
  const groupedSegments = new globalThis.Map<string, number[]>();

  rawSegments.forEach((segment, index) => {
    const key = getSegmentPairKey(segment.from, segment.to);
    const bucket = groupedSegments.get(key) ?? [];

    bucket.push(index);
    groupedSegments.set(key, bucket);
  });

  const offsetByIndex = new globalThis.Map<number, number>();

  groupedSegments.forEach((indices) => {
    const offsets = getOffsetSteps(indices.length);

    indices.forEach((segmentIndex, offsetIndex) => {
      offsetByIndex.set(segmentIndex, offsets[offsetIndex] ?? 0);
    });
  });

  return rawSegments.map((segment, index) => {
    const curve = buildCurvedSegment(segment.from, segment.to, offsetByIndex.get(index) ?? 0);

    return {
      ...curve,
      ...segment,
    };
  });
}

function getSegmentPairKey(from: Pick<Destination, "lat" | "lng">, to: Pick<Destination, "lat" | "lng">) {
  const start = `${from.lng.toFixed(3)}:${from.lat.toFixed(3)}`;
  const end = `${to.lng.toFixed(3)}:${to.lat.toFixed(3)}`;

  return [start, end].sort().join("|");
}

function getOffsetSteps(count: number) {
  return Array.from({ length: count }, (_, index) => (index - (count - 1) / 2) * 2);
}

function buildCurvedSegment(
  from: Pick<Destination, "lat" | "lng">,
  to: Pick<Destination, "lat" | "lng">,
  offsetStep: number
) {
  const deltaLng = to.lng - from.lng;
  const deltaLat = to.lat - from.lat;
  const distance = Math.hypot(deltaLng, deltaLat);

  if (distance < 0.0001) {
    return {
      arrowBearing: 0,
      arrowLat: from.lat,
      arrowLng: from.lng,
      markerLat: from.lat,
      markerLng: from.lng,
      path: [
        [from.lng, from.lat],
        [to.lng, to.lat]
      ] as Array<[number, number]>
    };
  }

  const normalLng = -deltaLat / distance;
  const normalLat = deltaLng / distance;
  const curveOffset = Math.min(distance * 0.14 * Math.abs(offsetStep), 10) * Math.sign(offsetStep);
  const controlLng = (from.lng + to.lng) / 2 + normalLng * curveOffset;
  const controlLat = (from.lat + to.lat) / 2 + normalLat * curveOffset;
  const path = Array.from({ length: 25 }, (_, step) => {
    const t = step / 24;
    const lng =
      (1 - t) * (1 - t) * from.lng +
      2 * (1 - t) * t * controlLng +
      t * t * to.lng;
    const lat =
      (1 - t) * (1 - t) * from.lat +
      2 * (1 - t) * t * controlLat +
      t * t * to.lat;

    return [lng, lat] as [number, number];
  });
  const markerT = 0.5;
  const arrowT = 0.68;
  const bearingT1 = 0.62;
  const bearingT2 = 0.74;
  const markerLng =
    (1 - markerT) * (1 - markerT) * from.lng +
    2 * (1 - markerT) * markerT * controlLng +
    markerT * markerT * to.lng;
  const markerLat =
    (1 - markerT) * (1 - markerT) * from.lat +
    2 * (1 - markerT) * markerT * controlLat +
    markerT * markerT * to.lat;
  const arrowLng =
    (1 - arrowT) * (1 - arrowT) * from.lng +
    2 * (1 - arrowT) * arrowT * controlLng +
    arrowT * arrowT * to.lng;
  const arrowLat =
    (1 - arrowT) * (1 - arrowT) * from.lat +
    2 * (1 - arrowT) * arrowT * controlLat +
    arrowT * arrowT * to.lat;
  const bearingPointA = getQuadraticBezierPoint(from, { lat: controlLat, lng: controlLng }, to, bearingT1);
  const bearingPointB = getQuadraticBezierPoint(from, { lat: controlLat, lng: controlLng }, to, bearingT2);
  const arrowBearing = getBearingDegrees(bearingPointA, bearingPointB);

  return {
    arrowBearing,
    arrowLat,
    arrowLng,
    markerLat,
    markerLng,
    path
  };
}

function getQuadraticBezierPoint(
  from: Pick<Destination, "lat" | "lng">,
  control: Pick<Destination, "lat" | "lng">,
  to: Pick<Destination, "lat" | "lng">,
  t: number
) {
  return {
    lng:
      (1 - t) * (1 - t) * from.lng +
      2 * (1 - t) * t * control.lng +
      t * t * to.lng,
    lat:
      (1 - t) * (1 - t) * from.lat +
      2 * (1 - t) * t * control.lat +
      t * t * to.lat
  };
}

function getBearingDegrees(
  from: Pick<Destination, "lat" | "lng">,
  to: Pick<Destination, "lat" | "lng">
) {
  return (Math.atan2(to.lng - from.lng, from.lat - to.lat) * 180) / Math.PI;
}
