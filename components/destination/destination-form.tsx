"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";

import { ChevronDown, ImagePlus, LoaderCircle, MapPinned, Plus, Search, Trash2, UploadCloud } from "lucide-react";

import { FishSpeciesSelector } from "@/components/destination/fish-species-selector";
import { TechniqueSelector } from "@/components/destination/technique-selector";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getStatusLabel, getWaterTypeLabel, useLanguage } from "@/lib/i18n";
import type {
  BoatInfo,
  Destination,
  DestinationStatus,
  GuideInfo,
  LocationSuggestion,
  PhotoItem,
  WaterType
} from "@/lib/types";
import {
  STATUS_META,
  STATUS_ORDER,
  WATER_TYPE_META,
  cn,
  toPhotoFromDataUrl
} from "@/lib/utils";

type DestinationFormProps = {
  addMode: boolean;
  expeditionSuggestions: string[];
  isResolvingLocation: boolean;
  mapPickMode: boolean;
  mode: "add" | "edit";
  onCancel: () => void;
  onChange: (destination: Destination) => void;
  onDisableMapPick: () => void;
  onEnableMapPick: () => void;
  onSave: () => void;
  value: Destination;
};

export function DestinationForm({
  addMode,
  expeditionSuggestions,
  isResolvingLocation,
  mapPickMode,
  mode,
  onCancel,
  onChange,
  onDisableMapPick,
  onEnableMapPick,
  onSave,
  value
}: DestinationFormProps) {
  const { language, t } = useLanguage();
  const [locationQuery, setLocationQuery] = useState(buildLocationQuery(value));
  const [locationResults, setLocationResults] = useState<LocationSuggestion[]>([]);
  const [isSearchingLocations, setIsSearchingLocations] = useState(false);
  const normalizedExpeditionQuery = (value.expeditionName || "").trim().toLowerCase();
  const filteredExpeditionSuggestions =
    normalizedExpeditionQuery.length >= 1
      ? expeditionSuggestions
          .filter((name) => {
            const normalizedName = name.trim().toLowerCase();

            return (
              normalizedName.includes(normalizedExpeditionQuery) &&
              normalizedName !== normalizedExpeditionQuery
            );
          })
          .slice(0, 6)
      : [];

  useEffect(() => {
    setLocationQuery(buildLocationQuery(value));
  }, [value.city, value.region, value.country]);

  useEffect(() => {
    const query = locationQuery.trim();

    if (mapPickMode || query.length < 2) {
      setLocationResults([]);
      setIsSearchingLocations(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setIsSearchingLocations(true);

      try {
        const response = await fetch(`/api/location-search?q=${encodeURIComponent(query)}`, {
          signal: controller.signal
        });
        const payload = await response.json();

        if (!controller.signal.aborted) {
          setLocationResults(payload.results ?? []);
        }
      } catch {
        if (!controller.signal.aborted) {
          setLocationResults([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsSearchingLocations(false);
        }
      }
    }, 240);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [locationQuery, mapPickMode]);

  function updateField<Key extends keyof Destination>(key: Key, nextValue: Destination[Key]) {
    onChange({
      ...value,
      [key]: nextValue
    });
  }

  function updatePhoto(photoId: string, key: keyof PhotoItem, nextValue: string) {
    updateField(
      "photos",
      value.photos.map((photo) =>
        photo.id === photoId
          ? {
              ...photo,
              [key]: nextValue
            }
          : photo
      )
    );
  }

  function updateGuideField<Key extends keyof GuideInfo>(key: Key, nextValue: GuideInfo[Key]) {
    onChange({
      ...value,
      guideInfo: {
        name: "",
        contact: "",
        ...value.guideInfo,
        [key]: nextValue
      }
    });
  }

  function updateBoatField<Key extends keyof BoatInfo>(key: Key, nextValue: BoatInfo[Key]) {
    onChange({
      ...value,
      boatInfo: {
        boatName: "",
        length: "",
        boatType: "",
        maxAnglers: undefined,
        engineSetup: "",
        fightingChair: undefined,
        liveBaitTank: undefined,
        outriggers: undefined,
        birdRadar: undefined,
        tunaTubes: undefined,
        hasCabin: undefined,
        hasToilet: undefined,
        ...value.boatInfo,
        [key]: nextValue
      }
    });
  }

  function addPhotoRow() {
    updateField("photos", [
      ...value.photos,
      {
        id: crypto.randomUUID(),
        url: "",
        caption: "",
        alt: ""
      }
    ]);
  }

  function removePhoto(photoId: string) {
    updateField(
      "photos",
      value.photos.filter((photo) => photo.id !== photoId)
    );
  }

  async function handleImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);

    if (!files.length) {
      return;
    }

    const uploadedPhotos = await Promise.all(
      files.map(
        (file) =>
          new Promise<PhotoItem>((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = () => {
              if (typeof reader.result !== "string") {
                reject(new Error("Unsupported file type"));
                return;
              }

              resolve(toPhotoFromDataUrl(file.name, reader.result));
            };

            reader.onerror = () => reject(reader.error ?? new Error("Upload failed"));
            reader.readAsDataURL(file);
          })
      )
    );

    updateField("photos", [...value.photos, ...uploadedPhotos]);
    event.target.value = "";
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave();
  }

  function applyLocationSuggestion(suggestion: LocationSuggestion) {
    onDisableMapPick();
    onChange({
      ...value,
      title: value.title.trim() ? value.title : suggestion.name,
      city: suggestion.city || suggestion.name,
      region: suggestion.region || "",
      country: suggestion.country || value.country,
      lat: Number(suggestion.lat.toFixed(4)),
      lng: Number(suggestion.lng.toFixed(4))
    });
    setLocationQuery(suggestion.label);
    setLocationResults([]);
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow">{mode === "add" ? t("form.newPin") : t("form.refineDestination")}</p>
          <h2 className="mt-2 font-display text-3xl text-white">
            {mode === "add" ? t("form.composeDestination") : t("form.editDetails")}
          </h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-white/65">
            {addMode
              ? t("form.addDescription")
              : t("form.editDescription")}
          </p>
        </div>

        <Badge>{mode === "add" ? t("common.draft") : t("common.editing")}</Badge>
      </div>

      <section className="panel-section space-y-4 rounded-[28px] p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">{t("form.locationSearch")}</p>
            <p className="mt-2 text-sm leading-6 text-white/70">
              {t("form.locationSearchDescription")}
            </p>
          </div>
          <Button
            onClick={() => {
              if (mapPickMode) {
                onDisableMapPick();
              } else {
                onEnableMapPick();
              }
            }}
            type="button"
            variant="secondary"
          >
            <MapPinned className="size-4" />
            {mapPickMode ? t("form.backToSearch") : t("form.useMapPick")}
          </Button>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-white/40" />
          <Input
            className="pl-11 pr-11"
            disabled={mapPickMode}
            onChange={(event) => {
              onDisableMapPick();
              setLocationQuery(event.target.value);
            }}
            placeholder={t("form.locationPlaceholder")}
            value={locationQuery}
          />
          {isSearchingLocations ? (
            <LoaderCircle className="absolute right-4 top-1/2 size-4 -translate-y-1/2 animate-spin text-white/40" />
          ) : null}

          {!mapPickMode && locationResults.length ? (
            <div className="absolute inset-x-0 top-[calc(100%+0.65rem)] z-20 overflow-hidden rounded-[24px] border border-white/8 bg-[#04111b]/98 shadow-[0_24px_60px_rgba(0,0,0,0.42)] backdrop-blur-2xl">
              {locationResults.map((result) => (
                <button
                  className="flex w-full items-start justify-between gap-4 border-b border-white/6 px-4 py-3 text-left transition last:border-b-0 hover:bg-[#0a1d2b]"
                  key={result.id}
                  onClick={() => applyLocationSuggestion(result)}
                  type="button"
                >
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-white">{result.name}</span>
                    <span className="mt-1 block text-xs uppercase tracking-[0.18em] text-white/42">
                      {[result.region, result.country].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                  <span className="text-[0.68rem] uppercase tracking-[0.2em] text-white/30">
                    {result.source}
                  </span>
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="rounded-[22px] border border-white/6 bg-[#06121c] px-4 py-3 text-sm text-white/68">
          {mapPickMode
            ? isResolvingLocation
              ? t("form.mapPickResolving")
              : t("form.mapPickManual")
            : t("form.locationChoiceHint")}
        </div>
      </section>

      <section className="panel-section space-y-4 rounded-[28px] p-4">
        <p className="eyebrow">{t("form.status")}</p>
        <div className="flex flex-wrap gap-2">
          {STATUS_ORDER.map((status) => (
            <button
              className={cn(
                "rounded-full border px-4 py-2 text-xs uppercase tracking-[0.22em] transition",
                value.status === status
                  ? STATUS_META[status].badgeClassName
                  : "border-white/8 bg-[#06131d] text-white/55 hover:bg-[#0b1d2a]"
              )}
              key={status}
              onClick={() => updateField("status", status as DestinationStatus)}
              type="button"
            >
              {getStatusLabel(status, language)}
            </button>
          ))}
        </div>
      </section>

      <section className="panel-section space-y-4 rounded-[28px] p-4">
        <p className="eyebrow">{t("form.waterType")}</p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(WATER_TYPE_META).map(([waterType, meta]) => (
            <button
              className={cn(
                "rounded-full border px-4 py-2 text-xs uppercase tracking-[0.22em] transition",
                value.waterType === waterType
                  ? meta.badgeClassName
                  : "border-white/8 bg-[#06131d] text-white/55 hover:bg-[#0b1d2a]"
              )}
              key={waterType}
              onClick={() => updateField("waterType", waterType as WaterType)}
              type="button"
            >
              {getWaterTypeLabel(waterType as WaterType, language)}
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="eyebrow" htmlFor="title">
            {t("form.title")}
          </label>
          <Input
            id="title"
            onChange={(event) => updateField("title", event.target.value)}
            placeholder={t("form.titlePlaceholder")}
            required
            value={value.title}
          />
        </div>

        <div className="space-y-2">
          <label className="eyebrow" htmlFor="expeditionName">
            {t("form.expeditionName")}
          </label>
          <div className="relative">
            <Input
              id="expeditionName"
              onChange={(event) => updateField("expeditionName", event.target.value)}
              placeholder={t("form.expeditionPlaceholder")}
              value={value.expeditionName || ""}
            />
            {filteredExpeditionSuggestions.length ? (
              <div className="absolute inset-x-0 top-[calc(100%+0.65rem)] z-20 overflow-hidden rounded-[24px] border border-white/8 bg-[#04111b]/98 shadow-[0_24px_60px_rgba(0,0,0,0.42)] backdrop-blur-2xl">
                {filteredExpeditionSuggestions.map((name) => (
                  <button
                    className="flex w-full items-center justify-between gap-3 border-b border-white/6 px-4 py-3 text-left transition last:border-b-0 hover:bg-[#102014]"
                    key={name}
                    onClick={() => updateField("expeditionName", name)}
                    type="button"
                  >
                    <span className="text-sm font-medium text-white">{name}</span>
                    <span className="text-[0.68rem] uppercase tracking-[0.18em] text-white/38">
                      {t("form.existingTrip")}
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="space-y-2">
          <label className="eyebrow" htmlFor="city">
            {t("form.cityPort")}
          </label>
          <Input
            id="city"
            onChange={(event) => updateField("city", event.target.value)}
            placeholder={t("form.cityPlaceholder")}
            value={value.city || ""}
          />
        </div>

        <div className="space-y-2">
          <label className="eyebrow" htmlFor="stopOrder">
            {t("form.stopOrder")}
          </label>
          <Input
            id="stopOrder"
            min={1}
            onChange={(event) => updateField("stopOrder", Number(event.target.value))}
            type="number"
            value={value.stopOrder ?? 1}
          />
        </div>

        <div className="space-y-2">
          <label className="eyebrow" htmlFor="country">
            {t("form.country")}
          </label>
          <Input
            id="country"
            onChange={(event) => updateField("country", event.target.value)}
            placeholder={t("form.countryPlaceholder")}
            required
            value={value.country}
          />
        </div>

        <div className="space-y-2">
          <label className="eyebrow" htmlFor="region">
            {t("form.region")}
          </label>
          <Input
            id="region"
            onChange={(event) => updateField("region", event.target.value)}
            placeholder={t("form.regionPlaceholder")}
            value={value.region || ""}
          />
        </div>

        <div className="space-y-2">
          <label className="eyebrow" htmlFor="season">
            {t("form.bestSeason")}
          </label>
          <Input
            id="season"
            onChange={(event) => updateField("season", event.target.value)}
            placeholder={t("form.bestSeasonPlaceholder")}
            value={value.season || ""}
          />
        </div>

        <div className="space-y-2">
          <label className="eyebrow" htmlFor="startDate">
            {t("form.startDate")}
          </label>
          <Input
            id="startDate"
            onChange={(event) => updateField("startDate", event.target.value)}
            type="date"
            value={value.startDate || ""}
          />
        </div>

        <div className="space-y-2">
          <label className="eyebrow" htmlFor="endDate">
            {t("form.endDate")}
          </label>
          <Input
            id="endDate"
            onChange={(event) => updateField("endDate", event.target.value)}
            type="date"
            value={value.endDate || ""}
          />
        </div>

        <div className="space-y-2">
          <label className="eyebrow" htmlFor="rating">
            {t("form.rating")}
          </label>
          <Input
            id="rating"
            max={5}
            min={1}
            onChange={(event) => updateField("rating", Number(event.target.value))}
            type="number"
            value={value.rating ?? 4}
          />
        </div>
      </section>

      <section className="panel-section grid gap-4 rounded-[28px] p-4 md:grid-cols-2">
        <div className="col-span-full flex items-center justify-between gap-3">
          <div>
            <p className="eyebrow">{t("form.pinCoordinates")}</p>
            <p className="mt-1 text-sm text-white/62">
              {t("form.pinCoordinatesDescription")}
            </p>
          </div>
          {isResolvingLocation ? (
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-800/40 bg-[#071b28] px-3 py-1 text-[0.68rem] uppercase tracking-[0.2em] text-cyan-100">
              <LoaderCircle className="size-3.5 animate-spin" />
              {t("form.resolvingPlace")}
            </div>
          ) : null}
        </div>
        <div className="space-y-2">
          <label className="eyebrow" htmlFor="lat">
            {t("form.latitude")}
          </label>
          <Input
            id="lat"
            onChange={(event) => updateField("lat", Number(event.target.value))}
            step="0.0001"
            type="number"
            value={value.lat}
          />
        </div>

        <div className="space-y-2">
          <label className="eyebrow" htmlFor="lng">
            {t("form.longitude")}
          </label>
          <Input
            id="lng"
            onChange={(event) => updateField("lng", Number(event.target.value))}
            step="0.0001"
            type="number"
            value={value.lng}
          />
        </div>

        <label className="col-span-full flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/72">
          <input
            checked={Boolean(value.featured)}
            className="size-4 rounded border-white/20 bg-transparent text-gold-400"
            onChange={(event) => updateField("featured", event.target.checked)}
            type="checkbox"
          />
          {t("form.markFeatured")}
        </label>
      </section>

      <section className="space-y-4">
        <div className="space-y-2">
          <label className="eyebrow" htmlFor="summary">
            {t("form.summary")}
          </label>
          <Textarea
            id="summary"
            onChange={(event) => updateField("summary", event.target.value)}
            placeholder={t("form.summaryPlaceholder")}
            rows={3}
            value={value.summary || ""}
          />
        </div>

        <div className="space-y-2">
          <label className="eyebrow" htmlFor="notes">
            {t("form.notes")}
          </label>
          <Textarea
            id="notes"
            onChange={(event) => updateField("notes", event.target.value)}
            placeholder={t("form.notesPlaceholder")}
            rows={6}
            value={value.notes || ""}
          />
        </div>
      </section>

      <section className="grid gap-4">
        <div className="space-y-2">
          <label className="eyebrow" htmlFor="species">
            {t("form.species")}
          </label>
          <FishSpeciesSelector
            inputId="species"
            onChange={(species) => updateField("species", species)}
            value={value.species}
            waterType={value.waterType}
          />
        </div>

        <div className="space-y-2">
          <label className="eyebrow" htmlFor="techniques">
            {t("form.techniques")}
          </label>
          <TechniqueSelector
            inputId="techniques"
            onChange={(techniques) => updateField("techniques", techniques)}
            value={value.techniques}
          />
        </div>

        <div className="space-y-2">
          <label className="eyebrow" htmlFor="tags">
            {t("form.tags")}
          </label>
          <Input
            id="tags"
            onChange={(event) => updateField("tags", event.target.value
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean))}
            placeholder={t("form.tagsPlaceholder")}
            value={value.tags.join(", ")}
          />
        </div>
      </section>

      <details className="panel-section group overflow-hidden rounded-[28px]">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-4 marker:hidden">
          <p className="eyebrow">{t("overview.guideBoatInformation")}</p>
          <span className="rounded-full border border-white/10 bg-white/5 p-2 text-white/55 transition group-open:rotate-180">
            <ChevronDown className="size-4" />
          </span>
        </summary>

        <div className="grid gap-4 border-t border-white/8 px-4 pb-4 pt-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="eyebrow" htmlFor="guideName">
              {t("overview.guideName")}
            </label>
            <Input
              id="guideName"
              onChange={(event) => updateGuideField("name", event.target.value)}
              value={value.guideInfo?.name || ""}
            />
          </div>

          <div className="space-y-2">
            <label className="eyebrow" htmlFor="guideContact">
              {t("overview.contact")}
            </label>
            <Input
              id="guideContact"
              onChange={(event) => updateGuideField("contact", event.target.value)}
              value={value.guideInfo?.contact || ""}
            />
          </div>

          <div className="space-y-2">
            <label className="eyebrow" htmlFor="boatName">
              {t("overview.boatName")}
            </label>
            <Input
              id="boatName"
              onChange={(event) => updateBoatField("boatName", event.target.value)}
              value={value.boatInfo?.boatName || ""}
            />
          </div>

          <div className="space-y-2">
            <label className="eyebrow" htmlFor="boatLength">
              {t("overview.length")}
            </label>
            <Input
              id="boatLength"
              onChange={(event) => updateBoatField("length", event.target.value)}
              value={value.boatInfo?.length || ""}
            />
          </div>

          <div className="space-y-2">
            <label className="eyebrow" htmlFor="boatType">
              {t("overview.typeOfBoat")}
            </label>
            <Input
              id="boatType"
              onChange={(event) => updateBoatField("boatType", event.target.value)}
              value={value.boatInfo?.boatType || ""}
            />
          </div>

          <div className="space-y-2">
            <label className="eyebrow" htmlFor="maxAnglers">
              {t("overview.maxAnglers")}
            </label>
            <Input
              id="maxAnglers"
              min={1}
              onChange={(event) =>
                updateBoatField("maxAnglers", event.target.value ? Number(event.target.value) : undefined)
              }
              type="number"
              value={value.boatInfo?.maxAnglers ?? ""}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="eyebrow" htmlFor="engineSetup">
              {t("overview.engineSetup")}
            </label>
            <Input
              id="engineSetup"
              onChange={(event) => updateBoatField("engineSetup", event.target.value)}
              value={value.boatInfo?.engineSetup || ""}
            />
          </div>

          <div className="grid gap-3 rounded-[22px] border border-white/8 bg-white/4 p-4 md:col-span-2 md:grid-cols-2">
            <BoatCheckbox
              checked={value.boatInfo?.fightingChair}
              label={t("overview.fightingChair")}
              onChange={(nextValue) => updateBoatField("fightingChair", nextValue)}
            />
            <BoatCheckbox
              checked={value.boatInfo?.liveBaitTank}
              label={t("overview.liveBaitTank")}
              onChange={(nextValue) => updateBoatField("liveBaitTank", nextValue)}
            />
            <BoatCheckbox
              checked={value.boatInfo?.outriggers}
              label={t("overview.outriggers")}
              onChange={(nextValue) => updateBoatField("outriggers", nextValue)}
            />
            <BoatCheckbox
              checked={value.boatInfo?.birdRadar}
              label={t("overview.birdRadar")}
              onChange={(nextValue) => updateBoatField("birdRadar", nextValue)}
            />
            <BoatCheckbox
              checked={value.boatInfo?.tunaTubes}
              label={t("overview.tunaTubes")}
              onChange={(nextValue) => updateBoatField("tunaTubes", nextValue)}
            />
            <BoatCheckbox
              checked={value.boatInfo?.hasCabin}
              label={t("overview.cabin")}
              onChange={(nextValue) => updateBoatField("hasCabin", nextValue)}
            />
            <BoatCheckbox
              checked={value.boatInfo?.hasToilet}
              label={t("overview.toilet")}
              onChange={(nextValue) => updateBoatField("hasToilet", nextValue)}
            />
          </div>
        </div>
      </details>

      <section className="panel-section space-y-4 rounded-[28px] p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="eyebrow">{t("form.gallery")}</p>
            <p className="mt-1 text-sm text-white/62">
              {t("form.galleryDescription")}
            </p>
          </div>

          <div className="flex gap-2">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs uppercase tracking-[0.22em] text-white/72 transition hover:bg-white/8">
              <UploadCloud className="size-4" />
              {t("form.upload")}
              <input
                accept="image/*"
                className="hidden"
                multiple
                onChange={handleImageUpload}
                type="file"
              />
            </label>
            <Button onClick={addPhotoRow} type="button" variant="secondary">
              <Plus className="size-4" />
              {t("form.addUrl")}
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {value.photos.length === 0 ? (
            <div className="rounded-[22px] border border-dashed border-white/12 bg-white/4 p-5 text-sm text-white/52">
              {t("form.emptyGallery")}
            </div>
          ) : null}

          {value.photos.map((photo) => (
            <div
              className="rounded-[24px] border border-white/8 bg-white/5 p-4"
              key={photo.id}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <ImagePlus className="size-4 text-gold-300" />
                  <p className="text-sm uppercase tracking-[0.22em] text-white/55">
                    {t("form.photoItem")}
                  </p>
                </div>
                <button
                  className="rounded-full border border-white/10 p-2 text-white/55 transition hover:border-red-300/20 hover:text-red-200"
                  onClick={() => removePhoto(photo.id)}
                  type="button"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>

              <div className="mt-4 grid gap-3">
                <Input
                  onChange={(event) => updatePhoto(photo.id, "url", event.target.value)}
                  placeholder="https://..."
                  value={photo.url}
                />
                <Input
                  onChange={(event) => updatePhoto(photo.id, "caption", event.target.value)}
                  placeholder={t("form.caption")}
                  value={photo.caption || ""}
                />
                <Input
                  onChange={(event) => updatePhoto(photo.id, "alt", event.target.value)}
                  placeholder={t("form.altText")}
                  value={photo.alt || ""}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="flex items-center justify-end gap-3">
        <Button onClick={onCancel} type="button" variant="ghost">
          {t("common.cancel")}
        </Button>
        <Button disabled={!value.title.trim() || !value.country.trim()} type="submit">
          {t("form.saveDestination")}
        </Button>
      </div>
    </form>
  );
}

function buildLocationQuery(value: Destination) {
  return [value.city, value.region, value.country].filter(Boolean).join(", ");
}

function BoatCheckbox({
  checked,
  label,
  onChange
}: {
  checked?: boolean;
  label: string;
  onChange: (nextValue: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#06121c] px-4 py-3 text-sm text-white/72">
      <input
        checked={Boolean(checked)}
        className="size-4 rounded border-white/20 bg-transparent"
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
      {label}
    </label>
  );
}
