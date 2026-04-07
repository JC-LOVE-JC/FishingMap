"use client";

import { useEffect, useState } from "react";

import { motion } from "framer-motion";

import { useLanguage } from "@/lib/i18n";
import type { PhotoItem } from "@/lib/types";
import { cn } from "@/lib/utils";

type PhotoGalleryProps = {
  photos: PhotoItem[];
  title: string;
};

export function PhotoGallery({ photos, title }: PhotoGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const { t } = useLanguage();

  useEffect(() => {
    setActiveIndex(0);
  }, [photos]);

  if (photos.length === 0) {
    return (
      <div className="panel-section flex h-64 items-end overflow-hidden rounded-[28px] bg-[linear-gradient(135deg,rgba(73,198,199,0.18),rgba(2,7,18,0.28)),radial-gradient(circle_at_top,rgba(215,170,90,0.18),transparent_32%)] p-5">
        <div>
          <p className="eyebrow">{t("gallery.noGallery")}</p>
          <p className="mt-2 max-w-xs font-display text-2xl text-white/88">
            {t("gallery.noGalleryCopy")}
          </p>
        </div>
      </div>
    );
  }

  const activePhoto = photos[activeIndex] ?? photos[0];

  return (
    <div className="space-y-3">
      <div className="panel-section relative h-64 overflow-hidden rounded-[28px]">
        <motion.img
          alt={activePhoto.alt || title}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-0 h-full w-full object-cover"
          initial={{ opacity: 0.55, scale: 1.04 }}
          key={activePhoto.id}
          src={activePhoto.url}
          transition={{ duration: 0.45, ease: "easeOut" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#020712]/92 via-[#020712]/12 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-5">
          <p className="eyebrow text-white/55">{t("gallery.heroFrame")}</p>
          <p className="mt-1 max-w-md font-display text-2xl text-white">
            {activePhoto.caption || title}
          </p>
        </div>
      </div>

      {photos.length > 1 ? (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {photos.map((photo, index) => (
            <button
              className={cn(
                "relative h-20 min-w-24 overflow-hidden rounded-2xl border transition",
                index === activeIndex
                  ? "border-gold-300/50 shadow-[0_0_24px_rgba(215,170,90,0.22)]"
                  : "border-white/10 opacity-70 hover:opacity-100"
              )}
              key={photo.id}
              onClick={() => setActiveIndex(index)}
              type="button"
            >
              <img
                alt={photo.alt || `${title} thumbnail ${index + 1}`}
                className="h-full w-full object-cover"
                src={photo.url}
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
