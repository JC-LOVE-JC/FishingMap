"use client";

import type { ComponentType, FormEvent } from "react";

import { CarFront, Plane, ShipWheel } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getTransportModeLabel, useLanguage } from "@/lib/i18n";
import type { TransportMode, TransportSegment } from "@/lib/types";
import { TRANSPORT_MODE_META, cn } from "@/lib/utils";

const modeIcons = {
  flight: Plane,
  boat: ShipWheel,
  drive: CarFront
} satisfies Record<TransportMode, ComponentType<{ className?: string }>>;

type TransportFormProps = {
  fromLabel: string;
  onCancel: () => void;
  onChange: (segment: TransportSegment) => void;
  onSave: () => void;
  toLabel: string;
  value: TransportSegment;
};

export function TransportForm({
  fromLabel,
  onCancel,
  onChange,
  onSave,
  toLabel,
  value
}: TransportFormProps) {
  const { language, t } = useLanguage();

  function updateField<Key extends keyof TransportSegment>(
    key: Key,
    nextValue: TransportSegment[Key]
  ) {
    onChange({
      ...value,
      [key]: nextValue
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave();
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow">{t("transport.segment")}</p>
          <h2 className="mt-2 font-display text-3xl text-white">{t("transport.editRouteLeg")}</h2>
          <p className="mt-2 text-sm leading-6 text-white/68">
            {fromLabel} {t("map.to")} {toLabel}
          </p>
        </div>
        <Badge>{t("transport.routeEditor")}</Badge>
      </div>

      <section className="panel-section space-y-4 rounded-[28px] p-4">
        <p className="eyebrow">{t("transport.mode")}</p>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(modeIcons) as TransportMode[]).map((mode) => {
            const Icon = modeIcons[mode];
            const meta = TRANSPORT_MODE_META[mode];

            return (
              <button
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs uppercase tracking-[0.22em] transition",
                  value.mode === mode
                    ? meta.accentClassName
                    : "border-white/10 bg-white/5 text-white/55 hover:bg-white/8"
                )}
                key={mode}
                onClick={() => updateField("mode", mode)}
                type="button"
              >
                <Icon className="size-4" />
                {getTransportModeLabel(mode, language)}
              </button>
            );
          })}
        </div>
      </section>

      <section className="space-y-4">
        <div className="space-y-2">
          <label className="eyebrow" htmlFor="segmentName">
            {t("transport.name")}
          </label>
          <Input
            id="segmentName"
            onChange={(event) => updateField("name", event.target.value)}
            placeholder={t("transport.namePlaceholder")}
            value={value.name}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="eyebrow" htmlFor="departureTime">
              {t("transport.time")}
            </label>
            <Input
              id="departureTime"
              onChange={(event) => updateField("departureTime", event.target.value)}
              placeholder="2026-10-19 07:15"
              value={value.departureTime || ""}
            />
          </div>

          <div className="space-y-2">
            <label className="eyebrow" htmlFor="duration">
              {t("transport.duration")}
            </label>
            <Input
              id="duration"
              onChange={(event) => updateField("duration", event.target.value)}
              placeholder="1h 35m"
              value={value.duration || ""}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="eyebrow" htmlFor="transportNotes">
            {t("transport.notes")}
          </label>
          <Textarea
            id="transportNotes"
            onChange={(event) => updateField("notes", event.target.value)}
            placeholder={t("transport.notesPlaceholder")}
            rows={4}
            value={value.notes || ""}
          />
        </div>
      </section>

      <div className="flex items-center justify-end gap-3">
        <Button onClick={onCancel} type="button" variant="ghost">
          {t("common.cancel")}
        </Button>
        <Button type="submit">{t("transport.save")}</Button>
      </div>
    </form>
  );
}
