# Torgide — Claude Code Guide

## Project Overview

Torgide is a location-based application with:
- **`/web`** — React web app (Vite + React 19 + TypeScript + Tailwind CSS v4)
- **`/ui`** — React Native mobile app (Expo + Gluestack UI)
- **`/api`** — Python FastAPI backend

---

## Web App (`/web`)

### Stack
- **Framework:** Vite + React 19 + TypeScript
- **Styling:** Tailwind CSS v4 (mobile-first)
- **UI Components:** shadcn (Base UI primitives), lucide-react icons
- **Maps:** react-leaflet + OpenStreetMap (free, no API key required)

### Design Principles
- **Mobile-first:** Design for 375px viewport first, scale up for larger screens
- **Full-screen map layout:** Map fills the background; UI floats on top
- Primary color is an orange-red (`oklch(0.639 0.255 10.6)`)

### Key Files
- `web/src/App.tsx` — Main app / home screen (map + search + bottom sheet)
- `web/src/components/MapView.tsx` — Leaflet map wrapper component
- `web/src/index.css` — Global styles + CSS variables (Tailwind v4 theme)
- `web/src/App.css` — App-specific utility styles

### Running
```bash
cd web
npm run dev
```

---

## Mobile App (`/ui`)

### Stack
- **Framework:** Expo + React Native
- **UI:** Gluestack UI

### Running
```bash
cd ui
npx expo start
```

---

## API (`/api`)

### Stack
- **Framework:** FastAPI (Python)
- **Entry:** `api/main.py`

### Running
```bash
cd api
uvicorn main:app --reload
```

---

## Conventions
- Use `npm` in the `/web` directory
- Do not commit `node_modules`, `.env`, or build artifacts
- Maps use OpenStreetMap tiles — no API key needed
- Prefer editing existing files over creating new ones
- **Always use shadcn components** when one exists for the use case (e.g. `Drawer` for bottom sheets, `Button`, etc.) before writing custom UI
- Bottom sheets use shadcn `Drawer` (vaul) with `snapPoints`, `modal={false}`, and no `DrawerOverlay` so the map stays unblurred
