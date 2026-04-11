"use client";

import type { SupabaseClient, User } from "@supabase/supabase-js";

import { SUPABASE_BUCKET } from "@/lib/supabase/env";
import type { BoatInfo, Destination, GuideInfo, PhotoItem, TripMap } from "@/lib/types";
import { normalizeDestination } from "@/lib/utils";

type TripMapRow = {
  id: string;
  owner_user_id: string;
  title: string;
  share_slug: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
};

type DestinationRow = {
  id: string;
  trip_map_id: string;
  title: string;
  expedition_id: string | null;
  expedition_name: string | null;
  stop_order: number | null;
  transport_from_previous: Destination["transportFromPrevious"] | null;
  city: string | null;
  country: string;
  region: string | null;
  lat: number;
  lng: number;
  status: Destination["status"];
  water_type: Destination["waterType"] | null;
  season: string | null;
  start_date: string | null;
  end_date: string | null;
  trip_date: string | null;
  summary: string | null;
  notes: string | null;
  species: string[] | null;
  techniques: string[] | null;
  tags: string[] | null;
  guide_info: GuideInfo | null;
  boat_info: BoatInfo | null;
  rating: number | null;
  featured: boolean | null;
  created_at: string;
  updated_at: string;
};

type DestinationImageRow = {
  id: string;
  destination_id: string;
  storage_path: string | null;
  public_url: string;
  caption: string | null;
  alt: string | null;
  sort_order: number;
  created_at: string;
};

export type TripMapSnapshot = {
  tripMap: TripMap;
  destinations: Destination[];
};

