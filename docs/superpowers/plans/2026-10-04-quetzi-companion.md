# Quetzi digital companion

**Goal:** turn the mission app into a day-of companion led by Quetzi, a pixel-art quetzal that guides attendees through the agenda and their existing missions.

## Decisions (approved 2026-10-04)

- Challenges reuse the existing 11 server-validated missions. No backend, rules or scoring changes.
- Agenda is a bundled static file (`shared/agenda.ts`) copied from https://awscommunitygt.com/agenda/. Works offline; changes require redeploy.
- Quetzi is an original pixel SVG inspired by the event's quetzal art, so it can animate and evolve.

## Scope

1. `shared/agenda.ts` — official sessions, rooms, buildings, tracks (America/Guatemala, UTC-6).
2. `shared/companion.ts` — pure logic: event phase, now/next sessions, interest recommendations, slot conflicts, mission↔session matching, Quetzi evolution stage, contextual lines.
3. `src/features/companion/` — `Quetzi` SVG (idle bob, blink, flap on tap, tail grows per completed mission), `CompanionPage` ("Hoy" tab), `useNow` (supports `?ahora=` simulation), feather celebration toast.
4. `src/features/agenda/` — agenda by time slot, track filters, "Mi ruta" stars (localStorage), conflict warnings, recommendation and mission badges.
5. Rebrand: quetzal palette, quetzal logo/icon, landing page with event info, Quetzi on progress page and mission detail.

## Verification

- Unit tests for companion logic and agenda integrity (every session mission maps to an agenda session).
- Component tests for Quetzi interaction and agenda stars.
- `npm test`, `npm run typecheck`, `npm run build`.
