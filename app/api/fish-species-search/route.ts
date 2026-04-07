import { NextRequest, NextResponse } from "next/server";

import { searchFishSpeciesCatalog } from "@/lib/fishing-catalog";
import type { WaterType } from "@/lib/types";

export const dynamic = "force-dynamic";

const thumbnailCache = new Map<string, string | null>();

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const waterType = (request.nextUrl.searchParams.get("waterType") as WaterType | null) ?? undefined;

  if (query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const matches = searchFishSpeciesCatalog(query, waterType, 8);
  const results = await Promise.all(
    matches.map(async (item) => ({
      id: item.id,
      imageUrl: await resolveFishThumbnail(item.wikiTitle),
      name: item.name,
      wikiTitle: item.wikiTitle
    }))
  );

  return NextResponse.json({ results });
}

async function resolveFishThumbnail(title: string) {
  if (thumbnailCache.has(title)) {
    return thumbnailCache.get(title) ?? null;
  }

  try {
    const response = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "FishingTravelPlanner/0.1 (species image search)"
        },
        next: { revalidate: 60 * 60 * 24 * 7 }
      }
    );

    if (!response.ok) {
      thumbnailCache.set(title, null);
      return null;
    }

    const payload = (await response.json()) as {
      originalimage?: { source?: string };
      thumbnail?: { source?: string };
    };
    const imageUrl = payload.thumbnail?.source || payload.originalimage?.source || null;

    thumbnailCache.set(title, imageUrl);
    return imageUrl;
  } catch {
    thumbnailCache.set(title, null);
    return null;
  }
}
