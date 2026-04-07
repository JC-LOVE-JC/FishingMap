import type {
  Destination,
  DestinationStatus,
  PhotoItem,
  TimelineExpedition,
  TransportMode,
  TransportSegment,
  WaterType
} from "@/lib/types";

export const STATUS_ORDER: DestinationStatus[] = ["planned", "visited"];

export const STORAGE_KEY = "fishing-travel-planner.destinations.v6";

export const STATUS_META: Record<
  DestinationStatus,
  {
    label: string;
    badgeClassName: string;
    markerCore: string;
    markerGlow: string;
    markerShell: string;
  }
> = {
  planned: {
    label: "Planned",
    badgeClassName: "bg-gold-500/14 text-gold-100 border-gold-400/18",
    markerCore: "bg-gold-300 shadow-[0_0_18px_rgba(242,214,162,0.72)]",
    markerGlow: "bg-gold-500/34",
    markerShell: "border-gold-300/60 bg-gold-500/20"
  },
  visited: {
    label: "Visited",
    badgeClassName: "bg-emerald-500/14 text-emerald-100 border-emerald-400/20",
    markerCore: "bg-emerald-300 shadow-[0_0_18px_rgba(74,222,128,0.58)]",
    markerGlow: "bg-emerald-500/26",
    markerShell: "border-emerald-300/50 bg-emerald-500/18"
  }
};

export const WATER_TYPE_META: Record<
  WaterType,
  {
    label: string;
    badgeClassName: string;
    panelClassName: string;
    haloClassName: string;
  }
> = {
  saltwater: {
    label: "Saltwater",
    badgeClassName: "bg-sky-950/85 text-sky-100 border-sky-800/60",
    panelClassName:
      "border-sky-950/70 bg-[linear-gradient(145deg,rgba(5,16,34,0.99),rgba(2,8,18,0.98))]",
    haloClassName: "bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.2),transparent_52%)]"
  },
  freshwater: {
    label: "Freshwater",
    badgeClassName: "bg-emerald-950/85 text-emerald-100 border-emerald-900/60",
    panelClassName:
      "border-emerald-950/70 bg-[linear-gradient(145deg,rgba(7,24,15,0.99),rgba(3,12,7,0.98))]",
    haloClassName: "bg-[radial-gradient(circle_at_top,rgba(22,101,52,0.2),transparent_52%)]"
  },
  urban: {
    label: "Urban",
    badgeClassName: "bg-slate-800/88 text-slate-100 border-slate-500/45",
    panelClassName:
      "border-slate-700/70 bg-[linear-gradient(145deg,rgba(28,33,39,0.99),rgba(9,12,16,0.98))]",
    haloClassName: "bg-[radial-gradient(circle_at_top,rgba(203,213,225,0.14),transparent_52%)]"
  }
};

export const TRANSPORT_MODE_META: Record<
  TransportMode,
  {
    label: string;
    accentClassName: string;
  }
