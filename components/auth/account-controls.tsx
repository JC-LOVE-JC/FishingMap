"use client";

import { useState } from "react";

import { Copy, LogOut, Plus, Trash2, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { TripMap } from "@/lib/types";

type AccountControlsProps = {
  currentTripMap: TripMap | null;
  guestMode: boolean;
  onCreateTripMap: (title: string) => Promise<void>;
  onCopyShareLink: () => Promise<void>;
  onDeleteTripMap: () => Promise<void>;
  onOpenAuth: () => void;
  onSelectTripMap: (tripMapId: string) => void;
  onSignOut: () => Promise<void>;
  onTogglePublic: (isPublic: boolean) => Promise<void>;
  tripMaps: TripMap[];
  userEmail?: string | null;
};

export function AccountControls({
  currentTripMap,
  guestMode,
  onCreateTripMap,
  onCopyShareLink,
  onDeleteTripMap,
  onOpenAuth,
  onSelectTripMap,
  onSignOut,
  onTogglePublic,
  tripMaps,
  userEmail
}: AccountControlsProps) {
  const [newTitle, setNewTitle] = useState("");
  const compactAccountLabel = getCompactAccountLabel(userEmail);

  if (guestMode) {
    return (
      <Button className="shrink-0" onClick={onOpenAuth} type="button" variant="secondary">
        <UserRound className="size-4" />
        Guest
      </Button>
    );
  }

  return (
    <details className="group relative">
      <summary
        className="flex shrink-0 cursor-pointer list-none items-center gap-2 rounded-full border border-white/8 bg-[#06120a]/96 px-3 py-2 text-sm text-white/78 marker:hidden"
        title={userEmail || "Account"}
      >
        <UserRound className="size-4" />
        <span className="max-w-[4ch] overflow-hidden text-ellipsis whitespace-nowrap font-medium uppercase tracking-[0.18em]">
          {compactAccountLabel}
        </span>
      </summary>

      <div className="absolute right-0 top-[calc(100%+0.75rem)] z-30 w-[18rem] rounded-[24px] border border-emerald-950/80 bg-[#051007]/98 p-4 shadow-[0_28px_80px_rgba(0,0,0,0.48)] backdrop-blur-2xl sm:w-[19rem]">
        <p className="eyebrow">Trip Maps</p>
        {userEmail ? (
          <p className="mt-2 truncate text-sm text-white/56" title={userEmail}>
            {userEmail}
          </p>
        ) : null}
        <div className="mt-3 space-y-3">
          <select
            className="w-full rounded-2xl border border-white/8 bg-[#06131d] px-4 py-3 text-sm text-white outline-none"
            onChange={(event) => onSelectTripMap(event.target.value)}
            value={currentTripMap?.id || ""}
          >
            {tripMaps.map((tripMap) => (
              <option key={tripMap.id} value={tripMap.id}>
                {tripMap.title}
              </option>
            ))}
          </select>

          <div className="flex gap-2">
            <Input
              onChange={(event) => setNewTitle(event.target.value)}
              placeholder="New map title"
              value={newTitle}
            />
            <Button
              onClick={async () => {
                await onCreateTripMap(newTitle);
                setNewTitle("");
              }}
              type="button"
              variant="secondary"
            >
              <Plus className="size-4" />
            </Button>
          </div>

          <label className="flex items-center justify-between rounded-2xl border border-white/8 bg-[#06131d] px-4 py-3 text-sm text-white/78">
            <span>Public shared link</span>
            <input
              checked={Boolean(currentTripMap?.isPublic)}
              onChange={(event) => void onTogglePublic(event.target.checked)}
              type="checkbox"
            />
          </label>

          <Button className="w-full justify-center" onClick={() => void onCopyShareLink()} type="button" variant="secondary">
            <Copy className="size-4" />
            Copy Share Link
          </Button>

          <Button
            className="w-full justify-center"
            disabled={!currentTripMap}
            onClick={() => void onDeleteTripMap()}
            type="button"
            variant="ghost"
          >
            <Trash2 className="size-4" />
            Delete Current Map
          </Button>

          <Button className="w-full justify-center" onClick={() => void onSignOut()} type="button" variant="ghost">
            <LogOut className="size-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </details>
  );
}

function getCompactAccountLabel(userEmail?: string | null) {
  const source = (userEmail || "acct").trim();
  const firstChunk = source.split("@")[0] || source;
  return firstChunk.slice(0, 4) || "acct";
}
