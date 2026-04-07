import type { WaterType } from "@/lib/types";

export type FishSpeciesCatalogItem = {
  id: string;
  name: string;
  aliases: string[];
  wikiTitle: string;
  waterTypes?: WaterType[];
};

export type FishSpeciesSuggestion = {
  id: string;
  imageUrl: string | null;
  name: string;
  wikiTitle: string;
};

export const FISH_SPECIES_CATALOG: FishSpeciesCatalogItem[] = [
  { id: "mahi-mahi", name: "Mahi-mahi", aliases: ["mahi mahi", "dolphinfish", "dorado"], wikiTitle: "Mahi-mahi", waterTypes: ["saltwater"] },
  { id: "yellowfin-tuna", name: "Yellowfin tuna", aliases: ["yellow fin tuna", "ahi"], wikiTitle: "Yellowfin tuna", waterTypes: ["saltwater"] },
  { id: "bluefin-tuna", name: "Bluefin tuna", aliases: ["atlantic bluefin tuna", "pacific bluefin tuna"], wikiTitle: "Atlantic bluefin tuna", waterTypes: ["saltwater"] },
  { id: "bigeye-tuna", name: "Bigeye tuna", aliases: ["big eye tuna"], wikiTitle: "Bigeye tuna", waterTypes: ["saltwater"] },
  { id: "dogtooth-tuna", name: "Dogtooth tuna", aliases: ["dog tooth tuna"], wikiTitle: "Dogtooth tuna", waterTypes: ["saltwater"] },
  { id: "wahoo", name: "Wahoo", aliases: ["ono"], wikiTitle: "Wahoo", waterTypes: ["saltwater"] },
  { id: "blue-marlin", name: "Blue marlin", aliases: ["atlantic blue marlin"], wikiTitle: "Atlantic blue marlin", waterTypes: ["saltwater"] },
  { id: "black-marlin", name: "Black marlin", aliases: [], wikiTitle: "Black marlin", waterTypes: ["saltwater"] },
  { id: "striped-marlin", name: "Striped marlin", aliases: [], wikiTitle: "Striped marlin", waterTypes: ["saltwater"] },
  { id: "sailfish", name: "Sailfish", aliases: ["pacific sailfish", "atlantic sailfish"], wikiTitle: "Sailfish", waterTypes: ["saltwater"] },
  { id: "swordfish", name: "Swordfish", aliases: ["broadbill"], wikiTitle: "Swordfish", waterTypes: ["saltwater"] },
  { id: "giant-trevally", name: "Giant trevally", aliases: ["gt"], wikiTitle: "Giant trevally", waterTypes: ["saltwater"] },
  { id: "queenfish", name: "Queenfish", aliases: ["talang queenfish"], wikiTitle: "Talang queenfish", waterTypes: ["saltwater"] },
  { id: "bonefish", name: "Bonefish", aliases: [], wikiTitle: "Bonefish", waterTypes: ["saltwater"] },
  { id: "permit", name: "Permit", aliases: [], wikiTitle: "Permit (fish)", waterTypes: ["saltwater"] },
  { id: "tarpon", name: "Tarpon", aliases: ["atlantic tarpon"], wikiTitle: "Tarpon", waterTypes: ["saltwater"] },
  { id: "snook", name: "Snook", aliases: ["common snook"], wikiTitle: "Common snook", waterTypes: ["saltwater", "freshwater"] },
  { id: "roosterfish", name: "Roosterfish", aliases: [], wikiTitle: "Roosterfish", waterTypes: ["saltwater"] },
  { id: "cubera-snapper", name: "Cubera snapper", aliases: [], wikiTitle: "Cubera snapper", waterTypes: ["saltwater"] },
  { id: "red-snapper", name: "Red snapper", aliases: [], wikiTitle: "Red snapper", waterTypes: ["saltwater"] },
  { id: "mangrove-jack", name: "Mangrove jack", aliases: [], wikiTitle: "Mangrove red snapper", waterTypes: ["saltwater"] },
  { id: "barramundi", name: "Barramundi", aliases: ["asian sea bass"], wikiTitle: "Barramundi", waterTypes: ["saltwater", "freshwater"] },
  { id: "yellowtail-kingfish", name: "Yellowtail kingfish", aliases: ["kingfish", "yellowtail amberjack"], wikiTitle: "Yellowtail amberjack", waterTypes: ["saltwater"] },
  { id: "hapuku", name: "Hapuku", aliases: ["groper"], wikiTitle: "Polyprion oxygeneios", waterTypes: ["saltwater"] },
  { id: "coral-trout", name: "Coral trout", aliases: ["coral trout grouper"], wikiTitle: "Plectropomus leopardus", waterTypes: ["saltwater"] },
  { id: "peacock-bass", name: "Peacock bass", aliases: ["peacock cichlid"], wikiTitle: "Peacock bass", waterTypes: ["freshwater"] },
  { id: "largemouth-bass", name: "Largemouth bass", aliases: [], wikiTitle: "Largemouth bass", waterTypes: ["freshwater", "urban"] },
  { id: "smallmouth-bass", name: "Smallmouth bass", aliases: [], wikiTitle: "Smallmouth bass", waterTypes: ["freshwater", "urban"] },
  { id: "golden-dorado", name: "Golden dorado", aliases: ["dorado", "salminus brasiliensis"], wikiTitle: "Salminus brasiliensis", waterTypes: ["freshwater"] },
  { id: "pacu", name: "Pacu", aliases: [], wikiTitle: "Pacu", waterTypes: ["freshwater"] },
  { id: "surubi", name: "Surubi", aliases: ["sorubim", "shovelnose catfish"], wikiTitle: "Pseudoplatystoma", waterTypes: ["freshwater"] },
  { id: "rainbow-trout", name: "Rainbow trout", aliases: [], wikiTitle: "Rainbow trout", waterTypes: ["freshwater"] },
  { id: "brown-trout", name: "Brown trout", aliases: [], wikiTitle: "Brown trout", waterTypes: ["freshwater"] },
  { id: "brook-trout", name: "Brook trout", aliases: [], wikiTitle: "Brook trout", waterTypes: ["freshwater"] },
  { id: "northern-pike", name: "Northern pike", aliases: ["pike"], wikiTitle: "Northern pike", waterTypes: ["freshwater"] },
  { id: "muskellunge", name: "Muskellunge", aliases: ["muskie"], wikiTitle: "Muskellunge", waterTypes: ["freshwater"] },
  { id: "chinook-salmon", name: "Chinook salmon", aliases: ["king salmon"], wikiTitle: "Chinook salmon", waterTypes: ["freshwater"] },
  { id: "atlantic-salmon", name: "Atlantic salmon", aliases: [], wikiTitle: "Atlantic salmon", waterTypes: ["freshwater"] },
  { id: "flathead-catfish", name: "Flathead catfish", aliases: ["catfish"], wikiTitle: "Flathead catfish", waterTypes: ["freshwater", "urban"] },
  { id: "carp", name: "Carp", aliases: ["common carp"], wikiTitle: "Common carp", waterTypes: ["freshwater", "urban"] },
  { id: "redfish", name: "Redfish", aliases: ["red drum"], wikiTitle: "Red drum", waterTypes: ["saltwater"] }
];

