import { NextRequest, NextResponse } from "next/server";

import type { WaterType } from "@/lib/types";
import type {
  DailyForecast,
  ForecastSnapshot,
  MarineSnapshot,
  WeatherForecastResponse
} from "@/lib/weather";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const lat = Number(request.nextUrl.searchParams.get("lat"));
  const lng = Number(request.nextUrl.searchParams.get("lng"));
  const waterType = (request.nextUrl.searchParams.get("waterType") as WaterType | null) || "saltwater";

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  }

  try {
    const [forecastResponse, marineResponse] = await Promise.all([
      fetchBestWeatherForecast(lat, lng),
      waterType === "saltwater" ? fetchMarineForecast(lat, lng) : Promise.resolve(null)
    ]);

    const payload: WeatherForecastResponse = {
      current: getCurrentForecast(forecastResponse),
      daily: getDailyForecasts(forecastResponse, marineResponse),
      hourly: getHourlyForecasts(forecastResponse),
      marineCurrent: waterType === "saltwater" ? getMarineCurrent(marineResponse) : null
    };

    return NextResponse.json(payload);
  } catch {
    return NextResponse.json({ error: "Unable to load forecast" }, { status: 500 });
  }
}

async function fetchBestWeatherForecast(lat: number, lng: number) {
  try {
    return await fetchMetNoForecast(lat, lng);
  } catch {
    return fetchOpenMeteoForecast(lat, lng);
  }
}

async function fetchOpenMeteoForecast(lat: number, lng: number) {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    timezone: "auto",
    forecast_days: "5",
    forecast_hours: "24",
    current: [
      "temperature_2m",
      "apparent_temperature",
      "precipitation",
      "weather_code",
      "wind_speed_10m",
      "wind_direction_10m"
    ].join(","),
    daily: [
      "weather_code",
      "temperature_2m_max",
      "temperature_2m_min",
      "precipitation_probability_max",
      "wind_speed_10m_max"
    ].join(","),
    hourly: [
      "temperature_2m",
      "weather_code",
      "precipitation_probability",
      "wind_speed_10m",
      "wind_direction_10m"
    ].join(",")
  });
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`, {
    headers: {
      Accept: "application/json"
    },
    next: { revalidate: 60 * 30 }
  });

  if (!response.ok) {
    throw new Error("Weather forecast request failed");
  }

  return {
    provider: "open-meteo" as const,
    payload: (await response.json()) as OpenMeteoForecastResponse
  };
}

async function fetchMetNoForecast(lat: number, lng: number) {
  const response = await fetch(
    `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${lat}&lon=${lng}`,
    {
      headers: {
        Accept: "application/json",
        "User-Agent": "FishingTravelPlanner/0.1 (weather integration)"
      },
      next: { revalidate: 60 * 30 }
    }
  );

  if (!response.ok) {
    throw new Error("MET Norway forecast request failed");
  }

  return {
    provider: "metno" as const,
    payload: (await response.json()) as MetNoForecastResponse
  };
}

async function fetchMarineForecast(lat: number, lng: number) {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    timezone: "auto",
    forecast_days: "5",
    forecast_hours: "24",
    hourly: [
      "wave_height",
      "swell_wave_height",
      "wave_period",
      "sea_surface_temperature"
    ].join(","),
    daily: [
      "wave_height_max",
      "swell_wave_height_max",
      "wave_period_max"
    ].join(",")
  });
  const response = await fetch(`https://marine-api.open-meteo.com/v1/marine?${params.toString()}`, {
    headers: {
      Accept: "application/json"
    },
    next: { revalidate: 60 * 30 }
  });

  if (!response.ok) {
    throw new Error("Marine forecast request failed");
  }

  return response.json() as Promise<OpenMeteoMarineResponse>;
}

