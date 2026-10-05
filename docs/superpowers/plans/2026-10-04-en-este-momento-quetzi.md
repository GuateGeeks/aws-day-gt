# En este momento con Quetzi Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convertir Hoy en una experiencia de “En este momento” donde Quetzi explica únicamente el bloque activo y permite iniciar directamente una misión que coincida con una sesión en curso.

**Architecture:** Una función pura en `shared/companion.ts` derivará un modelo discriminado del momento actual a partir del reloj, las sesiones y las misiones asignadas. `CompanionPage` se limitará a conectar Firebase con ese modelo, mientras `QuetziGuide` manejará solo la expansión local y la navegación explícita a la misión. No se modifica backend, agenda, asignación ni puntuación.

**Tech Stack:** React 19, TypeScript, React Router, Vitest, Testing Library, CSS.

---

## Estructura de archivos

- `shared/companion.ts`: conserva las utilidades de agenda y evolución; añade el contrato y la función pura `getCurrentMoment`. Elimina la selección de retos futuros de la experiencia Hoy.
- `tests/unit/companion.test.ts`: especifica las reglas temporales, de estado y de coincidencia exacta de misión.
- `src/features/companion/QuetziGuide.tsx`: contiene el único estado interactivo, reposo/expandido, y presenta la acción de misión sin navegar al tocar el personaje.
- `tests/unit/quetzi.test.tsx`: prueba la interacción aislada y la composición de `CompanionPage`.
- `src/features/companion/CompanionPage.tsx`: adapta `useNow`, `useMissions` y el perfil al modelo puro.
- `src/features/companion/CompanionCards.tsx`: conserva cuenta regresiva, agenda oficial y plumas; retira tarjetas de siguiente bloque y recomendación general.
- `src/features/companion/companion.css`: da jerarquía a “En este momento”, al diálogo expandido y a la acción.
- `src/features/companion/quetzi.css`: añade estados visuales de expansión y respeta movimiento reducido.

### Task 1: Derivar el modelo puro del momento actual

**Files:**
- Modify: `tests/unit/companion.test.ts:60-114`
- Modify: `shared/companion.ts:60-94`

- [ ] **Step 1: Reemplazar las pruebas de selección futura por pruebas fallidas del momento actual**

Mantener las pruebas de integridad, reloj y evolución. Reemplazar los bloques `challenge picker` y `Quetzi lines` por:

```ts
describe("current moment", () => {
  const base = { evidenceType: "comment" as const, points: 10 };
  const items = [
    { missionId: "M01", status: "available" as const, points: 15, mission: { title: "Llegué", slot: undefined, room: undefined } },
    { missionId: "M16", status: "available" as const, points: 10, mission: { ...base, title: "Talento + IA", slot: "09:50", room: "Tajumulco" } },
    { missionId: "M19", status: "available" as const, points: 10, mission: { ...base, title: "Pregúntale a los datos", slot: "10:45", room: "Tajumulco" } }
  ];

  it("offers only an actionable mission tied to a session running now", () => {
    const moment = getCurrentMoment({ now: at("10:00"), alias: "ana", items, loading: false });
    expect(moment).toMatchObject({ phase: "live", kind: "sessions", loading: false });
    expect(moment.mission?.missionId).toBe("M16");
    expect(moment.session?.title).toBe("Transformando el talento con AWS e IA: del temor a la ventaja");
    expect(moment.summary).toMatch(/ahora/i);
    expect(moment.detail).toMatch(/Tajumulco/);
  });

  it("never substitutes a future or general mission", () => {
    const moment = getCurrentMoment({ now: at("10:42"), items: [items[0], items[2]], loading: false });
    expect(moment.mission).toBeUndefined();
    expect(moment.detail).toMatch(/no tienes una misión relacionada/i);
  });

  it("allows a rejected mission but excludes non-actionable statuses", () => {
    const rejected = { ...items[1], status: "rejected" as const };
    const submitted = { ...items[1], status: "submitted" as const };
    expect(getCurrentMoment({ now: at("10:00"), items: [rejected], loading: false }).mission?.missionId).toBe("M16");
    expect(getCurrentMoment({ now: at("10:00"), items: [submitted], loading: false }).mission).toBeUndefined();
  });

  it("keeps loading distinct from having no related mission", () => {
    const loading = getCurrentMoment({ now: at("10:00"), items: [], loading: true });
    expect(loading.loading).toBe(true);
    expect(loading.detail).toMatch(/buscando/i);
    expect(loading.detail).not.toMatch(/no tienes/i);
  });

  it.each([
    ["07:45", "registration", /registro/i],
    ["08:40", "plenary", /apertura|comunidad/i],
    ["13:30", "meal", /almuerzo/i],
    ["17:05", "closing", /cierre/i],
    ["20:30", "social", /cena/i]
  ] as const)("describes the %s event moment", (time, kind, copy) => {
    const moment = getCurrentMoment({ now: at(time), alias: "ana", items: [], loading: false });
    expect(moment.kind).toBe(kind);
    expect(moment.summary).toMatch(copy);
    expect(moment.mission).toBeUndefined();
  });

  it("handles pre-event, gaps and post-event without inventing details", () => {
    expect(getCurrentMoment({ now: new Date("2026-10-08T09:00:00-06:00"), items: [], loading: false })).toMatchObject({ phase: "pre", kind: "pre" });
    const gap = getCurrentMoment({ now: at("09:45"), items: items.slice(0, 1), loading: false });
    expect(gap).toMatchObject({ phase: "live", kind: "between", mission: undefined });
    expect(gap.detail).not.toMatch(/Tajumulco|Tacaná/);
    expect(getCurrentMoment({ now: new Date("2026-10-10T22:00:00-06:00"), items: [], loading: false })).toMatchObject({ phase: "post", kind: "post" });
  });
});
```

