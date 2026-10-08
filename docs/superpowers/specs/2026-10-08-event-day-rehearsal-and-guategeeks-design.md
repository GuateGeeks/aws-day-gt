# Event-day rehearsal and GuateGeeks discovery

## Intent

Make the local app behave like the event is running on 8 October 2026, without changing the official AWS Community Day date of 10 October 2026 or production configuration. Remove the countdown from **Hoy**. Give participants a concise live view of the current block and the next block, with one reminder five minutes before each new start time.

## Event clock and agenda

- Only when `VITE_USE_FIREBASE_EMULATORS=true`, the Guatemala calendar date is 8 October 2026, and no explicit `?ahora=` preview is active, map the current time of day to 10 October 2026. This reuses the published agenda while it advances naturally during the local rehearsal.
- An explicit `?ahora=YYYY-MM-DDTHH:mm` preview continues to take priority. Outside the rehearsal date the app uses real time.
- The agenda card shows the current block and all concurrent talks, workshops, and activities, followed by the next start time and its sessions. Before the first block it shows Registro as upcoming. After the last block it shows the finished state.
- Label the rehearsal as local and keep an external link to the official agenda. Agenda data is a reviewed local snapshot; the external agenda remains authoritative for late changes.
- No countdown card appears in **Hoy**. During the rehearsal, the guide uses event-day messaging.

## Reminders

- Exactly one reminder for each distinct agenda start time appears when the app is open and the next block is at most five minutes away. It names the time and number of simultaneous sessions. It does not repeat after navigation or refresh in the same browser session.
- The visible in-app reminder is the default. A participant may activate browser notifications from an explicit control; the app asks browser permission only in response to that action. Browser notifications work while the app is open. If permission is unavailable or denied, the in-app reminder remains available.
- No Firebase push or background delivery is part of this local change.

## Brand and discovery

- The in-app agenda card features only AWS Community Day artwork. The full GuateGeeks logo stays on the entry splash/landing presentation. The app header can retain the eyes mark and creator text.
- Add a compact Socrates card linked to `https://guategeeks.com/socrates.app/#/`, using accurate, short copy without claiming functionality not confirmed by the product page.
- In **Perfil**, add direct links to GuateGeeks Facebook (`https://www.facebook.com/GuateGeeksGT/`), Instagram (`https://www.instagram.com/guategeeks/`), and LinkedIn (`https://gt.linkedin.com/company/guategeeks`). Add a quiet invitation to request a similar experience via `mailto:info@guategeeks.com`.
- A small link at the bottom of **Hoy** leads to this profile section. No modal or recurring promotional toast appears.
- Replace stale landing copy promising credits for the retired VR code and correct the challenge count.

## Verification

Pure clock and reminder tests cover 8 October mapping, explicit preview precedence, five-minute boundary, and deduplication. UI tests cover current/next agenda, no countdown, branding placement, Socrates, social links, and contact link. Run the full emulator-backed suite, typecheck, build, and inspect desktop/mobile at the local server.
