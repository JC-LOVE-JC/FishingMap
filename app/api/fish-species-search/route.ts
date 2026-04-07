import { NextRequest, NextResponse } from "next/server";

import { searchFishSpeciesCatalog } from "@/lib/fishing-catalog";
import { buildFishIllustrationDataUrl } from "@/lib/fish-illustrations";
import type { WaterType } from "@/lib/types";

export const dynamic = "force-dynamic";

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
      imageUrl: buildFishIllustrationDataUrl(item.name),
      name: item.name,
      wikiTitle: item.wikiTitle
    }))
  );

  return NextResponse.json({ results });
}
