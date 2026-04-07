# Fishing Travel Planner — Codex Build Spec (MVP v0.1)

## Project goal

Build a visually beautiful web app for planning and documenting global fishing trips.

The app should feel like a **premium expedition journal + interactive world atlas**, not a generic map tool.  
Users should be able to:

1. View a world map as the main interface
2. Add and manage fishing destination pins
3. Distinguish between:
   - **Planned trips**
   - **Past trips / visited spots**
   - **Highlighted / dream / flagship spots**
4. Open each pin to view or edit:
   - Title
   - Region / country
   - Date or season
   - Text notes / trip planning notes
   - Photos
   - Tags such as species / techniques / trip type
5. Use the app as both:
   - a future trip planner
   - a visual archive / memory board of previous fishing experiences

---

## Product positioning

This should **not** look like a normal Google Maps clone.

Desired vibe:
- cinematic
- premium
- exploratory
- elegant
- dark / oceanic / editorial
- immersive and travel-inspired

Reference feeling:
- luxury expedition dashboard
- modern editorial travel portfolio
- nautical exploration UI
- Apple-like smoothness + premium adventure branding

Avoid:
- ugly default map styles
- dense GIS / enterprise dashboards
- overly technical markers
- cluttered modals
- bland CRUD admin interfaces

---

## Core UX concept

### Main structure
- Full-screen world map as hero canvas
- Left or right collapsible side panel for trip details / filters / selected pin info
- Floating top bar for global controls
- Optional bottom strip or drawer for recent entries / trip timeline

### Primary user flows

#### Flow A — Plan a future trip
1. User opens the map
2. User clicks an existing pin or creates a new pin
3. User adds:
   - destination name
   - target species
   - target methods
   - best season
   - travel notes
   - inspiration photos
4. Pin is categorized as `planned`
5. Pin appears on the map with a distinct style

#### Flow B — Record a past trip
1. User clicks an existing destination or creates a new one
2. User uploads photos
3. User writes memory notes / catch notes / logistics notes
4. User marks it as `visited`
5. The app visually distinguishes it from future trips

#### Flow C — Highlight elite / flagship destinations
1. User marks certain destinations as `highlight`
2. Highlight pins should have stronger visual emphasis
3. These can represent dream destinations, trophy fisheries, or top-priority locations

---

## Visual design direction

### Theme
Use a **dark luxury ocean aesthetic**:
- deep navy / charcoal / muted blue / subtle gold accents
- soft glows
- glassmorphism only if restrained and tasteful
- rounded panels
- elegant typography hierarchy
- cinematic spacing
- minimal but premium animations

### Map style
Do **not** use a default bright road-map look.

Preferred options:
1. Mapbox custom dark style
2. MapLibre with custom dark basemap
3. stylized satellite / terrain-lite / minimal political labels
4. optionally use a more artistic world texture if performance remains smooth

Desired map behavior:
- smooth zoom and pan
- subtle animated marker hover
- slightly glowing highlighted points
- premium popup/card transitions

### Marker system
Use visually differentiated markers:
- `planned`: elegant amber / gold marker
- `visited`: cool blue / teal marker
- `highlight`: larger glowing marker or special icon
- `selected`: active ring / pulse animation

Markers should feel branded and premium, not default pins.

---

## Content model

Each destination pin should support rich content.

### Destination object
```ts
type Destination = {
  id: string
  title: string
  country: string
  region?: string
  lat: number
  lng: number

  status: "planned" | "visited" | "highlight"

  season?: string
  tripDate?: string
  summary?: string
  notes?: string

  species?: string[]
  techniques?: string[]
  tags?: string[]

  photos?: PhotoItem[]

  rating?: number
  featured?: boolean

  createdAt: string
  updatedAt: string
}
```

### Photo object
```ts
type PhotoItem = {
  id: string
  url: string
  caption?: string
  alt?: string
}
```

---

## Pin detail experience

When clicking a pin, open a beautiful detail panel or modal.

### Pin detail must support
- hero image or gallery
- title + country / region
- status badge
- season / date
- text notes
- tags
- species
- techniques
- editable content fields
- photo gallery

### Layout concept
- large image on top
- structured content below
- elegant tags / chips
- clean typography
- enough white space
- easy edit/save interaction

For `visited` spots:
- emphasize story, memories, photos, catch notes

For `planned` spots:
- emphasize strategy, target fish, best timing, trip logistics

For `highlight` spots:
- emphasize importance and make the presentation more dramatic

---

## MVP scope

Build a polished MVP first.

### MVP features
1. Full-screen interactive world map
2. Seeded example pin data from a local JSON file
3. Three statuses:
   - planned
   - visited
   - highlight
4. Clickable pins
5. Side panel or modal showing:
   - title
   - status
   - notes
   - image gallery
   - tags
6. Ability to add a new pin
7. Ability to edit an existing pin
8. Ability to upload or attach image URLs
9. Filter pins by status
10. Search by destination name or country
11. Beautiful responsive UI

