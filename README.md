# Wall Calendar

An interactive calendar component built with Next.js and TypeScript.
It supports date range selection, integrated notes with local persistence,
seasonal hero imagery, and a responsive mobile notes drawer.

## Running locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Key decisions

- Built with the Next.js App Router, TypeScript, CSS Modules, and design tokens defined in `src/styles/tokens.css`.
- Kept all calendar math on the native `Date` API with shared utilities in `src/utils/dateHelpers.ts`; no date libraries are used.
- Modeled range selection as a reducer-backed state machine so click, drag, clear, and overflow-date behavior stay predictable.
- Stored notes in `localStorage` under a single namespaced key and seeded the experience with realistic sample notes from `src/data/sampleNotes.ts`.
- Used a delayed hero-image transition plus dominant-color extraction to keep month changes feeling editorial instead of app-like.
