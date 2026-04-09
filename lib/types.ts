export type DestinationStatus = "planned" | "visited";
export type WaterType = "saltwater" | "freshwater" | "urban";
export type RegionType = WaterType;
export type TransportMode = "flight" | "boat" | "drive";

export type PhotoItem = {
  id: string;
  url: string;
  caption?: string;
  alt?: string;
  storagePath?: string | null;
};

export type TransportSegment = {
  id: string;
  mode: TransportMode;
  name: string;
  departureTime?: string;
  duration?: string;
  notes?: string;
};

export type GuideInfo = {
  name?: string;
  contact?: string;
};

export type BoatInfo = {
  boatName?: string;
  length?: string;
  boatType?: string;
  maxAnglers?: number;
  engineSetup?: string;
  fightingChair?: boolean;
  liveBaitTank?: boolean;
  outriggers?: boolean;
  birdRadar?: boolean;
  tunaTubes?: boolean;
  hasCabin?: boolean;
  hasToilet?: boolean;
};

export type Destination = {
  id: string;
  title: string;
  expeditionId?: string;
  expeditionName?: string;
  stopOrder?: number;
  transportFromPrevious?: TransportSegment | null;
  city?: string;
  country: string;
  region?: string;
  lat: number;
  lng: number;
  status: DestinationStatus;
  waterType?: WaterType;
  season?: string;
  startDate?: string;
  endDate?: string;
  tripDate?: string;
  summary?: string;
  notes?: string;
  species: string[];
  techniques: string[];
  tags: string[];
  guideInfo?: GuideInfo;
  boatInfo?: BoatInfo;
  photos: PhotoItem[];
  rating?: number;
  featured?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TimelineExpedition = {
  id: string;
  name: string;
  phase: "past" | "upcoming";
  startDate?: string;
  endDate?: string;
  status: DestinationStatus;
  waterType: WaterType;
  summary?: string;
  destinations: Destination[];
};

export type LocationSuggestion = {
  id: string;
  name: string;
  city?: string;
  region?: string;
  country?: string;
  label: string;
  lat: number;
  lng: number;
  source: "maptiler" | "nominatim";
};

export type TripMap = {
  id: string;
  ownerUserId: string;
  title: string;
  shareSlug: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
};