function getCurrentForecast(data: WeatherProviderPayload): ForecastSnapshot {
  if (data.provider === "metno") {
    const current = data.payload.properties?.timeseries?.[0];
    const details = current?.data?.instant?.details;
    const summary = current?.data?.next_1_hours?.summary?.symbol_code || current?.data?.next_6_hours?.summary?.symbol_code;

    return {
      time: current?.time || "",
      temperature: numberOrNull(details?.air_temperature),
      apparentTemperature: null,
      windSpeed: numberOrNull(details?.wind_speed),
      windDirection: numberOrNull(details?.wind_from_direction),
      precipitation: numberOrNull(current?.data?.next_1_hours?.details?.precipitation_amount ?? current?.data?.next_6_hours?.details?.precipitation_amount),
      precipitationProbability: null,
      weatherCode: null,
      conditionLabel: symbolCodeToLabel(summary)
    };
  }

  const source = data.payload;

  return {
    time: source.current?.time || "",
    temperature: numberOrNull(source.current?.temperature_2m),
    apparentTemperature: numberOrNull(source.current?.apparent_temperature),
    windSpeed: numberOrNull(source.current?.wind_speed_10m),
    windDirection: numberOrNull(source.current?.wind_direction_10m),
    precipitation: numberOrNull(source.current?.precipitation),
    precipitationProbability: null,
    weatherCode: numberOrNull(source.current?.weather_code),
    conditionLabel: null
  };
}

function getHourlyForecasts(data: WeatherProviderPayload) {
  if (data.provider === "metno") {
    const timeseries = data.payload.properties?.timeseries ?? [];

    return timeseries.slice(0, 12).map((item) => ({
      time: item.time || "",
      temperature: numberOrNull(item.data?.instant?.details?.air_temperature),
      apparentTemperature: null,
      windSpeed: numberOrNull(item.data?.instant?.details?.wind_speed),
      windDirection: numberOrNull(item.data?.instant?.details?.wind_from_direction),
      precipitation: numberOrNull(item.data?.next_1_hours?.details?.precipitation_amount ?? item.data?.next_6_hours?.details?.precipitation_amount),
      precipitationProbability: null,
      weatherCode: null,
      conditionLabel: symbolCodeToLabel(item.data?.next_1_hours?.summary?.symbol_code || item.data?.next_6_hours?.summary?.symbol_code)
    }));
  }

  const source = data.payload;
  const times = source.hourly?.time ?? [];

  return times.slice(0, 12).map((time, index) => ({
    time,
    temperature: numberOrNull(source.hourly?.temperature_2m?.[index]),
    apparentTemperature: null,
    windSpeed: numberOrNull(source.hourly?.wind_speed_10m?.[index]),
    windDirection: numberOrNull(source.hourly?.wind_direction_10m?.[index]),
    precipitation: null,
    precipitationProbability: numberOrNull(source.hourly?.precipitation_probability?.[index]),
    weatherCode: numberOrNull(source.hourly?.weather_code?.[index]),
    conditionLabel: null
  }));
}

function getDailyForecasts(
  data: WeatherProviderPayload,
  marine: OpenMeteoMarineResponse | null
): DailyForecast[] {
  if (data.provider === "metno") {
    const groups = groupMetNoByDay(data.payload.properties?.timeseries ?? []);

    return groups.slice(0, 5).map((group, index) => ({
      date: group.date,
      temperatureMax: maxOf(group.items.map((item) => numberOrNull(item.data?.instant?.details?.air_temperature))),
      temperatureMin: minOf(group.items.map((item) => numberOrNull(item.data?.instant?.details?.air_temperature))),
      windSpeedMax: maxOf(group.items.map((item) => numberOrNull(item.data?.instant?.details?.wind_speed))),
      precipitationProbabilityMax: null,
      weatherCode: null,
      conditionLabel: symbolCodeToLabel(
        group.items.find((item) => item.data?.next_6_hours?.summary?.symbol_code)?.data?.next_6_hours?.summary?.symbol_code ||
          group.items.find((item) => item.data?.next_1_hours?.summary?.symbol_code)?.data?.next_1_hours?.summary?.symbol_code
      ),
      waveHeightMax: numberOrNull(marine?.daily?.wave_height_max?.[index]),
      swellWaveHeightMax: numberOrNull(marine?.daily?.swell_wave_height_max?.[index]),
      wavePeriodMax: numberOrNull(marine?.daily?.wave_period_max?.[index])
    }));
  }

  const source = data.payload;
  const times = source.daily?.time ?? [];

  return times.map((date, index) => ({
    date,
    temperatureMax: numberOrNull(source.daily?.temperature_2m_max?.[index]),
    temperatureMin: numberOrNull(source.daily?.temperature_2m_min?.[index]),
    windSpeedMax: numberOrNull(source.daily?.wind_speed_10m_max?.[index]),
    precipitationProbabilityMax: numberOrNull(source.daily?.precipitation_probability_max?.[index]),
    weatherCode: numberOrNull(source.daily?.weather_code?.[index]),
    conditionLabel: null,
    waveHeightMax: numberOrNull(marine?.daily?.wave_height_max?.[index]),
    swellWaveHeightMax: numberOrNull(marine?.daily?.swell_wave_height_max?.[index]),
    wavePeriodMax: numberOrNull(marine?.daily?.wave_period_max?.[index])
  }));
}

