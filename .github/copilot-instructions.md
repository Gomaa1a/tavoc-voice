<!--
Guidance for AI coding agents working on this repository.
Keep this file short, actionable, and specific to this codebase.
-->

# Copilot / AI agent instructions (concise)

- Big picture: this is a Vite + React + TypeScript frontend. UI is built with shadcn-style components (look in `src/components/ui/`) and styled with Tailwind CSS. The app's main feature is a voice assistant component at `src/components/VoiceAgent.tsx` and the entry page at `src/pages/Index.tsx`.

- Build & run (what to run locally):
  - Install: `npm install`
  - Dev: `npm run dev` (Vite serves on port 8080 per `vite.config.ts`)
  - Build: `npm run build`
  - Preview built app: `npm run preview`

- Project-specific conventions to follow:
  - UI primitives live in `src/components/ui/`. If you add a shared component, place it here and keep props small and typed.
  - Page components live in `src/pages/`. Keep routing simple (React Router is included).
  - Lightweight helpers and hooks belong in `src/lib/` and `src/hooks/`.
  - Use Tailwind utility classes in JSX; avoid global CSS unless necessary. See `src/index.css` and `tailwind.config.ts`.
  - Project alias `@` resolves to `./src` (see `vite.config.ts`). Prefer `@/...` imports for app code.

- Files/places that frequently need attention (examples):
  - `index.html` — meta tags and social image. Use local `public/placeholder.svg` rather than external services.
  - `vite.config.ts` — dev server host/port and aliases. Avoid adding dev-only plugins that modify source without explicit review.
  - `public/` — static assets; `placeholder.svg` is used as the default favicon/OG image.

- External integrations & dependencies:
  - No server or backend code lives here. Any API calls should use client-side fetches; keep secrets out of the repo and use environment variables instead.
  - If you add a third-party dev tool, update `package.json` and explain risk (build/time) in the PR description.

- Edits to avoid / safety checks:
  - Do not modify `package-lock.json` directly in edits unless you run `npm install` locally; changes to lockfiles are noisy.
  - Avoid adding credentials, API keys, or references to external editing platforms. This repo previously contained references to `lovable`; those were removed — do not reintroduce them.

- Small examples (how to implement common tasks):
  - Add a shared button: create `src/components/ui/button.tsx`, export it, then import in pages with `import Button from '@/components/ui/button'`.
  - Replace OG image: update `index.html` meta `og:image` and `twitter:image` to point at `/placeholder.svg` (already used in the repo).

- When you generate or modify code:
  - Provide a 1–2 line rationale comment at the top of the changed file (what and why).
  - Keep PRs small and focused: one UI change per PR, or one feature + small UI polish.

- If you cannot determine intent (e.g., ambiguous UX flow), propose 2 short alternatives and implement the simpler one; label the change clearly in the commit message.

Thank you — after making edits, ask for feedback and run the dev server to confirm no type or runtime errors.
