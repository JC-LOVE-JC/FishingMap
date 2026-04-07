import type { WaterType } from "@/lib/types";

export type ForecastSnapshot = {
  time: string;
  temperature: number | null;
  apparentTemperature: number | null;
  windSpeed: number | null;
  windDirection: number | null;
  precipitation: number | null;
  precipitationProbability: number | null;
  weatherCode: number | null;
  conditionLabel?: string | null;
};

export type MarineSnapshot = {
  waveHeight: number | null;
  swellWaveHeight: number | null;
  wavePeriod: number | null;
  seaSurfaceTemperature: number | null;
};

export type DailyForecast = {
  date: string;
  temperatureMax: number | null;
  temperatureMin: number | null;
  windSpeedMax: number | null;
  precipitationProbabilityMax: number | null;
  weatherCode: number | null;
  conditionLabel?: string | null;
  waveHeightMax?: number | null;
  swellWaveHeightMax?: number | null;
  wavePeriodMax?: number | null;
};

export type WeatherForecastResponse = {
  current: ForecastSnapshot;
  daily: DailyForecast[];
  hourly: ForecastSnapshot[];
  marineCurrent?: MarineSnapshot | null;
};

export function formatWindDirection(direction?: number | null) {
  if (direction == null || Number.isNaN(direction)) {
    return "N/A";
  }

  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return directions[Math.round(direction / 45) % 8];
}

export function formatForecastDay(date: string, locale = "en-US") {
  return new Date(`${date}T00:00:00`).toLocaleDateString(locale, {
    weekday: "short",
    month: "short",
    day: "numeric"
  });
}

export function formatForecastHour(dateTime: string, locale = "en-US") {
  return new Date(dateTime).toLocaleTimeString(locale, {
    hour: "numeric"
  });
}

export function getWeatherCodeLabel(code?: number | null) {
  if (code == null || Number.isNaN(code)) {
    return "Forecast unavailable";
  }

  const exactMatch = WEATHER_CODE_LABELS[code];

  if (exactMatch) {
    return exactMatch;
  }

  if (code >= 95) {
    return "Thunderstorm";
  }

  return "Mixed conditions";
}

export function buildWindyUrl(
  lat: number,
  lng: number,
  waterType: WaterType = "saltwater"
) {
  const overlay = waterType === "saltwater" ? "waves" : "wind";
  return `https://www.windy.com/?${overlay},${lat.toFixed(2)},${lng.toFixed(2)},6`;
}

const WEATHER_CODE_LABELS: Record<number, string> = {
  0: "Clear sky",
  1: "Mostly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Fog",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Drizzle",
  55: "Dense drizzle",
  56: "Freezing drizzle",
  57: "Dense freezing drizzle",
  61: "Light rain",
  63: "Rain",
  65: "Heavy rain",
  66: "Freezing rain",
  67: "Heavy freezing rain",
  71: "Light snow",
  73: "Snow",
  75: "Heavy snow",
  77: "Snow grains",
  80: "Rain showers",
  81: "Heavy showers",
  82: "Violent showers",
  85: "Snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with hail",
  99: "Severe thunderstorm"
};
