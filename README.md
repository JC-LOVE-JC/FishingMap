# Fishing Travel Planner

A polished MVP for planning and documenting global fishing expeditions, built from `fishing_travel_planner_codex_spec.md`.

## Stack

- Next.js
- React + TypeScript
- Tailwind CSS
- MapLibre GL JS 5 via `@vis.gl/react-maplibre`
- Framer Motion

## Features

- Full-screen globe map with rotatable world view and city-level zoom
- Seeded expedition destinations loaded from local JSON
- Differentiated markers for `planned` and `visited`
- Search and status filters
- Rich side panel for overview, detail, and add/edit flows
- Local persistence with `localStorage`
- Image URL attachments and local image uploads stored as data URLs
- Optional Supabase-backed auth, trip ownership, shared read-only links, database persistence, and image storage

## Run

```bash
npm install
npm run dev
```

If you prefer a different basemap style, set:

```bash
NEXT_PUBLIC_MAP_STYLE_URL=https://your-style-url/style.json
```

## Supabase Setup

This app can run in two modes:

- No Supabase env vars: local-first mode with browser persistence
- Supabase env vars present: authenticated multi-user mode with database + storage

### 1. Configure environment variables

Copy `.env.example` to `.env.local` and fill in your Supabase project values:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-public-anon-key
```

`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` is also supported as an alias for the anon key.

### 2. Apply the schema

Run the SQL in `supabase/schema.sql` inside the Supabase SQL editor.

This creates:

- `trip_maps`
- `destinations`
- `destination_images`
- RLS policies for owner-only writes and public shared reads
- The `destination-images` storage bucket

### 3. Auth + sharing behavior

- Signed-in users own their own `trip_maps`
- Each trip map can be toggled public and shared via `/share/[slug]`
- Guests can browse shared maps read-only
- Writes are protected by Supabase RLS and hidden in the UI for non-owners

### 4. Images

- Existing destination image uploads now sync to Supabase Storage when Supabase is enabled
- Image metadata is stored in `destination_images`
- Shared public maps render those stored images through public bucket URLs