export const TECHNIQUE_OPTIONS = [
  "Casting",
  "Fly",
  "Jigging",
  "Live baiting",
  "Popping",
  "Sight casting",
  "Soft plastics",
  "Spinnerbait",
  "Streamer fishing",
  "Surface lures",
  "Teasing",
  "Topwater",
  "Trolling",
  "Pitch baiting",
  "Deep dropping",
  "Bottom fishing",
  "Dropshot",
  "Nymphing"
] as const;

function normalizeSearchValue(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function buildSearchFields(item: FishSpeciesCatalogItem) {
  return [item.name, ...item.aliases].map(normalizeSearchValue).filter(Boolean);
}

function getMatchScore(item: FishSpeciesCatalogItem, query: string, waterType?: WaterType) {
  const normalizedQuery = normalizeSearchValue(query);

  if (!normalizedQuery) {
    return -1;
  }

  if (waterType && item.waterTypes?.length && !item.waterTypes.includes(waterType)) {
    return -1;
  }

  const fields = buildSearchFields(item);
  let score = -1;

  for (const field of fields) {
    if (field === normalizedQuery) {
      score = Math.max(score, 140);
      continue;
    }

    if (field.startsWith(normalizedQuery)) {
      score = Math.max(score, 120 - (field.length - normalizedQuery.length));
      continue;
    }

    if (field.includes(normalizedQuery)) {
      score = Math.max(score, 95 - field.indexOf(normalizedQuery));
      continue;
    }

    const compactField = field.replaceAll(" ", "");
    const compactQuery = normalizedQuery.replaceAll(" ", "");

    if (compactField.includes(compactQuery)) {
      score = Math.max(score, 88 - compactField.indexOf(compactQuery));
      continue;
    }

    const queryTokens = normalizedQuery.split(" ");
    if (queryTokens.every((token) => field.includes(token))) {
      score = Math.max(score, 72);
    }
  }

  return score;
}

export function searchFishSpeciesCatalog(query: string, waterType?: WaterType, limit = 8) {
  const normalizedQuery = normalizeSearchValue(query);

  if (normalizedQuery.length < 2) {
    return [];
  }

  return FISH_SPECIES_CATALOG
    .map((item) => ({
      item,
      score: getMatchScore(item, normalizedQuery, waterType)
    }))
    .filter((entry) => entry.score >= 0)
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      return a.item.name.localeCompare(b.item.name);
    })
    .slice(0, limit)
    .map((entry) => entry.item);
}