Actualizar el import desde `shared/companion` para añadir `getCurrentMoment` y retirar `pickChallenge` y `quetziLine`.

- [ ] **Step 2: Ejecutar la prueba y verificar el rojo**

Run: `npx vitest run tests/unit/companion.test.ts`

Expected: FAIL porque `getCurrentMoment` todavía no está exportada.

- [ ] **Step 3: Implementar el contrato y la derivación mínima**

En `shared/companion.ts`, conservar `quetziFact` porque Landing lo usa, eliminar `LineContext`, `quetziLine`, `ChallengeCandidate` y `pickChallenge`, y añadir:

```ts
export type CurrentMomentKind = "pre" | "registration" | "plenary" | "sessions" | "meal" | "closing" | "social" | "between" | "post";

export type CurrentMissionCandidate = {
  missionId: string;
  status: string;
  points: number;
  mission: { title: string; slot?: string; room?: string };
};

export type CurrentMoment<T extends CurrentMissionCandidate> = {
  phase: EventPhase;
  kind: CurrentMomentKind;
  summary: string;
  detail: string;
  loading: boolean;
  mission?: T;
  session?: AgendaSession;
};

type CurrentMomentInput<T extends CurrentMissionCandidate> = {
  now: Date;
  items: readonly T[];
  loading: boolean;
  alias?: string;
};

function named(alias?: string) {
  return alias ? `, ${alias}` : "";
}

export function getCurrentMoment<T extends CurrentMissionCandidate>({ now, items, loading, alias }: CurrentMomentInput<T>): CurrentMoment<T> {
  const phase = getEventPhase(now);
  const name = named(alias);
  if (phase === "pre") {
    const { days, hours } = countdownTo(now, sessionDate(DAY_START));
    const amount = days > 0 ? `${days} ${days === 1 ? "día" : "días"}` : `${hours} ${hours === 1 ? "hora" : "horas"}`;
    return { phase, kind: "pre", summary: `Faltan ${amount}${name}`, detail: "Prepárate para el Community Day y consulta tus charlas en la agenda oficial.", loading: false };
  }
  if (phase === "post") {
    return { phase, kind: "post", summary: `Gracias por volar conmigo${name}`, detail: "El Community Day terminó. Gracias por ser parte de la comunidad AWS de Guatemala.", loading: false };
  }

  const current = sessionsAt(now);
  const special = current.find((session) => session.title === "Registro")
    ?? current.find((session) => session.title === "Almuerzo")
    ?? current.find((session) => session.kind === "social")
    ?? current.find((session) => session.title === "Palabras de cierre" || session.title === "Cierre");

  if (special?.title === "Registro") return { phase, kind: "registration", summary: `Es momento del registro${name}`, detail: "Completa tu ingreso y prepárate para comenzar el día.", loading: false };
  if (special?.title === "Almuerzo") return { phase, kind: "meal", summary: `Es hora del almuerzo${name}`, detail: "Recarga energía y disfruta este espacio con la comunidad.", loading: false };
  if (special?.kind === "social") return { phase, kind: "social", summary: `La cena de la comunidad ya empezó${name}`, detail: "Celebremos lo aprendido y las conexiones de hoy.", loading: false };
  if (special && (special.title === "Palabras de cierre" || special.title === "Cierre")) return { phase, kind: "closing", summary: `Estamos en el cierre${name}`, detail: "Acompaña los últimos momentos del Community Day.", loading: false };
  if (current.length && current.every((session) => session.kind === "plenary" || session.kind === "keynote")) {
    return { phase, kind: "plenary", summary: `La comunidad está reunida${name}`, detail: `Ahora: ${current[0].title}.`, loading: false };
  }

  if (!current.length) return { phase, kind: "between", summary: `Estamos entre actividades${name}`, detail: "No hay una actividad identificada en este momento. Consulta la agenda oficial si necesitas orientarte.", loading: false };
  if (loading) return { phase, kind: "sessions", summary: `Hay actividades en curso${name}`, detail: "Estoy buscando si tienes una misión relacionada con este momento…", loading: true };

  const match = items.find((item) => {
    if (item.status !== "available" && item.status !== "rejected") return false;
    const session = findSessionForMission(item.mission);
    return session ? current.some((candidate) => candidate.id === session.id) : false;
  });
  const session = match ? findSessionForMission(match.mission) : undefined;
  if (match && session) {
    return { phase, kind: "sessions", summary: `Tienes una misión para este momento${name}`, detail: `“${session.title}” está ocurriendo ahora en ${ROOMS[session.room].short}.`, loading: false, mission: match, session };
  }
  return { phase, kind: "sessions", summary: `Hay actividades en curso${name}`, detail: "No tienes una misión relacionada con este momento. Disfruta la actividad que elegiste.", loading: false };
}
```

