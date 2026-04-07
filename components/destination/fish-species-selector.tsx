"use client";

import { useEffect, useState } from "react";

import { LoaderCircle, Plus, Search, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/lib/i18n";
import type { WaterType } from "@/lib/types";

type FishSpeciesSuggestion = {
  id: string;
  imageUrl: string | null;
  name: string;
  wikiTitle: string;
};

type FishSpeciesSelectorProps = {
  inputId?: string;
  onChange: (species: string[]) => void;
  value: string[];
  waterType?: WaterType;
};

export function FishSpeciesSelector({
  inputId,
  onChange,
  value,
  waterType
}: FishSpeciesSelectorProps) {
  const { language, t } = useLanguage();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FishSpeciesSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [imageLookup, setImageLookup] = useState<Record<string, string | null>>({});

  useEffect(() => {
    const trimmed = query.trim();

    if (trimmed.length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setIsLoading(true);

      try {
        const params = new URLSearchParams({
          q: trimmed
        });

        if (waterType) {
          params.set("waterType", waterType);
        }

        const response = await fetch(`/api/fish-species-search?${params.toString()}`, {
          signal: controller.signal
        });
        const payload = await response.json();

        if (!controller.signal.aborted) {
          setResults((payload.results ?? []) as FishSpeciesSuggestion[]);
        }
      } catch {
        if (!controller.signal.aborted) {
          setResults([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, 180);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [query, waterType]);

  useEffect(() => {
    const missing = value.filter((item) => imageLookup[item] === undefined);

    if (!missing.length) {
      return;
    }

    let cancelled = false;

    void Promise.all(
      missing.map(async (name) => {
        try {
          const response = await fetch(`/api/fish-species-search?q=${encodeURIComponent(name)}`);
          const payload = await response.json();
          const exact = ((payload.results ?? []) as FishSpeciesSuggestion[]).find(
            (entry) => entry.name.toLowerCase() === name.toLowerCase()
          );

          return [name, exact?.imageUrl || null] as const;
        } catch {
          return [name, null] as const;
        }
      })
    ).then((pairs) => {
      if (cancelled) {
        return;
      }

      setImageLookup((current) => {
        const next = { ...current };

        for (const [name, imageUrl] of pairs) {
          next[name] = imageUrl;
        }

        return next;
      });
    });

    return () => {
      cancelled = true;
    };
  }, [imageLookup, value]);

  function addSpecies(name: string) {
    const trimmed = name.trim();

    if (!trimmed) {
      return;
    }

    if (value.some((item) => item.toLowerCase() === trimmed.toLowerCase())) {
      setQuery("");
      setResults([]);
      return;
    }

    onChange([...value, trimmed]);
    setQuery("");
    setResults([]);
  }

  function removeSpecies(name: string) {
    onChange(value.filter((item) => item !== name));
  }

  const canAddCustom =
    query.trim().length > 1 &&
    !value.some((item) => item.toLowerCase() === query.trim().toLowerCase()) &&
    !results.some((item) => item.name.toLowerCase() === query.trim().toLowerCase());

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-white/40" />
        <Input
          id={inputId}
          className="pl-11 pr-11"
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("form.speciesPlaceholder")}
          value={query}
        />
        {isLoading ? (
          <LoaderCircle className="absolute right-4 top-1/2 size-4 -translate-y-1/2 animate-spin text-white/40" />
        ) : null}

        {(results.length > 0 || canAddCustom) && (
          <div className="absolute inset-x-0 top-[calc(100%+0.65rem)] z-20 overflow-hidden rounded-[24px] border border-white/8 bg-[#04111b]/98 shadow-[0_24px_60px_rgba(0,0,0,0.42)] backdrop-blur-2xl">
            {results.map((result) => (
              <button
                className="flex w-full items-center gap-3 border-b border-white/6 px-4 py-3 text-left transition last:border-b-0 hover:bg-[#102014]"
                key={result.id}
                onClick={() => {
                  setImageLookup((current) => ({
                    ...current,
                    [result.name]: result.imageUrl
                  }));
                  addSpecies(result.name);
                }}
                type="button"
              >
                <img
                  alt={result.name}
                  className="h-12 w-12 shrink-0 rounded-2xl border border-white/8 bg-[#08130d] object-cover"
                  src={result.imageUrl || "/fish-placeholder.svg"}
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-white">{result.name}</span>
                  <span className="mt-1 block truncate text-xs uppercase tracking-[0.16em] text-white/38">
                    {result.wikiTitle}
                  </span>
                </span>
              </button>
            ))}

            {canAddCustom ? (
              <button
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-[#102014]"
                onClick={() => addSpecies(query)}
                type="button"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/8 bg-[#08130d] text-white/70">
                  <Plus className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-white">
                    {language === "zh" ? `添加“${query.trim()}”` : `Add "${query.trim()}"`}
                  </span>
                  <span className="mt-1 block text-xs uppercase tracking-[0.16em] text-white/38">
                    {language === "zh" ? "自定义鱼种" : "Custom species"}
                  </span>
                </span>
              </button>
            ) : null}
          </div>
        )}
      </div>

      <div className="space-y-2">
        {value.length ? (
          value.map((item) => (
            <div
              className="flex items-center gap-3 rounded-[22px] border border-white/8 bg-[#08130d] px-3 py-3"
              key={item}
            >
                <img
                  alt={item}
                  className="h-12 w-12 shrink-0 rounded-2xl border border-white/8 bg-[#08130d] object-cover"
                  src={imageLookup[item] || "/fish-placeholder.svg"}
                />
              <span className="min-w-0 flex-1 text-sm font-medium text-white">{item}</span>
              <Button onClick={() => removeSpecies(item)} type="button" variant="ghost">
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))
        ) : (
          <div className="rounded-[22px] border border-dashed border-white/10 bg-white/4 px-4 py-4 text-sm text-white/52">
            {language === "zh" ? "从下拉结果里挑选鱼种，已选项目会按行列在这里。" : "Pick species from the search results. Selected fish will stack here row by row."}
          </div>
        )}
      </div>
    </div>
  );
}
