"use client";

import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";

import Map, { Layer, Marker, Popup, Source, type MapRef } from "@vis.gl/react-maplibre";
import { CarFront, Minus, Navigation, Plane, Plus, ShipWheel } from "lucide-react";

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
  onEditTransport: (destinationId: string) => void;
  onMapPlace: (coordinates: { lat: number; lng: number }) => void;
  onSelectDestination: (id: string) => void;
  rightPanelCollapsed: boolean;
  searchPanelCollapsed: boolean;
  selectedExpedition: TimelineExpedition | null;
  selectedId: string | null;
};

const transportIcons = {
  flight: Plane,
  boat: ShipWheel,
  drive: CarFront
} satisfies Record<TransportMode, ComponentType<{ className?: string }>>;

export function WorldMap({
  addMode,
  destinations,
  draftCoordinates,
  focusTarget,
  leftPanelCollapsed,
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
  const { language, t } = useLanguage();

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
          padding: getMapPadding(leftPanelCollapsed, rightPanelCollapsed, searchPanelCollapsed),
          maxZoom: 9.8
        }
      );
      return;
    }

    mapRef.current.flyTo({
      center: [focusTarget.lng, focusTarget.lat],
      duration: 1800,
      essential: true,
      padding: getMapPadding(leftPanelCollapsed, rightPanelCollapsed, searchPanelCollapsed),
      zoom: Math.max(mapRef.current.getZoom(), 10.2)
    });
  }, [focusTarget, leftPanelCollapsed, rightPanelCollapsed, searchPanelCollapsed, selectedExpedition]);

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
        onLoad={() => {
          mapRef.current?.getMap().setProjection({ type: "globe" });
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
            <Layer
              id="selected-expedition-route-casing"
              paint={{
                "line-color": "rgba(255,255,255,0.24)",
                "line-opacity": 0.4,
                "line-width": 8
              }}
              type="line"
            />
            <Layer
              id="selected-expedition-route-line"
              paint={{
                "line-color":
                  selectedExpedition?.waterType === "freshwater" ? "#84cc16" : "#22c55e",
                "line-opacity": 0.82,
                "line-width": 4,
                "line-blur": 0.4
              }}
              type="line"
            />
          </Source>
        ) : null}

        {transportMarkers.map((marker) => (
          <Marker
            anchor="center"
            key={`transport-arrow-${marker.destinationId}`}
            latitude={marker.arrowLat}
            longitude={marker.arrowLng}
          >
            <div
              className="pointer-events-none flex size-7 items-center justify-center rounded-full border border-emerald-900/60 bg-[#08140a]/92 text-emerald-100 shadow-[0_10px_20px_rgba(0,0,0,0.3)]"
              style={{ transform: `rotate(${marker.arrowBearing}deg)` }}
            >
              <Navigation className="size-3.5" />
            </div>
          </Marker>
        ))}

        {transportMarkers.map((marker) => {
          const Icon = transportIcons[marker.mode];

          return (
            <Marker
              anchor="center"
              key={`transport-${marker.destinationId}`}
              latitude={marker.lat}
              longitude={marker.lng}
            >
              <button
                className="group relative flex size-11 items-center justify-center rounded-full border border-white/12 bg-[#05131f]/88 text-white shadow-[0_12px_24px_rgba(0,0,0,0.34)] backdrop-blur-xl transition hover:scale-105 hover:border-white/22"
                onClick={(event) => {
                  event.stopPropagation();
                  onEditTransport(marker.destinationId);
                }}
                onMouseEnter={() => setHoveredTransportDestinationId(marker.destinationId)}
                onMouseLeave={() => setHoveredTransportDestinationId((current) => (current === marker.destinationId ? null : current))}
                type="button"
              >
                <Icon className="size-4" />
                <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full border border-emerald-800/40 bg-[#102014] px-1 text-[0.62rem] font-semibold leading-5 text-white">
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
          rightPanelCollapsed ? "bottom-24 sm:bottom-28" : "bottom-[23rem] sm:bottom-[25rem]",
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

function getMapPadding(leftPanelCollapsed: boolean, rightPanelCollapsed: boolean, searchPanelCollapsed: boolean) {
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
      bottom: (bottomSheetOpen ? 360 : 110) + safeBottom,
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
