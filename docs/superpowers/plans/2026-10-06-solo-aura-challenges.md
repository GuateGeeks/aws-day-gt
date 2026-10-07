# Solo Aura Challenges Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Retirar las misiones anteriores de la aplicación y dejar solo Aura Challenges sin borrar registros históricos.

**Architecture:** Mantener `challengeAssignments`, `challengeProgress` y `scores.auraTotal` como flujo activo. Quitar las entradas M de UI, semilla y API; bloquear sus colecciones en reglas cliente. Dejar los documentos existentes sin mutación.

**Tech Stack:** React/Vite, TypeScript, Firebase Functions, Firestore/Storage emulator, Vitest.

---

### Task 1: Incorporación y semilla

**Files:** `tests/integration/challenge-onboarding.test.ts`, `functions/src/missions/complete-onboarding.ts`, `scripts/seed-data.ts`, `src/features/onboarding/OnboardingPage.tsx`.

- [ ] Cambiar el test para exigir `userMissions.size === 0` y ejecutarlo en emulador para observar el fallo.
- [ ] Quitar la selección y escritura de misiones M; devolver solo los diez `challengeIds`.
- [ ] Quitar misiones y claves M de la lista de escrituras de semilla; mantener cero borrados.
- [ ] Quitar el bloque de intereses históricos de incorporación y comprobar TypeScript e integración.

### Task 2: Pantallas y rutas

**Files:** `tests/unit/challenges-page.test.tsx`, `src/features/challenges/ChallengesPage.tsx`, `src/features/companion/CompanionPage.tsx`, `src/features/progress/ProgressPage.tsx`, `src/features/leaderboard/LeaderboardPage.tsx`, `src/app/router.tsx`, `src/app/RouteGuards.tsx`.

- [ ] Cambiar el test de listado para exigir ausencia del enlace «Misiones anteriores» y comprobar que falla.
- [ ] Retirar enlaces, tarjetas, cifras e insignias ligadas a M; conservar el acceso a Geek ID.
- [ ] Redirigir URLs `/app/missions` y `/app/missions/:missionId` a `/app/challenges` para no dejar una pantalla rota.
- [ ] Ejecutar pruebas unitarias y build.

### Task 3: API, administración y reglas

**Files:** `functions/src/index.ts`, `functions/src/submissions/register-photo.ts`, `functions/src/moderation/review-submission.ts`, `src/features/submissions/PhotoEvidence.tsx`, `src/features/admin/AdminPage.tsx`, `src/features/admin/ModerationCard.tsx`, `firebase/firestore.rules`, `firebase/firestore.indexes.json`, `firebase/storage.rules`, `tests/rules/firestore.test.ts`, `tests/integration/challenge-photo.test.ts`.

- [ ] Añadir pruebas que nieguen lectura de misiones M y registro/revisión de fotos M; observar fallos esperados.
- [ ] Dejar de exportar funciones M; aceptar únicamente desafíos fotográficos en la API activa.
- [ ] Filtrar la cola de moderación a `kind == challenge` y añadir índice compuesto.
- [ ] Denegar accesos cliente a colecciones M y subidas Storage M, conservar C15.
- [ ] Ejecutar integración y reglas en emuladores.

### Task 4: Documentación y verificación

**Files:** `README.md`, `docs/operations.md`, reporte local en `outputs`.

- [ ] Actualizar documentación para explicar que la aplicación solo usa Aura Challenges y que no borra registros previos.
- [ ] Ejecutar `npm test`, `npm run typecheck`, builds, semilla dry-run y `git diff --check`.
- [ ] Revisar la vista local en Chrome y guardar un commit local limpio.
