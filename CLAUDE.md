# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (Vite HMR at localhost:5173)
npm run build     # Type-check (tsc -b) then bundle for production
npm run preview   # Serve the production build locally
npm run lint      # ESLint with TypeScript + React Hooks rules
```

No test framework is configured.

## Architecture

**Outcomer** is a visual goal/outcome planning tool — a directed acyclic graph (DAG) editor where nodes are "outcomes" and edges are "dependencies".

### Tech Stack
- **React 19 + TypeScript** via **Vite**
- **ReactFlow v11** — graph canvas (nodes, edges, drag-to-connect)
- **Zustand** — single global store (`src/store/useStore.ts`)
- **Supabase** — PostgreSQL persistence; falls back to **localStorage** if Supabase is unconfigured
- **TailwindCSS v4** — styling

### Data Flow

```
useStore (Zustand)
  ├── loads outcomes + dependencies on mount (Supabase or localStorage)
  ├── GraphCanvas reads store → renders ReactFlow nodes + edges
  ├── user interactions → store actions → Supabase/localStorage sync
  └── components re-render via Zustand subscriptions
```

### Key Files

| File | Role |
|------|------|
| `src/store/useStore.ts` | All state + async CRUD for outcomes and dependencies; dual persistence logic |
| `src/lib/supabase.ts` | Supabase client — returns `null` if URL isn't valid HTTPS (enables offline mode) |
| `src/lib/cycleDetection.ts` | DFS-based cycle check run before adding any dependency edge |
| `src/components/GraphCanvas.tsx` | ReactFlow canvas; syncs store ↔ graph; handles node drop-creation and edge connections |
| `src/components/OutcomeNode.tsx` | Custom node with status-based color coding |
| `src/components/SidePanel.tsx` | Edit form for the selected outcome |
| `src/types/outcome.ts` | `Outcome` and `Dependency` TypeScript types |

### Outcome Model

Outcomes have: `title`, `status` (`todo` | `wait` | `inprogress` | `done`), `strategy`, `info`, `deadline`, and absolute 2D `position_x` / `position_y` on the canvas.

Dependency edges are directed; cycle detection runs on every attempted connection to keep the graph a DAG.

### Persistence

Supabase is the primary store. If `VITE_SUPABASE_URL` is not a valid HTTPS URL the client is `null` and the store transparently falls back to `localStorage`. This enables fully offline use.

Environment variables (`.env`):
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```