export async function listOwnedTripMaps(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("trip_maps")
    .select("*")
    .eq("owner_user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapTripMapRow);
}

export async function createTripMap(supabase: SupabaseClient, userId: string, title: string) {
  const { data, error } = await supabase
    .from("trip_maps")
    .insert({
      owner_user_id: userId,
      title: title.trim() || "My Fishing Atlas",
      share_slug: createShareSlug()
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return mapTripMapRow(data);
}

export async function deleteTripMap(supabase: SupabaseClient, tripMapId: string) {
  const destinations = await fetchDestinationRows(supabase, tripMapId);
  const images = await fetchDestinationImages(
    supabase,
    destinations.map((destination) => destination.id)
  );

  await removeStoredImages(supabase, images);

  const { error } = await supabase
    .from("trip_maps")
    .delete()
    .eq("id", tripMapId);

  if (error) {
    throw error;
  }
}

export async function ensureOwnedTripMap(supabase: SupabaseClient, user: User) {
  const maps = await listOwnedTripMaps(supabase, user.id);

  if (maps.length > 0) {
    return maps;
  }

  const created = await createTripMap(supabase, user.id, "My Fishing Atlas");
  return [created];
}

export async function loadOwnedTripMapSnapshot(
  supabase: SupabaseClient,
  userId: string,
  tripMapId?: string | null
) {
  const query = supabase
    .from("trip_maps")
    .select("*")
    .eq("owner_user_id", userId);

  const { data, error } = await (tripMapId ? query.eq("id", tripMapId) : query.order("updated_at", { ascending: false }).limit(1)).maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return loadTripMapSnapshotByRow(supabase, data);
}

export async function loadSharedTripMapSnapshot(supabase: SupabaseClient, shareSlug: string) {
  const { data, error } = await supabase
    .from("trip_maps")
    .select("*")
    .eq("share_slug", shareSlug)
    .eq("is_public", true)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return loadTripMapSnapshotByRow(supabase, data);
}

export async function setTripMapPublicState(
  supabase: SupabaseClient,
  tripMapId: string,
  isPublic: boolean
) {
  const { error } = await supabase
    .from("trip_maps")
    .update({
      is_public: isPublic,
      updated_at: new Date().toISOString()
    })
    .eq("id", tripMapId);

  if (error) {
    throw error;
  }
}

export async function saveTripMapSnapshot(
  supabase: SupabaseClient,
  {
    destinations,
    tripMap,
    user
  }: {
    destinations: Destination[];
    tripMap: TripMap;
    user: User;
  }
) {
  const existingDestinations = await fetchDestinationRows(supabase, tripMap.id);
  const existingImages = await fetchDestinationImages(
    supabase,
    existingDestinations.map((destination) => destination.id)
  );

  const nextDestinationIds = new Set(destinations.map((destination) => destination.id));
  const removedDestinationIds = existingDestinations
    .filter((destination) => !nextDestinationIds.has(destination.id))
    .map((destination) => destination.id);

  if (removedDestinationIds.length) {
    const removedImages = existingImages.filter((image) => removedDestinationIds.includes(image.destination_id));
    await removeStoredImages(supabase, removedImages);

    const { error: deleteImagesError } = await supabase
      .from("destination_images")
      .delete()
      .in("destination_id", removedDestinationIds);

    if (deleteImagesError) {
      throw deleteImagesError;
    }

    const { error: deleteDestinationsError } = await supabase
      .from("destinations")
      .delete()
      .in("id", removedDestinationIds);

    if (deleteDestinationsError) {
      throw deleteDestinationsError;
    }
  }

  const destinationRows = destinations.map((destination) => mapDestinationToRow(destination, tripMap.id));
  if (destinationRows.length) {
    const { error: upsertDestinationsError } = await supabase
      .from("destinations")
      .upsert(destinationRows, { onConflict: "id" });

    if (upsertDestinationsError) {
      throw upsertDestinationsError;
    }
  }

  const imagesByDestination = groupImagesByDestination(existingImages);
  const syncedDestinations: Destination[] = [];

  for (const destination of destinations) {
    const existingForDestination = imagesByDestination.get(destination.id) ?? [];
    const syncedPhotos = await syncDestinationPhotos(
      supabase,
      user,
      tripMap,
      destination,
      existingForDestination
    );

    syncedDestinations.push(
      normalizeDestination({
        ...destination,
        photos: syncedPhotos
      })
    );
  }

  const { error: updateTripMapError } = await supabase
    .from("trip_maps")
    .update({
      updated_at: new Date().toISOString()
    })
    .eq("id", tripMap.id);

  if (updateTripMapError) {
    throw updateTripMapError;
  }

  return syncedDestinations;
}

function mapTripMapRow(row: TripMapRow): TripMap {
  return {
    id: row.id,
    ownerUserId: row.owner_user_id,
    title: row.title,
    shareSlug: row.share_slug,
    isPublic: row.is_public,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

async function loadTripMapSnapshotByRow(supabase: SupabaseClient, row: TripMapRow): Promise<TripMapSnapshot> {
  const destinations = await fetchDestinationRows(supabase, row.id);
  const images = await fetchDestinationImages(
    supabase,
    destinations.map((destination) => destination.id)
  );
  const photosByDestination = groupImagesByDestination(images);

  return {
    tripMap: mapTripMapRow(row),
    destinations: destinations.map((destination) =>
      normalizeDestination({
        id: destination.id,
        title: destination.title,
        expeditionId: destination.expedition_id ?? undefined,
        expeditionName: destination.expedition_name ?? undefined,
        stopOrder: destination.stop_order ?? undefined,
        transportFromPrevious: destination.transport_from_previous ?? null,
        city: destination.city ?? undefined,
        country: destination.country,
        region: destination.region ?? undefined,
        lat: destination.lat,
        lng: destination.lng,
        status: destination.status,
        waterType: destination.water_type ?? undefined,
        season: destination.season ?? undefined,
        startDate: destination.start_date ?? undefined,
        endDate: destination.end_date ?? undefined,
        tripDate: destination.trip_date ?? undefined,
        summary: destination.summary ?? undefined,
        notes: destination.notes ?? undefined,
        species: destination.species ?? [],
        techniques: destination.techniques ?? [],
        tags: destination.tags ?? [],
        guideInfo: destination.guide_info ?? undefined,
        boatInfo: destination.boat_info ?? undefined,
        photos: (photosByDestination.get(destination.id) ?? []).map(mapImageRowToPhoto),
        rating: destination.rating ?? undefined,
        featured: destination.featured ?? undefined,
        createdAt: destination.created_at,
        updatedAt: destination.updated_at
      })
    )
  };
}

async function fetchDestinationRows(supabase: SupabaseClient, tripMapId: string) {
  const { data, error } = await supabase
    .from("destinations")
    .select("*")
    .eq("trip_map_id", tripMapId)
    .order("stop_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as DestinationRow[];
}

async function fetchDestinationImages(supabase: SupabaseClient, destinationIds: string[]) {
  if (destinationIds.length === 0) {
    return [] as DestinationImageRow[];
  }

  const { data, error } = await supabase
    .from("destination_images")
    .select("*")
    .in("destination_id", destinationIds)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as DestinationImageRow[];
}

function mapDestinationToRow(destination: Destination, tripMapId: string): DestinationRow {
  return {
    id: destination.id,
    trip_map_id: tripMapId,
    title: destination.title,
    expedition_id: destination.expeditionId ?? null,
    expedition_name: destination.expeditionName ?? null,
    stop_order: destination.stopOrder ?? null,
    transport_from_previous: destination.transportFromPrevious ?? null,
    city: destination.city ?? null,
    country: destination.country,
    region: destination.region ?? null,
    lat: destination.lat,
    lng: destination.lng,
    status: destination.status,
    water_type: destination.waterType ?? null,
    season: destination.season ?? null,
    start_date: destination.startDate ?? null,
    end_date: destination.endDate ?? null,
    trip_date: destination.tripDate ?? null,
    summary: destination.summary ?? null,
    notes: destination.notes ?? null,
    species: destination.species,
    techniques: destination.techniques,
    tags: destination.tags,
    guide_info: destination.guideInfo ?? null,
    boat_info: destination.boatInfo ?? null,
    rating: destination.rating ?? null,
    featured: destination.featured ?? false,
    created_at: destination.createdAt,
    updated_at: destination.updatedAt
  };
}

function mapImageRowToPhoto(row: DestinationImageRow): PhotoItem {
  return {
    id: row.id,
    url: row.public_url,
    caption: row.caption ?? undefined,
    alt: row.alt ?? undefined,
    storagePath: row.storage_path
  };
}

function groupImagesByDestination(images: DestinationImageRow[]) {
  const grouped = new Map<string, DestinationImageRow[]>();

  for (const image of images) {
    const bucket = grouped.get(image.destination_id) ?? [];
    bucket.push(image);
    grouped.set(image.destination_id, bucket);
  }

  return grouped;
}

async function syncDestinationPhotos(
  supabase: SupabaseClient,
  user: User,
  tripMap: TripMap,
  destination: Destination,
  existingImages: DestinationImageRow[]
) {
  const nextPhotoIds = new Set(destination.photos.map((photo) => photo.id));
  const removedImages = existingImages.filter((image) => !nextPhotoIds.has(image.id));

  await removeStoredImages(supabase, removedImages);

  if (removedImages.length) {
    const { error: deleteRemovedImagesError } = await supabase
      .from("destination_images")
      .delete()
      .in("id", removedImages.map((image) => image.id));

    if (deleteRemovedImagesError) {
      throw deleteRemovedImagesError;
    }
  }

  const existingById = new Map(existingImages.map((image) => [image.id, image]));
  const syncedPhotos: PhotoItem[] = [];
  const rows: DestinationImageRow[] = [];

  for (const [index, photo] of destination.photos.entries()) {
    const existing = existingById.get(photo.id);
    let publicUrl = photo.url;
    let storagePath = photo.storagePath ?? existing?.storage_path ?? null;

    if (photo.url.startsWith("data:")) {
      const uploadResult = await uploadDataUrlPhoto(supabase, {
        dataUrl: photo.url,
        destinationId: destination.id,
        photoId: photo.id,
        tripMapId: tripMap.id,
        userId: user.id
      });
      publicUrl = uploadResult.publicUrl;
      storagePath = uploadResult.storagePath;
    }

    syncedPhotos.push({
      ...photo,
      url: publicUrl,
      storagePath
    });

    rows.push({
      id: photo.id,
      destination_id: destination.id,
      storage_path: storagePath,
      public_url: publicUrl,
      caption: photo.caption ?? null,
      alt: photo.alt ?? null,
      sort_order: index,
      created_at: existing?.created_at ?? new Date().toISOString()
    });
  }

  if (rows.length) {
    const { error: upsertImagesError } = await supabase
      .from("destination_images")
      .upsert(rows, { onConflict: "id" });

    if (upsertImagesError) {
      throw upsertImagesError;
    }
  }

  return syncedPhotos;
}

async function removeStoredImages(supabase: SupabaseClient, images: DestinationImageRow[]) {
  const storagePaths = images
    .map((image) => image.storage_path)
    .filter((path): path is string => Boolean(path));

  if (storagePaths.length > 0) {
    await supabase.storage.from(SUPABASE_BUCKET).remove(storagePaths);
  }
}

async function uploadDataUrlPhoto(
  supabase: SupabaseClient,
  {
    dataUrl,
    destinationId,
    photoId,
    tripMapId,
    userId
  }: {
    dataUrl: string;
    destinationId: string;
    photoId: string;
    tripMapId: string;
    userId: string;
  }
) {
  const { contentType, extension, file } = dataUrlToFile(dataUrl);
  const storagePath = [
    userId,
    `map-${tripMapId}`,
    `destination-${destinationId}`,
    `photo-${photoId}.${extension}`
  ].join("/");

  const { error } = await supabase.storage.from(SUPABASE_BUCKET).upload(storagePath, file, {
    contentType,
    upsert: true
  });

  if (error) {
    throw error;
  }

  const { data } = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(storagePath);

  return {
    publicUrl: data.publicUrl,
    storagePath
  };
}

function dataUrlToFile(dataUrl: string) {
  const match = dataUrl.match(/^data:(.+);base64,(.+)$/);

  if (!match) {
    throw new Error("Unsupported image format");
  }

  const [, contentType, base64Payload] = match;
  const binary = globalThis.atob(base64Payload);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  const extension = contentType.split("/")[1]?.replace("jpeg", "jpg") || "png";

  return {
    contentType,
    extension,
    file: new File([bytes], `upload.${extension}`, { type: contentType })
  };
}

function createShareSlug() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 16);
}
