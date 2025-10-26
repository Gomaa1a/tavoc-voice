# TAVOC Voice Connect (local README)

This repo is a Vite + React + TypeScript frontend scaffold with shadcn-ui components and Tailwind.

Quick start

1. Install deps: `npm install`
2. Dev server: `npm run dev` (Vite serves on port 8080 as configured in `vite.config.ts`)
3. Build: `npm run build`
4. Preview production build: `npm run preview`

Notes

- The project uses `src/` for app code. Key areas:
	- `src/components/VoiceAgent.tsx` — main voice assistant component
	- `src/components/ui/` — shadcn-styled shared UI components (cards, buttons, inputs)
	- `src/hooks/` and `src/lib/utils.ts` — small helpers and hooks
	- `src/pages/Index.tsx` — app entry page
- Vite is configured in `vite.config.ts` (dev server host/port and aliases).
- Tailwind config in `tailwind.config.ts` and styles in `src/index.css` / `src/App.css`.

Removed third-party edit scaffolding

This repository previously contained references to an external editing service (Lovable). Those references have been removed from docs and configuration. If you see any remaining `lovable` strings, please flag them.

If you want me to regenerate a longer README or add deployment docs, tell me what hosting target you plan to use.
