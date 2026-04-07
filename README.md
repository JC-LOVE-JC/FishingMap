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

## Run

```bash
npm install
npm run dev
```

If you prefer a different basemap style, set:

```bash
NEXT_PUBLIC_MAP_STYLE_URL=https://your-style-url/style.json
```
