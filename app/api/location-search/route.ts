import { NextRequest, NextResponse } from "next/server";

import type { LocationSuggestion } from "@/lib/types";

export const dynamic = "force-dynamic";

const MAPTILER_API_KEY =
  process.env.MAPTILER_API_KEY || process.env.NEXT_PUBLIC_MAPTILER_API_KEY || "";

const PLACE_TYPES = ["municipality", "locality", "place", "county", "region", "country"].join(",");

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim();

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] satisfies LocationSuggestion[] });
  }

  try {
    const results = MAPTILER_API_KEY
      ? await searchMapTiler(query)
      : await searchNominatim(query);

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [] satisfies LocationSuggestion[] });
  }
}

async function searchMapTiler(query: string) {
  const params = new URLSearchParams({
    key: MAPTILER_API_KEY,
    language: "en",
    autocomplete: "true",
    limit: "6",
    types: PLACE_TYPES
  });
  const response = await fetch(
    `https://api.maptiler.com/geocoding/${encodeURIComponent(query)}.json?${params.toString()}`,
    {
      headers: {
        Accept: "application/json"
      },
      next: { revalidate: 0 }
    }
  );

  if (!response.ok) {
    throw new Error("MapTiler search failed");
  }

  const payload = await response.json();
  return (payload.features ?? [])
    .map((feature: MapTilerFeature) => normalizeMapTilerFeature(feature))
    .filter(Boolean)
    .slice(0, 6) as LocationSuggestion[];
}

async function searchNominatim(query: string) {
  const params = new URLSearchParams({
    q: query,
    format: "jsonv2",
    addressdetails: "1",
    limit: "6"
  });
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?${params.toString()}`,
    {
      headers: {
        Accept: "application/json",
        "Accept-Language": "en",
        "User-Agent": "FishingTravelPlanner/0.1"
      },
      next: { revalidate: 0 }
    }
  );

  if (!response.ok) {
    throw new Error("Nominatim search failed");
  }

  const payload = await response.json();
  return (payload ?? [])
    .map((item: NominatimResult) => normalizeNominatimResult(item))
    .filter(Boolean)
    .slice(0, 6) as LocationSuggestion[];
}

function normalizeMapTilerFeature(feature: MapTilerFeature): LocationSuggestion | null {
  const center = feature.center || feature.geometry?.coordinates;

  if (!center || center.length < 2) {
    return null;
  }

  const city =
    feature.text?.trim() ||
    getMapTilerContextText(feature, "municipality") ||
    getMapTilerContextText(feature, "locality") ||
    getMapTilerContextText(feature, "place");
  const region =
    getMapTilerContextText(feature, "region") ||
    getMapTilerContextText(feature, "subregion") ||
    getMapTilerContextText(feature, "county");
  const country =
    getMapTilerContextText(feature, "country") || feature.place_name?.split(",").pop()?.trim();
  const name = city || feature.place_name?.split(",")[0]?.trim();

  if (!name) {
    return null;
  }

  return {
    id: String(feature.id || feature.place_name || `${center[0]},${center[1]}`),
    name,
    city: city || name,
    region,
    country,
    label: feature.place_name?.trim() || [name, region, country].filter(Boolean).join(", "),
    lat: Number(center[1]),
    lng: Number(center[0]),
    source: "maptiler"
  };
}

function normalizeNominatimResult(result: NominatimResult): LocationSuggestion | null {
  const lat = Number(result.lat);
  const lng = Number(result.lon);

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return null;
  }

  const city =
    result.address?.city ||
    result.address?.town ||
    result.address?.village ||
    result.address?.hamlet ||
    result.address?.municipality;
  const region =
    result.address?.state ||
    result.address?.region ||
    result.address?.county;
  const country = result.address?.country;
  const name = result.name || city || result.display_name?.split(",")[0]?.trim();

  if (!name) {
    return null;
  }

  return {
    id: String(result.place_id),
    name,
    city: city || name,
    region,
    country,
    label: result.display_name || [name, region, country].filter(Boolean).join(", "),
    lat,
    lng,
    source: "nominatim"
  };
}

function getMapTilerContextText(feature: MapTilerFeature, prefix: string) {
  return feature.context?.find((item) => item.id?.startsWith(`${prefix}.`))?.text;
}

type MapTilerFeature = {
  id?: string;
  text?: string;
  place_name?: string;
  center?: [number, number];
  geometry?: {
    coordinates?: [number, number];
  };
  context?: Array<{
    id?: string;
    text?: string;
  }>;
};

type NominatimResult = {
  place_id: string | number;
  lat: string;
  lon: string;
  name?: string;
  display_name?: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    hamlet?: string;
    municipality?: string;
    county?: string;
    region?: string;
    state?: string;
    country?: string;
  };
};