- [ ] **Step 4: Ejecutar la prueba y verificar el verde**

Run: `npx vitest run tests/unit/companion.test.ts`

Expected: PASS; ningún caso selecciona M01 ni M19 a las 10:00.

- [ ] **Step 5: Confirmar el incremento**

```bash
git add shared/companion.ts tests/unit/companion.test.ts
git commit -m "feat: derive Quetzi current moment"
```

### Task 2: Hacer expandible y accionable el diálogo de Quetzi

**Files:**
- Modify: `tests/unit/quetzi.test.tsx:45-53`
- Modify: `src/features/companion/QuetziGuide.tsx:1-25`
- Modify: `src/features/companion/quetzi.css:25-36`

- [ ] **Step 1: Escribir la prueba fallida de interacción**

Reemplazar el bloque `Quetzi guide` por:

```tsx
describe("Quetzi guide", () => {
  it("expands contextual detail without navigating and then exposes the mission action", () => {
    render(<MemoryRouter><QuetziGuide completed={3} summary="Tienes una misión ahora" detail="La sesión ocurre en Tacaná." mission={{ id: "M17", title: "Agentes con Bedrock" }} /></MemoryRouter>);
    const toggle = screen.getByRole("button", { name: /ampliar información/i });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText(/La sesión ocurre/)).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Comenzar misión/i })).not.toBeInTheDocument();

    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("La sesión ocurre en Tacaná.").closest("[aria-live]")).toHaveAttribute("aria-live", "polite");
    expect(screen.getByRole("link", { name: /Comenzar misión: Agentes con Bedrock/i })).toHaveAttribute("href", "/app/missions/M17");
  });

  it("can expand context without presenting an unrelated action", () => {
    render(<MemoryRouter><QuetziGuide completed={3} summary="Hay actividades en curso" detail="No tienes una misión relacionada con este momento." /></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: /ampliar información/i }));
    expect(screen.getByText(/No tienes una misión relacionada/)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Comenzar misión/i })).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Ejecutar la prueba y verificar el rojo**

Run: `npx vitest run tests/unit/quetzi.test.tsx -t "Quetzi guide"`

Expected: FAIL porque las propiedades `summary`, `detail` y `mission` no existen.

- [ ] **Step 3: Implementar el diálogo expandible**

Reemplazar `QuetziGuide.tsx` por:

```tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { QuetziSprite, type QuetziMood } from "./QuetziSprite";

type Props = {
  completed: number;
  summary: string;
  detail: string;
  mission?: { id: string; title: string };
  loading?: boolean;
  mood?: QuetziMood;
};