function getMarineCurrent(data: OpenMeteoMarineResponse | null): MarineSnapshot | null {
  if (!data?.hourly?.time?.length) {
    return null;
  }

  return {
    waveHeight: numberOrNull(data.hourly.wave_height?.[0]),
    swellWaveHeight: numberOrNull(data.hourly.swell_wave_height?.[0]),
    wavePeriod: numberOrNull(data.hourly.wave_period?.[0]),
    seaSurfaceTemperature: numberOrNull(data.hourly.sea_surface_temperature?.[0])
  };
}

function numberOrNull(value?: number | null) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function maxOf(values: Array<number | null>) {
  const filtered = values.filter((value): value is number => value != null);
  return filtered.length ? Math.max(...filtered) : null;
}

function minOf(values: Array<number | null>) {
  const filtered = values.filter((value): value is number => value != null);
  return filtered.length ? Math.min(...filtered) : null;
}

function groupMetNoByDay(timeseries: MetNoTimeseries[]) {
  const groups = new globalThis.Map<string, MetNoTimeseries[]>();

  for (const item of timeseries) {
    const date = item.time?.slice(0, 10);

    if (!date) {
      continue;
    }

    const bucket = groups.get(date) ?? [];
    bucket.push(item);
    groups.set(date, bucket);
  }

  return [...groups.entries()].map(([date, items]) => ({ date, items }));
}

function symbolCodeToLabel(symbolCode?: string | null) {
  if (!symbolCode) {
    return null;
  }

  const normalized = symbolCode.replace(/_(day|night|polartwilight)$/i, "");
  const labels: Array<[string, string]> = [
    ["clearsky", "Clear sky"],
    ["fair", "Fair"],
    ["partlycloudy", "Partly cloudy"],
    ["cloudy", "Cloudy"],
    ["fog", "Fog"],
    ["heavyrainshowers", "Heavy showers"],
    ["rainshowers", "Rain showers"],
    ["heavyrain", "Heavy rain"],
    ["lightrain", "Light rain"],
    ["rain", "Rain"],
    ["lightsleet", "Light sleet"],
    ["sleet", "Sleet"],
    ["lightsnow", "Light snow"],
    ["snow", "Snow"],
    ["thunder", "Thunderstorm"]
  ];

  return labels.find(([key]) => normalized.includes(key))?.[1] || normalized.replace(/([a-z])([A-Z])/g, "$1 $2");
}

type OpenMeteoForecastResponse = {
  current?: {
    time?: string;
    temperature_2m?: number;
    apparent_temperature?: number;
    precipitation?: number;
    weather_code?: number;
    wind_speed_10m?: number;
    wind_direction_10m?: number;
  };
  hourly?: {
    time?: string[];
    temperature_2m?: number[];
    weather_code?: number[];
    precipitation_probability?: number[];
    wind_speed_10m?: number[];
    wind_direction_10m?: number[];
  };
  daily?: {
    time?: string[];
    weather_code?: number[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    precipitation_probability_max?: number[];
    wind_speed_10m_max?: number[];
  };
};

type OpenMeteoMarineResponse = {
  hourly?: {
    time?: string[];
    wave_height?: number[];
    swell_wave_height?: number[];
    wave_period?: number[];
    sea_surface_temperature?: number[];
  };
  daily?: {
    wave_height_max?: number[];
    swell_wave_height_max?: number[];
    wave_period_max?: number[];
  };
};

type WeatherProviderPayload =
  | {
      provider: "metno";
      payload: MetNoForecastResponse;
    }
  | {
      provider: "open-meteo";
      payload: OpenMeteoForecastResponse;
    };

type MetNoForecastResponse = {
  properties?: {
    timeseries?: MetNoTimeseries[];
  };
};

type MetNoTimeseries = {
  time?: string;
  data?: {
    instant?: {
      details?: {
        air_temperature?: number;
        wind_speed?: number;
        wind_from_direction?: number;
      };
    };
    next_1_hours?: {
      summary?: {
        symbol_code?: string;
      };
      details?: {
        precipitation_amount?: number;
      };
    };
    next_6_hours?: {
      summary?: {
        symbol_code?: string;
      };
      details?: {
        precipitation_amount?: number;
      };
    };
  };
};