> = {
  flight: {
    label: "Flight",
    accentClassName: "bg-sky-500/12 text-sky-100 border-sky-300/20"
  },
  boat: {
    label: "Boat",
    accentClassName: "bg-cyan-500/12 text-cyan-100 border-cyan-300/20"
  },
  drive: {
    label: "Drive",
    accentClassName: "bg-amber-500/12 text-amber-100 border-amber-300/20"
  }
};

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function splitList(input: string) {
  return input
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function joinList(items: string[] = []) {
  return items.join(", ");
}

export function formatLocation(
  destination: Pick<Destination, "city" | "country" | "region">
) {
  return [destination.city, destination.region, destination.country].filter(Boolean).join(", ");
}

export function formatDateRange(
  destination: Pick<Destination, "startDate" | "endDate" | "tripDate">,
  locale = "en-US"
) {
  if (!destination.startDate && !destination.endDate) {
    return destination.tripDate || "Date not set";
  }

  if (destination.startDate && destination.endDate) {
    const sameMonth =
      destination.startDate.slice(0, 7) === destination.endDate.slice(0, 7);
    const sameYear =
      destination.startDate.slice(0, 4) === destination.endDate.slice(0, 4);

    const start = new Date(`${destination.startDate}T00:00:00`);
    const end = new Date(`${destination.endDate}T00:00:00`);

    if (sameMonth) {
      return `${start.toLocaleDateString(locale, {
        month: "short",
        day: "numeric"
      })} - ${end.toLocaleDateString(locale, {
        day: "numeric",
        year: "numeric"
      })}`;
    }

    if (sameYear) {
      return `${start.toLocaleDateString(locale, {
        month: "short",
        day: "numeric"
      })} - ${end.toLocaleDateString(locale, {
        month: "short",
        day: "numeric",
        year: "numeric"
      })}`;
    }

    return `${start.toLocaleDateString(locale, {
      month: "short",
      day: "numeric",
      year: "numeric"
    })} - ${end.toLocaleDateString(locale, {
      month: "short",
      day: "numeric",
      year: "numeric"
    })}`;
  }

  const single = new Date(`${destination.startDate || destination.endDate}T00:00:00`);

  return single.toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

export function getDestinationSortTime(destination: Pick<Destination, "startDate" | "endDate" | "createdAt">) {
  const source = destination.startDate || destination.endDate || destination.createdAt;
  return new Date(source).getTime();
}

export function buildTimelineSections(destinations: Destination[], now = new Date()) {
  const byExpedition = new Map<string, Destination[]>();

  for (const destination of destinations) {
    const expeditionId = getExpeditionId(destination);
    const existing = byExpedition.get(expeditionId) ?? [];
    existing.push(destination);
    byExpedition.set(expeditionId, existing);
  }

  const expeditions = [...byExpedition.entries()]
    .map(([id, items]) => buildExpedition(id, items, now))
    .sort((a, b) => getExpeditionSortTime(a) - getExpeditionSortTime(b));

  return [
    {
      id: "past",
      label: "Past Log",
      items: expeditions.filter((item) => item.phase === "past")
    },
    {
      id: "upcoming",
      label: "Upcoming Window",
      items: expeditions.filter((item) => item.phase === "upcoming")
    }
  ].filter((section) => section.items.length > 0);
}

export function inferWaterType(destination: Partial<Destination>): WaterType {
  const haystack = [
    destination.title ?? "",
    destination.region ?? "",
    destination.summary ?? "",
    destination.notes ?? "",
    ...(destination.tags ?? []),
    ...(destination.species ?? [])
  ]
    .join(" ")
    .toLowerCase();

  if (
    haystack.includes("river") ||
    haystack.includes("freshwater") ||
    haystack.includes("lake") ||
    haystack.includes("dorado") ||
    haystack.includes("trout") ||
    haystack.includes("pacu")
  ) {
    return "freshwater";
  }

  if (
    haystack.includes("city") ||
    haystack.includes("urban") ||
    haystack.includes("harbour") ||
    haystack.includes("harbor") ||
    haystack.includes("canal") ||
    haystack.includes("metropolitan")
  ) {
    return "urban";
  }

  return "saltwater";
}

export function createEmptyDestination(lat = 6, lng = 12): Destination {
  const now = new Date().toISOString();
  const startDate = now.slice(0, 10);
  const expeditionId = crypto.randomUUID();

  return {
    id: crypto.randomUUID(),
    title: "",
    expeditionId,
    expeditionName: "",
    stopOrder: 1,
    transportFromPrevious: null,
    city: "",
    country: "",
    region: "",
    lat,
    lng,
    status: "planned",
    waterType: "saltwater",
    season: "",
    startDate,
    endDate: startDate,
    tripDate: formatDateRange({
      startDate,
      endDate: startDate,
      tripDate: ""
    }),
    summary: "",
    notes: "",
    species: [],
    techniques: [],
    tags: [],
    photos: [],
    rating: 4,
    featured: false,
    createdAt: now,
    updatedAt: now
  };
}

export function normalizeDestination(destination: Destination): Destination {
  const startDate = destination.startDate ?? "";
  const endDate = destination.endDate ?? startDate;
  const expeditionId = destination.expeditionId ?? destination.id;

  return {
    ...destination,
    status: coerceStatus((destination as Destination & { status?: string }).status),
    expeditionId,
    expeditionName: destination.expeditionName ?? destination.title,
    stopOrder: destination.stopOrder ?? 1,
    transportFromPrevious: normalizeTransportSegment(destination.transportFromPrevious),
    city: destination.city ?? "",
    region: destination.region ?? "",
    waterType: coerceWaterType((destination as Destination & { waterType?: string }).waterType) ?? inferWaterType(destination),
    season: destination.season ?? "",
    startDate,
    endDate,
    tripDate:
      destination.tripDate ??
      formatDateRange({
        startDate,
        endDate,
        tripDate: ""
      }),
    summary: destination.summary ?? "",
    notes: destination.notes ?? "",
    species: destination.species ?? [],
    techniques: destination.techniques ?? [],
    tags: destination.tags ?? [],
    photos: (destination.photos ?? []).filter((photo) => photo.url.trim().length > 0),
    rating: destination.rating ?? 4,
    featured: Boolean(destination.featured)
  };
}

function coerceStatus(status?: string): DestinationStatus {
  if (status === "visited") {
    return "visited";
  }

  return "planned";
}

function coerceWaterType(waterType?: string): WaterType | null {
  if (waterType === "saltwater" || waterType === "freshwater" || waterType === "urban") {
    return waterType;
  }

  return null;
}

export function parseStoredDestinations(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as Destination[];

    if (!Array.isArray(parsed)) {
      return null;
    }

    return parsed.map(normalizeDestination);
  } catch {
    return null;
  }
}

export function toPhotoFromDataUrl(fileName: string, url: string): PhotoItem {
  return {
    id: crypto.randomUUID(),
    url,
    caption: fileName.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "),
    alt: fileName
  };
}

export function createEmptyTransportSegment(mode: TransportMode = "drive"): TransportSegment {
  return {
    id: crypto.randomUUID(),
    mode,
    name: "",
    departureTime: "",
    duration: "",
    notes: ""
  };
}

export function normalizeTransportSegment(
  segment: TransportSegment | null | undefined
): TransportSegment | null {
  if (!segment) {
    return null;
  }

  return {
    id: segment.id || crypto.randomUUID(),
    mode: segment.mode || "drive",
    name: segment.name ?? "",
    departureTime: segment.departureTime ?? "",
    duration: segment.duration ?? "",
    notes: segment.notes ?? ""
  };
}

export function formatTransportSummary(
  segment: TransportSegment | null | undefined,
  emptyLabel = "Transfer details not set"
) {
  if (!segment) {
    return emptyLabel;
  }

  const pieces = [segment.name, segment.departureTime, segment.duration].filter(Boolean);
  return pieces.length ? pieces.join(" · ") : emptyLabel;
}

export function getExpeditionId(destination: Pick<Destination, "expeditionId" | "id">) {
  return destination.expeditionId || destination.id;
}

export function getExpeditionSortTime(expedition: Pick<TimelineExpedition, "startDate" | "endDate">) {
  return new Date(expedition.startDate || expedition.endDate || "2100-01-01").getTime();
}

function buildExpedition(id: string, items: Destination[], now: Date): TimelineExpedition {
  const sortedDestinations = [...items].sort((a, b) => {
    const orderDelta = (a.stopOrder ?? 1) - (b.stopOrder ?? 1);

    if (orderDelta !== 0) {
      return orderDelta;
    }

    return getDestinationSortTime(a) - getDestinationSortTime(b);
  });

  const startDate = sortedDestinations[0]?.startDate || sortedDestinations[0]?.endDate;
  const endDate =
    [...sortedDestinations]
      .reverse()
      .find((item) => item.endDate || item.startDate)?.endDate ||
    [...sortedDestinations]
      .reverse()
      .find((item) => item.endDate || item.startDate)?.startDate;

  const phase = endDate && new Date(`${endDate}T23:59:59`).getTime() < now.getTime() ? "past" : "upcoming";
  const lead = sortedDestinations[0];

  return {
    id,
    name: lead?.expeditionName || lead?.title || "Untitled Expedition",
    phase,
    startDate,
    endDate,
    status: lead?.status || "planned",
    waterType: lead?.waterType || "saltwater",
    summary: lead?.summary,
    destinations: sortedDestinations
  };
}