export function QuetziGuide({ completed, summary, detail, mission, loading = false, mood }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [reacting, setReacting] = useState(false);
  useEffect(() => {
    if (!reacting) return;
    const timer = window.setTimeout(() => setReacting(false), 900);
    return () => window.clearTimeout(timer);
  }, [reacting]);

  function toggle() {
    setExpanded((value) => !value);
    setReacting(true);
  }

  return <div className={`quetzi-guide ${expanded ? "quetzi-guide--expanded" : ""}`}>
    <button type="button" className="quetzi-guide__bird" onClick={toggle} aria-expanded={expanded} aria-controls="quetzi-current-detail" aria-label={`${expanded ? "Contraer" : "Ampliar"} información de Quetzi`}>
      <QuetziSprite completed={completed} mood={reacting ? "happy" : mood ?? "idle"} />
    </button>
    <div className="speech-bubble" aria-live="polite" aria-busy={loading || undefined}>
      <span className="speech-bubble__name">Quetzi</span>
      <strong>{summary}</strong>
      {expanded && <div id="quetzi-current-detail" className="speech-bubble__detail">
        <p>{detail}</p>
        {mission && <Link className="ds-button speech-bubble__action" to={`/app/missions/${mission.id}`} aria-label={`Comenzar misión: ${mission.title}`}>Comenzar misión</Link>}
      </div>}
      <span className="speech-bubble__hint">{expanded ? "Tócame para resumir" : "Tócame para saber más"}</span>
    </div>
  </div>;
}
```

Añadir a `quetzi.css`:

```css
.speech-bubble > strong { display: block; }
.speech-bubble__detail { display: grid; gap: var(--space-3); margin-top: var(--space-3); }
.speech-bubble__detail p { margin: 0; color: var(--color-ink-muted); }
.speech-bubble__action { width: 100%; text-decoration: none; }
.quetzi-guide--expanded .speech-bubble { border-color: var(--color-primary); box-shadow: var(--shadow-2); }

