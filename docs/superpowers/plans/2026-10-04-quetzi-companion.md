# Quetzi digital companion

**Goal:** turn the mission app into a day-of companion led by Quetzi, a pixel-art quetzal that guides attendees through the agenda and their existing missions.

## Decisions (approved 2026-10-04)

- Challenges reuse the existing 11 server-validated missions. No backend, rules or scoring changes.
- Agenda is a bundled static file (`shared/agenda.ts`) copied from https://awscommunitygt.com/agenda/. Works offline; changes require redeploy.
- Quetzi is an original pixel SVG inspired by the event's quetzal art, so it can animate and evolve.

## Revision 2026-10-04: official agenda first

The in-app agenda overlapped with https://awscommunitygt.com/agenda/. To keep the official agenda as the single source for sessions:

- The Agenda tab, track filters, personal route and conflict warnings were removed. `/app/agenda` redirects to Hoy.
- The header, Hoy, landing and mission detail link to the official agenda.
- Hoy shows session details only for the session tied to the attendee's mission (now or next), plus the next block start time.
- `shared/agenda.ts` stays as internal data for mission placement and day timing; it is never rendered as a schedule.

## Original scope

1. `shared/agenda.ts` — official sessions, rooms, buildings, tracks (America/Guatemala, UTC-6).
2. `shared/companion.ts` — pure logic: event phase, now/next sessions, interest recommendations, slot conflicts, mission↔session matching, Quetzi evolution stage, contextual lines.
3. `src/features/companion/` — `Quetzi` SVG (idle bob, blink, flap on tap, tail grows per completed mission), `CompanionPage` ("Hoy" tab), `useNow` (supports `?ahora=` simulation), feather celebration toast.
4. `src/features/agenda/` — agenda by time slot, track filters, "Mi ruta" stars (localStorage), conflict warnings, recommendation and mission badges.
5. Rebrand: quetzal palette, quetzal logo/icon, landing page with event info, Quetzi on progress page and mission detail.

## Verification

- Unit tests for companion logic and agenda integrity (every session mission maps to an agenda session).
- Component tests for Quetzi interaction and agenda stars.
- `npm test`, `npm run typecheck`, `npm run build`.
