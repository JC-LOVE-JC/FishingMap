"use client";

import { useEffect, useState } from "react";

import { ExternalLink, LoaderCircle, Waves, Wind } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { translateWeatherCondition, useLanguage } from "@/lib/i18n";
import type { Destination } from "@/lib/types";
import {
  buildWindyUrl,
  formatForecastDay,
  formatWindDirection,
  getWeatherCodeLabel,
  type WeatherForecastResponse
} from "@/lib/weather";

type WeatherForecastCardProps = {
  destination: Destination;
};

export function WeatherForecastCard({ destination }: WeatherForecastCardProps) {
  const { language, locale, t } = useLanguage();
  const [forecast, setForecast] = useState<WeatherForecastResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function loadForecast() {
      setIsLoading(true);
      setHasError(false);

      try {
        const response = await fetch(
          `/api/weather-forecast?lat=${destination.lat}&lng=${destination.lng}&waterType=${destination.waterType || "saltwater"}`
        );

        if (!response.ok) {
          throw new Error("Unable to load weather");
        }

        const payload = (await response.json()) as WeatherForecastResponse;

        if (!ignore) {
          setForecast(payload);
        }
      } catch {
        if (!ignore) {
          setForecast(null);
          setHasError(true);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadForecast();

    return () => {
      ignore = true;
    };
  }, [destination.id, destination.lat, destination.lng, destination.waterType]);

  const windyUrl = buildWindyUrl(
    destination.lat,
    destination.lng,
    destination.waterType || "saltwater"
  );

  return (
    <div className="panel-section rounded-[28px] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow">{t("weather.forecast")}</p>
          <p className="mt-2 text-sm leading-6 text-white/68">
            {t("weather.description")}
          </p>
        </div>
        <a
          className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-[#0b170d] px-4 py-2 text-xs uppercase tracking-[0.22em] text-white/78 transition hover:bg-[#132116] hover:text-white"
          href={windyUrl}
          rel="noreferrer"
          target="_blank"
        >
          {t("weather.openWindy")}
          <ExternalLink className="size-3.5" />
        </a>
      </div>

      {isLoading ? (
        <div className="mt-5 flex items-center gap-3 rounded-[22px] border border-white/6 bg-[#0a150c] px-4 py-4 text-sm text-white/68">
          <LoaderCircle className="size-4 animate-spin" />
          {t("weather.loading")}
        </div>
      ) : hasError || !forecast ? (
        <div className="mt-5 rounded-[22px] border border-white/6 bg-[#0a150c] px-4 py-4 text-sm text-white/68">
          {t("weather.unavailable")}
        </div>
      ) : (
        <div className="mt-5 space-y-5">
          <div className="grid gap-3 md:grid-cols-4">
            <MetricTile
              label={t("weather.now")}
              value={formatTemperature(forecast.current.temperature)}
              caption={translateWeatherCondition(
                forecast.current.conditionLabel || getWeatherCodeLabel(forecast.current.weatherCode),
                language
              )}
            />
            <MetricTile
              label={t("weather.feelsLike")}
              value={formatTemperature(forecast.current.apparentTemperature)}
              caption={t("weather.apparentTemperature")}
            />
            <MetricTile
              label={t("weather.wind")}
              value={formatWind(forecast.current.windSpeed)}
              caption={formatWindDirection(forecast.current.windDirection)}
            />
            <MetricTile
              label={t("weather.rain")}
              value={formatPrecipitation(forecast.current.precipitation)}
              caption={t("weather.currentPrecipitation")}
            />
          </div>

          {forecast.marineCurrent ? (
            <div className="grid gap-3 md:grid-cols-4">
              <MetricTile
                label={t("weather.wave")}
                value={formatMeters(forecast.marineCurrent.waveHeight)}
                caption={t("weather.significantHeight")}
              />
              <MetricTile
                label={t("weather.swell")}
                value={formatMeters(forecast.marineCurrent.swellWaveHeight)}
                caption={t("weather.primarySwell")}
              />
              <MetricTile
                label={t("weather.period")}
                value={formatSeconds(forecast.marineCurrent.wavePeriod)}
                caption={t("weather.wavePeriod")}
              />
              <MetricTile
                label={t("weather.seaTemp")}
                value={formatTemperature(forecast.marineCurrent.seaSurfaceTemperature)}
                caption={t("weather.surfaceWater")}
              />
            </div>
          ) : null}

          <div>
            <p className="eyebrow">{t("weather.nextDays")}</p>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              {forecast.daily.slice(0, 3).map((day) => (
                <div className="rounded-[22px] border border-white/6 bg-[#0a150c] p-4" key={day.date}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-white">{formatForecastDay(day.date, locale)}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/40">
                        {translateWeatherCondition(
                          day.conditionLabel || getWeatherCodeLabel(day.weatherCode),
                          language
                        )}
                      </p>
                    </div>
                    <Badge>{formatTemperature(day.temperatureMax)} / {formatTemperature(day.temperatureMin)}</Badge>
                  </div>
                  <div className="mt-4 space-y-2 text-sm text-white/72">
                    <div className="flex items-center justify-between gap-3">
                      <span className="inline-flex items-center gap-2">
                        <Wind className="size-3.5" />
                        {t("weather.wind")}
                      </span>
                      <span>{formatWind(day.windSpeedMax)}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span>{t("weather.rainChance")}</span>
                      <span>{formatPercent(day.precipitationProbabilityMax)}</span>
                    </div>
                    {destination.waterType === "saltwater" ? (
                      <div className="flex items-center justify-between gap-3">
                        <span className="inline-flex items-center gap-2">
                          <Waves className="size-3.5" />
                          {t("weather.waveMax")}
                        </span>
                        <span>{formatMeters(day.waveHeightMax)}</span>
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricTile({
  caption,
  label,
  value
}: {
  caption: string;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[22px] border border-white/6 bg-[#0a150c] p-4">
      <p className="eyebrow">{label}</p>
      <p className="mt-2 font-display text-2xl text-white">{value}</p>
      <p className="mt-1 text-sm text-white/58">{caption}</p>
    </div>
  );
}

function formatTemperature(value: number | null) {
  return value == null ? "N/A" : `${Math.round(value)}°C`;
}

function formatWind(value: number | null) {
  return value == null ? "N/A" : `${Math.round(value)} km/h`;
}

function formatPrecipitation(value: number | null) {
  return value == null ? "N/A" : `${value.toFixed(1)} mm`;
}

function formatPercent(value: number | null) {
  return value == null ? "N/A" : `${Math.round(value)}%`;
}

function formatMeters(value?: number | null) {
  return value == null ? "N/A" : `${value.toFixed(1)} m`;
}

function formatSeconds(value?: number | null) {
  return value == null ? "N/A" : `${value.toFixed(1)} s`;
}
