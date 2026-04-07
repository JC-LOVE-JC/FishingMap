"use client";

import { useMemo, useState } from "react";

import { Check, ChevronDown, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/i18n";
import { TECHNIQUE_OPTIONS } from "@/lib/fishing-catalog";
import { cn } from "@/lib/utils";

type TechniqueSelectorProps = {
  inputId?: string;
  onChange: (techniques: string[]) => void;
  value: string[];
};

export function TechniqueSelector({ inputId, onChange, value }: TechniqueSelectorProps) {
  const { language } = useLanguage();
  const [open, setOpen] = useState(false);

  const selectedSet = useMemo(() => new Set(value.map((item) => item.toLowerCase())), [value]);

  function toggleTechnique(option: string) {
    if (selectedSet.has(option.toLowerCase())) {
      onChange(value.filter((item) => item.toLowerCase() !== option.toLowerCase()));
      return;
    }

    onChange([...value, option]);
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Button
          aria-controls={inputId ? `${inputId}-menu` : undefined}
          aria-expanded={open}
          className="w-full justify-between"
          onClick={() => setOpen((current) => !current)}
          type="button"
          variant="secondary"
        >
          <span>
            {language === "zh" ? "选择钓法" : "Select techniques"}
          </span>
          <ChevronDown className={cn("size-4 transition", open ? "rotate-180" : "rotate-0")} />
        </Button>

        {open ? (
          <div className="absolute inset-x-0 top-[calc(100%+0.65rem)] z-20 overflow-hidden rounded-[24px] border border-white/8 bg-[#04111b]/98 shadow-[0_24px_60px_rgba(0,0,0,0.42)] backdrop-blur-2xl" id={inputId ? `${inputId}-menu` : undefined}>
            {TECHNIQUE_OPTIONS.map((option) => {
              const selected = selectedSet.has(option.toLowerCase());

              return (
                <button
                  className={cn(
                    "flex w-full items-center justify-between gap-3 border-b border-white/6 px-4 py-3 text-left transition last:border-b-0",
                    selected ? "bg-[#102014]" : "hover:bg-[#102014]"
                  )}
                  key={option}
                  onClick={() => toggleTechnique(option)}
                  type="button"
                >
                  <span className="text-sm font-medium text-white">{option}</span>
                  <span className={cn(
                    "inline-flex size-5 items-center justify-center rounded-full border",
                    selected ? "border-emerald-400/35 bg-emerald-500/18 text-emerald-100" : "border-white/12 text-white/30"
                  )}>
                    <Check className="size-3.5" />
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {value.length ? (
          value.map((item) => (
            <span
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#08130d] px-3 py-2 text-sm text-white/86"
              key={item}
            >
              {item}
              <button
                className="rounded-full text-white/52 transition hover:text-white"
                onClick={() => toggleTechnique(item)}
                type="button"
              >
                <X className="size-3.5" />
              </button>
            </span>
          ))
        ) : (
          <div className="rounded-[22px] border border-dashed border-white/10 bg-white/4 px-4 py-4 text-sm text-white/52">
            {language === "zh" ? "从固定列表里勾选钓法，已选项目会显示成标签。" : "Choose from the preset list. Selected techniques will appear as tags."}
          </div>
        )}
      </div>
    </div>
  );
}