### Nice-to-have but not required for MVP
- authentication
- cloud database
- drag-to-reposition pins
- trip timeline view
- clustering
- weather / season overlays
- animated travel routes between trips
- offline support

---

## Tech stack preference

Use a stack that supports fast iterative vibe coding.

### Preferred stack
- **Next.js**
- **React**
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui**
- **Mapbox GL JS** or **MapLibre GL**
- **Framer Motion** for tasteful animations

### State / data
For v0.1:
- local JSON seed data
- local component state
- optionally localStorage persistence

For future versions:
- Supabase for database + storage
- image uploads to storage bucket
- auth if multi-user is ever needed

---

## Suggested project structure

```bash
app/
  page.tsx
  layout.tsx

components/
  map/
    world-map.tsx
    destination-marker.tsx
    map-toolbar.tsx
  destination/
    destination-panel.tsx
    destination-card.tsx
    destination-form.tsx
    photo-gallery.tsx
  ui/
    ...

data/
  destinations.json

lib/
  types.ts
  utils.ts
  map.ts

public/
  images/
```

---

## Example seeded destinations

Seed the app with a few visually interesting fishing locations to demonstrate the product:

- Galápagos
- Three Kings Islands
- Papua New Guinea
- Seychelles
- Costa Rica
- Florida Keys
- Cape Verde
- Argentina Golden Dorado fishery

Make sure the sample data includes a mix of:
- planned
- visited
- highlight

Each should include:
- short summary
- at least one photo
- example tags
- example species and techniques

---

## Map interaction requirements

### Basic interactions
- pan
- zoom
- marker hover
- marker click
- map click for adding a new point
- search/focus to destination

### Visual behavior
- smooth animated fly-to when selecting a pin
- subtle hover scale / glow
- tasteful panel transitions
- selected marker stays visually active

### Optional future enhancements
- animated routes between selected trips
- heat zones
- seasonal overlays
- ocean-region labeling
- species-based thematic layers

---

## Information architecture

### Top bar
Include:
- app title / logo
- search
- status filters
- add destination button
- maybe a theme accent toggle later

### Side panel
Should be able to display:
- default overview state
- selected destination details
- add/edit form state

### Map canvas
The visual centerpiece of the product.
It must feel immersive and premium.

---

## Editing workflow

### Add new destination
User can:
- click an “Add destination” button
- optionally click on the map to set coordinates
- fill in the form
- attach photos or image URLs
- save the destination

### Edit destination
User can:
- select a destination
- click edit
- update notes, status, tags, photos
- save changes

### Data persistence
For MVP:
- persist to localStorage
- initialize from seed JSON if no local data exists

---

## Styling instructions for Codex

Be opinionated and aim for strong visual polish.

### Design constraints
- prioritize aesthetics, spacing, and visual hierarchy
- avoid default browser-looking inputs
- avoid generic map popups
- avoid noisy borders
- prefer translucent panels with good contrast
- use soft shadows, blur, and restrained gradients
- animations should feel smooth and premium, not flashy

### Typography
- strong heading hierarchy
- elegant sans-serif
- clean labels
- small uppercase section labels can work well

### Responsive design
Desktop-first, but keep tablet usability in mind.

---

## Functional requirements

### Required
- user can view seeded locations on a world map
- user can differentiate destinations by status
- user can open any destination and read its content
- user can create and edit destinations
- user can attach images
- user can search and filter
- data persists locally

### Non-functional
- app should feel smooth and modern
- avoid jank on map interactions
- maintain clean code structure
- components should be reusable
- data model should be extensible for future backend integration

---

## Stretch features for later versions

Not required now, but the architecture should not block them later.

### Potential v0.2+
- timeline mode
- route visualization
- multi-image upload to cloud storage
- species filter
- “trip collections” or expedition grouping
- shareable public trip pages
- weather window notes
- moon phase / tide / best season overlays
- private vs public destinations
- markdown-rich trip journals
- video embeds
- favorite / priority ranking

---

## Codex execution plan

Please implement in phases.

### Phase 1
- initialize project
- build world map
- load seeded destination data
- render differentiated markers

### Phase 2
- build destination detail panel
- render text + image content cleanly
- add fly-to and selection logic

### Phase 3
- build create/edit destination workflow
- persist to localStorage
- add filters and search

### Phase 4
- polish visual design
- improve transitions and premium feel
- ensure responsiveness

---

## Output expectation

Deliver a working MVP with:
- beautiful full-screen map UI
- elegant pin interaction
- rich destination cards/panels with text and photos
- editable planned / visited / highlight data
- local persistence
- polished visual identity

The priority is:
1. **beautiful UI**
2. **smooth interaction**
3. **clear data structure**
4. **good extensibility**

---

## Final instruction to Codex

Do not build this like a bland admin dashboard.

Build it like a **premium visual exploration product for global fishing expeditions**.

It should feel like:
- part travel atlas
- part expedition planner
- part personal fishing memory archive

The design quality matters as much as the functionality.