@media (prefers-reduced-motion: reduce) {
  .quetzi__body, .quetzi__wing, .quetzi__eye, .quetzi__tail, .quetzi__sparkles path { animation: none !important; }
}
```

- [ ] **Step 4: Ejecutar las pruebas del componente**

Run: `npx vitest run tests/unit/quetzi.test.tsx -t "Quetzi guide"`

Expected: PASS; tocar el personaje no cambia de ruta y la navegación solo existe en el enlace explícito.

- [ ] **Step 5: Confirmar el incremento**

```bash
git add src/features/companion/QuetziGuide.tsx src/features/companion/quetzi.css tests/unit/quetzi.test.tsx
git commit -m "feat: make Quetzi current context interactive"
```

### Task 3: Integrar “En este momento” y retirar contenido futuro

**Files:**
- Modify: `tests/unit/quetzi.test.tsx:10-20,68-102`
- Modify: `src/features/companion/CompanionPage.tsx:1-29`
- Modify: `src/features/companion/CompanionCards.tsx:1-70`
- Modify: `src/features/companion/companion.css:1-20`

- [ ] **Step 1: Hacer controlable el mock de misiones y escribir las expectativas fallidas de página**

Reemplazar el mock de las líneas 10-18 por:

```tsx
const clock = vi.hoisted(() => ({ now: new Date("2026-10-08T09:00:00-06:00") }));
const missionState = vi.hoisted(() => ({ loading: false, items: [
  { id: "a1", missionId: "M17", status: "available", points: 10, mission: { id: "M17", title: "Agentes con Bedrock", slot: "09:50", room: "Tacaná", evidenceType: "comment" } },
  { id: "a2", missionId: "M01", status: "approved", points: 15, mission: { id: "M01", title: "Llegué al Community Day", evidenceType: "photo" } }
] }));
vi.mock("../../src/features/auth/AuthProvider", () => ({ useAuth: () => ({ profile: { alias: "ana", interests: ["IA & Agentes"] } }) }));
vi.mock("../../src/features/missions/useMissions", () => ({ useMissions: () => missionState }));
vi.mock("../../src/features/companion/useNow", async (original) => ({ ...await original<object>(), useNow: () => clock.now }));
```

En `afterEach`, restaurar el estado además de ejecutar cleanup:

```tsx
afterEach(() => {
  cleanup();
  missionState.loading = false;
  missionState.items[0].status = "available";
});
```

Reemplazar las pruebas de `CompanionPage` por:

```tsx
describe("CompanionPage", () => {
  function renderPage() { return render(<MemoryRouter><CompanionPage /></MemoryRouter>); }

  it("keeps the pre-event countdown and official agenda", () => {
    clock.now = new Date("2026-10-08T09:00:00-06:00");
    renderPage();
    expect(screen.getByRole("heading", { name: "En este momento" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Cuenta regresiva/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /agenda oficial/i })).toHaveAttribute("target", "_blank");
  });

  it("reveals only the current related mission through Quetzi", () => {
    clock.now = sessionDate("10:00");
    renderPage();
    expect(screen.queryByText(/Siguiente bloque/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Pregúntale a los datos/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /ampliar información/i }));
    expect(screen.getByText(/Strands Agents/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Comenzar misión: Agentes con Bedrock/i })).toHaveAttribute("href", "/app/missions/M17");
  });

  it("does not claim there is no mission while assignments load", () => {
    clock.now = sessionDate("10:00");
    missionState.loading = true;
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: /ampliar información/i }));
    expect(screen.getByText(/buscando si tienes una misión/i)).toBeInTheDocument();
    expect(screen.queryByText(/no tienes una misión/i)).not.toBeInTheDocument();
  });

  it("shows compact feather progress", () => {
    clock.now = sessionDate("10:00");
    renderPage();
    expect(screen.getByText("1 de 11 plumas")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Ejecutar la prueba de página y verificar el rojo**

Run: `npx vitest run tests/unit/quetzi.test.tsx -t "CompanionPage"`

Expected: FAIL porque la página aún renderiza “Siguiente bloque” y usa la API anterior de `QuetziGuide`.

- [ ] **Step 3: Conectar la página al modelo puro**

Reemplazar `CompanionPage.tsx` por:

```tsx
import { PartyPopper } from "lucide-react";
import { getCurrentMoment } from "../../../shared/companion";
import { Card } from "../../design-system/components";
import { useAuth } from "../auth/AuthProvider";
import { useMissions } from "../missions/useMissions";
import { CountdownCard, FeatherCard, OfficialAgendaLink } from "./CompanionCards";
import { QuetziGuide } from "./QuetziGuide";
import { useNow } from "./useNow";
import "./companion.css";

export function CompanionPage() {
  const { profile } = useAuth();
  const { items, loading } = useMissions();
  const now = useNow();
  const active = items.filter((item) => item.status !== "replaced");
  const completed = active.filter((item) => item.status === "approved").length;
  const moment = getCurrentMoment({ now, items: active, loading, alias: profile?.alias });

  return <section className="stack companion">
    <header className="companion__heading">
      <p className="eyebrow">AWS Community Day Guatemala 2026</p>
      <h1>En este momento</h1>
    </header>
    <QuetziGuide completed={completed} summary={moment.summary} detail={moment.detail} loading={moment.loading} mission={moment.mission ? { id: moment.mission.missionId, title: moment.mission.mission.title } : undefined} />
    {moment.phase === "pre" && <CountdownCard now={now} />}
    {moment.phase === "live" && <Card className="companion-now" aria-label="Estado actual"><span className="companion-now__pulse" aria-hidden />En curso ahora</Card>}
    {moment.phase === "post" && <Card className="stack companion-card"><h2><PartyPopper aria-hidden size={20} /> ¡Gracias por venir!</h2><p className="muted">Gracias por ser parte de la comunidad AWS de Guatemala.</p><OfficialAgendaLink>Repasa la agenda oficial</OfficialAgendaLink></Card>}
    <FeatherCard completed={completed} />
  </section>;
}
```

- [ ] **Step 4: Retirar componentes de contenido futuro y compactar estilos**

Reemplazar `CompanionCards.tsx` por este archivo, que ya no contiene tarjetas del siguiente bloque ni recomendaciones generales:

```tsx
import { CalendarDays, Clock3, ExternalLink, Feather } from "lucide-react";
import { OFFICIAL_AGENDA_URL, sessionDate } from "../../../shared/agenda";
import { countdownTo, quetziStage } from "../../../shared/companion";
import { Card, ProgressBar } from "../../design-system/components";
import { QuetziSprite } from "./QuetziSprite";

const TOTAL_FEATHERS = 11;

export function OfficialAgendaLink({ children = "Ver agenda oficial" }: { children?: string }) {
  return <a className="companion-cta" href={OFFICIAL_AGENDA_URL} target="_blank" rel="noreferrer">
    <CalendarDays aria-hidden size={18} />{children}<ExternalLink aria-hidden size={16} />
  </a>;
}

export function CountdownCard({ now }: { now: Date }) {
  const { days, hours, minutes } = countdownTo(now, sessionDate("07:30"));
  return <Card className="stack companion-card">
    <h2><Clock3 aria-hidden size={20} /> Cuenta regresiva</h2>
    <div className="countdown" aria-label={`${days} días, ${hours} horas y ${minutes} minutos para el registro`}>
      {[[days, "días"], [hours, "horas"], [minutes, "min"]].map(([value, unit]) => <div key={unit}><strong>{value}</strong><span>{unit}</span></div>)}
    </div>
    <p className="muted">Sábado 10 de octubre · registro desde las 7:30 · Universidad Rafael Landívar, zona 16.</p>
    <OfficialAgendaLink>Elige tus charlas en la agenda oficial</OfficialAgendaLink>
  </Card>;
}

export function FeatherCard({ completed }: { completed: number }) {
  const stage = quetziStage(completed);
  const feathers = Math.min(completed, TOTAL_FEATHERS);
  return <Card className="feather-card">
    <QuetziSprite completed={completed} className="feather-card__bird" label={`Quetzi en etapa ${stage.name}`} />
    <div className="grow stack">
      <p className="eyebrow"><Feather aria-hidden size={14} /> {stage.name}</p>
      <strong>{feathers} de {TOTAL_FEATHERS} plumas</strong>
      <ProgressBar value={feathers} max={TOTAL_FEATHERS} label="Plumas de Quetzi" />
      <p className="muted">{stage.description}{stage.nextAt ? ` Siguiente etapa con ${stage.nextAt} misiones.` : ""}</p>
    </div>
  </Card>;
}
```

Eliminar de `companion.css` las reglas `.challenge-card`, `.challenge-link`, `.challenge-link strong`, `.challenge-link .muted` y `.challenge-link__when`. Añadir en su lugar, inmediatamente después de `.companion-cta`:

```css
.companion__heading { display: grid; gap: var(--space-1); }
.companion__heading h1 { font-size: var(--text-xl); }
.companion-now { display: flex; align-items: center; gap: var(--space-2); padding-block: var(--space-3); color: var(--color-primary); font-size: var(--text-sm); font-weight: 900; }
.companion-now__pulse { width: 10px; height: 10px; border-radius: 50%; background: var(--color-success); box-shadow: 0 0 0 5px color-mix(in srgb, var(--color-success) 18%, transparent); }
```

No modificar las reglas `.countdown`, `.feather-*` y `.mission-hint`; siguen siendo consumidas por esta experiencia y por las celebraciones existentes.

- [ ] **Step 5: Ejecutar pruebas de página y suite del compañero**

Run: `npx vitest run tests/unit/quetzi.test.tsx tests/unit/companion.test.ts`

Expected: PASS; la salida no contiene fallos ni warnings de React.

- [ ] **Step 6: Confirmar el incremento**

```bash
git add src/features/companion/CompanionPage.tsx src/features/companion/CompanionCards.tsx src/features/companion/companion.css tests/unit/quetzi.test.tsx
git commit -m "feat: focus Today on the current event moment"
```

### Task 4: Verificación integral

**Files:**
- Verify only: `shared/companion.ts`, `src/features/companion/*`, `tests/unit/companion.test.ts`, `tests/unit/quetzi.test.tsx`

- [ ] **Step 1: Ejecutar todas las pruebas automatizadas**

Run: `npm test`

Expected: PASS en todas las suites unitarias y de integración.

- [ ] **Step 2: Verificar tipos de frontend y Functions**

Run: `npm run typecheck`

Expected: exit 0 sin diagnósticos TypeScript.

- [ ] **Step 3: Generar el build de producción**

Run: `npm run build`

Expected: exit 0 y bundle de Vite generado correctamente.

- [ ] **Step 4: Revisar que no quede contenido futuro en Hoy**

Run: `rg -n "Siguiente bloque|pickChallenge|NextBlockCard|ChallengeCard" src shared tests/unit`

Expected: sin coincidencias.

- [ ] **Step 5: Revisar el diff final y el estado del repositorio**

Run: `git diff --check && git status --short`

Expected: `git diff --check` sin salida. El estado puede seguir mostrando únicamente archivos preexistentes ajenos al cambio (`aws_cd_2026_blanco.png` y `contrext.md`).
