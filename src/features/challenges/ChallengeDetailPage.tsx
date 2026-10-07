import type { IScannerControls } from "@zxing/browser";
import { httpsCallable } from "firebase/functions";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { Challenge } from "../../../shared/challenges/types";
import { isPhotoChallengeId } from "../../../shared/challenges/photo";
import { isAwsServiceChallengeId } from "../../../shared/challenges/bonus";
import { Button, Card, Field, Input, StatusNotice } from "../../design-system/components";
import { functions } from "../../firebase/functions";
import { PhotoEvidence } from "../submissions/PhotoEvidence";
import { nextAvailableChallenge } from "./challenge-view";
import { useChallenges } from "./useChallenges";

type Answer = { sequence?: string[]; matches?: Record<string, string>; optionId?: string; trackId?: string; sessionId?: string; code?: string; geekToken?: string; stationToken?: string };
const ArchitectureChallenge = lazy(() => import("./ArchitectureChallenge").then((module) => ({ default: module.ArchitectureChallenge })));
const ServiceDecisionScene = lazy(() => import("./ServiceDecisionScene").then((module) => ({ default: module.ServiceDecisionScene })));

function CloudForm({ challenge, answer, setAnswer }: { challenge: Challenge; answer: Answer; setAnswer: (answer: Answer) => void }) {
  if (isAwsServiceChallengeId(challenge.id)) return <div className="stack"><p>{challenge.configuration.scenario}</p><Suspense fallback={<p role="status">Preparando objetos…</p>}><ServiceDecisionScene options={challenge.configuration.options ?? []} selected={answer.optionId ?? null} onSelect={(optionId) => setAnswer({ optionId })} /></Suspense></div>;
  if (challenge.id === "C06") return <div className="stack"><p>Arrastra o selecciona los servicios en el orden correcto.</p><div className="cluster">{challenge.configuration.items?.map((item) => <Button type="button" variant="secondary" draggable key={item.id} disabled={answer.sequence?.includes(item.id)} onDragStart={(event) => event.dataTransfer.setData("text/plain", item.id)} onClick={() => setAnswer({ sequence: [...(answer.sequence ?? []), item.id] })}>{item.label}</Button>)}</div><div className="challenge-dropzone" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const id = event.dataTransfer.getData("text/plain"); if (challenge.configuration.items?.some((item) => item.id === id) && !answer.sequence?.includes(id)) setAnswer({ sequence: [...(answer.sequence ?? []), id] }); }}><strong>Tu arquitectura</strong><p>{(answer.sequence ?? []).map((id) => challenge.configuration.items?.find((item) => item.id === id)?.label ?? id).join(" → ") || "Suelta aquí los servicios"}</p></div><Button type="button" variant="ghost" onClick={() => setAnswer({ sequence: [] })}>Reiniciar orden</Button></div>;
  if (challenge.id === "C07") return <div className="stack">{challenge.configuration.prompts?.map((prompt) => <Card className="stack" key={prompt.id}><Field id={`match-${prompt.id}`} label={prompt.label}><select className="ds-input" id={`match-${prompt.id}`} value={answer.matches?.[prompt.id] ?? ""} onChange={(event) => setAnswer({ matches: { ...answer.matches, [prompt.id]: event.target.value } })}><option value="">Selecciona un servicio</option>{challenge.configuration.options?.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select></Field></Card>)}</div>;
  return <div className="stack">{challenge.configuration.scenario && <p>{challenge.configuration.scenario}</p>}{challenge.configuration.clues?.map((clue) => <p key={clue}>{clue}</p>)}<div className="stack">{challenge.configuration.options?.map((option) => <label className="check-row" key={option.id}><input type="radio" name="cloud-answer" checked={answer.optionId === option.id} onChange={() => setAnswer({ optionId: option.id })} />{option.label}</label>)}</div></div>;
}

function GeekScanner({ onToken }: { onToken: (token: string) => void }) {
  const video = useRef<HTMLVideoElement>(null); const controls = useRef<IScannerControls | null>(null);
  const [error, setError] = useState("");
  useEffect(() => () => controls.current?.stop(), []);
  async function start() {
    setError("");
    try {
      const { BrowserQRCodeReader } = await import("@zxing/browser");
      const reader = new BrowserQRCodeReader();
      controls.current = await reader.decodeFromVideoDevice(undefined, video.current!, (result) => {
        if (result) { onToken(result.getText()); controls.current?.stop(); }
      });
    } catch { setError("No pudimos abrir la cámara. Puedes escribir el código temporal."); }
  }
  return <div className="stack"><video className="geek-video" ref={video} playsInline muted aria-label="Vista de cámara para escanear Geek ID" /><Button type="button" variant="secondary" onClick={start}>Escanear Geek ID</Button>{error && <StatusNotice tone="error">{error}</StatusNotice>}</div>;
}

export function ChallengeDetailPage() {
  const { challengeId } = useParams(); const { items, loading } = useChallenges();
  const assigned = items.find((item) => item.challenge.id === challengeId);
  const [answer, setAnswer] = useState<Answer>({}); const [busy, setBusy] = useState(false); const [message, setMessage] = useState("");
  async function submit() {
    if (!challengeId) return;
    setBusy(true); setMessage("");
    try {
      const result = await httpsCallable<unknown, { status: string; scanned?: number; auraAwarded?: number; auraDeducted?: number; solution?: string; incorrectReason?: string; connection?: string }>(functions, "completeChallenge")({ challengeId, operationId: crypto.randomUUID(), response: answer });
      setMessage(result.data.status === "completed" ? "" : result.data.status === "failed" ? `Perdiste ${result.data.auraDeducted ?? 150} Aura. ${result.data.incorrectReason ?? ""} ${result.data.solution ?? ""} Este reto terminó; continúa con otro.` : result.data.status === "in_progress" ? `${result.data.scanned} de 2 conexiones registradas.` : "Aún no es correcto. Intenta otra vez.");
    } catch (error) { const detail = String(error); setMessage(detail.includes("PROFILE_REQUIRED") ? "Completa tu perfil de Challenges y pide a la otra persona que haga lo mismo." : detail.includes("SESSION_CODE_COOLDOWN") || detail.includes("resource-exhausted") ? "Demasiados intentos. Espera cinco minutos antes de volver a probar el código." : detail.includes("CODE_NOT_CONFIGURED") ? "El código todavía no está activo. Pídelo al equipo del evento." : "No pudimos validar tu respuesta. Revisa el código y vuelve a intentar."); }
    finally { setBusy(false); }
  }
  async function submitArchitecture(stage: number, optionId: string) {
    const result = await httpsCallable<unknown, { status: string; stage?: number; auraAwarded?: number; auraDeducted?: number; solution?: string; incorrectReason?: string }>(functions, "completeChallenge")({ challengeId: "C08", operationId: crypto.randomUUID(), response: { stage, optionId } });
    return result.data;
  }
  if (loading) return <p role="status">Cargando Challenge…</p>;
  if (!assigned) return <StatusNotice tone="error">Este Challenge no forma parte de tu paquete.</StatusNotice>;
  const { challenge, progress } = assigned;
  const social = challenge.category === "CONNECT";
  const session = challenge.category === "SESSION";
  const experience = challenge.category === "EXPERIENCE";
  const next = nextAvailableChallenge(items, challenge.id);
  const cloudAnswerReady = challenge.id === "C06" ? answer.sequence?.length === challenge.configuration.items?.length : challenge.id === "C07" ? challenge.configuration.prompts?.every((prompt) => !!answer.matches?.[prompt.id]) : !!answer.optionId;
  return <section className="stack challenge-detail"><Link className="back-link" to="/app/challenges">← Todos los Challenges</Link><header className="challenge-detail__heading"><p className="eyebrow">{challenge.id} · {progress.status === "failed" ? `−${progress.auraDeducted ?? 150} Aura` : `+${challenge.auraReward} Aura`}</p><h1>{challenge.title}</h1>{challenge.configuration?.subtitle && <strong>{challenge.configuration.subtitle}</strong>}<p className="lead">{challenge.description}</p></header><Card className="stack challenge-detail__task">{progress.status === "completed" ? <div className="challenge-complete"><span className="eyebrow">Challenge completado</span><h2>¡Ganaste {progress.auraAwarded ?? challenge.auraReward} Aura!</h2><p>Tu progreso ya está guardado. Continúa con otro reto cuando quieras.</p><Link className="ds-button ds-button--accent" to={next ? `/app/challenges/${next.challenge.id}` : "/app/challenges"}>{next ? `Ir a ${next.challenge.title} →` : "Ver todos los Challenges"}</Link></div> : progress.status === "failed" ? <div className="challenge-complete challenge-failed"><span className="eyebrow">Respuesta incorrecta · reto cerrado</span><h2>Perdiste {progress.auraDeducted ?? 150} Aura</h2>{progress.incorrectReason && <p><strong>Por qué no era correcta:</strong> {progress.incorrectReason}</p>}<p><strong>La solución:</strong> {progress.solution}</p><p className="muted">Tu saldo puede ser negativo. Puedes recuperarlo al completar otros Challenges.</p><Link className="ds-button ds-button--accent" to={next ? `/app/challenges/${next.challenge.id}` : "/app/challenges"}>{next ? `Ir a ${next.challenge.title} →` : "Ver todos los Challenges"}</Link></div> : !challenge.active ? <StatusNotice tone="info">Este Challenge está pausado temporalmente.</StatusNotice> : progress.status === "locked" ? <StatusNotice tone="info">Este Challenge estará disponible pronto.</StatusNotice> : progress.status === "processing" ? <StatusNotice tone="info">Tu foto está en revisión. Verás el resultado aquí cuando el equipo revise la imagen.</StatusNotice> : <>
    {progress.status === "rejected" && <StatusNotice tone="error">La imagen no fue aprobada. Revisa las indicaciones y envía otra selfie.</StatusNotice>}
    {social && <><p>Escanea el Geek ID de otra persona presente en el evento.</p>{challenge.configuration.conversationPrompt && <p className="muted">{challenge.configuration.conversationPrompt}</p>}<GeekScanner onToken={(geekToken) => setAnswer({ geekToken })} /><Field id="geek-token" label="Código temporal de la otra persona"><Input id="geek-token" value={answer.geekToken ?? ""} onChange={(event) => setAnswer({ geekToken: event.target.value })} /></Field></>}
    {challenge.id === "C08" && <Suspense fallback={<p role="status">Cargando sala…</p>}><ArchitectureChallenge savedStage={progress.architectureStep ?? 0} submit={submitArchitecture} /></Suspense>}
    {challenge.category === "CLOUD" && challenge.id !== "C08" && <><StatusNotice tone="info">Tienes una oportunidad. Si fallas, se descuentan 150 Aura y se muestra la solución.</StatusNotice><CloudForm challenge={challenge} answer={answer} setAnswer={setAnswer} /></>}
    {session && challenge.id !== "C12" && <><p className="muted">El speaker puede entregar este código a quienes considere, especialmente a quienes participaron. Asistir por sí solo no acredita Aura.</p><Field id="event-code" label={challenge.id === "C10" ? "Código que te dio el speaker del taller" : "Código que te dio el speaker de la charla"}><Input id="event-code" autoCapitalize="characters" value={answer.code ?? ""} onChange={(event) => setAnswer({ code: event.target.value })} /></Field></>}
    {challenge.id === "C12" && <Field id="track" label="Track que más te aportó"><select id="track" className="ds-input" value={answer.trackId ?? ""} onChange={(event) => setAnswer({ trackId: event.target.value })}><option value="">Elige un track</option>{challenge.configuration.tracks?.map((track) => <option key={track.id} value={track.id}>{track.label}</option>)}</select></Field>}
    {challenge.id === "C13" && <><p className="muted">Vive la experiencia VR en el stand de GuateGeeks. El equipo te indicará el código para confirmar el reto.</p><Field id="stand-code" label="Código de la experiencia VR"><Input id="stand-code" autoCapitalize="characters" value={answer.code ?? ""} onChange={(event) => setAnswer({ code: event.target.value })} /></Field><details><summary>¿Recibiste un código temporal del equipo?</summary><Field id="station-token" label="Código temporal"><Input id="station-token" value={answer.stationToken ?? ""} onChange={(event) => setAnswer({ stationToken: event.target.value, code: undefined })} /></Field></details></>}
    {experience && challenge.id !== "C13" && <><p>Al finalizar la experiencia, el personal de la estación te entregará un código temporal.</p><Field id="station-token" label="Código de finalización"><Input id="station-token" value={answer.stationToken ?? ""} onChange={(event) => setAnswer({ stationToken: event.target.value })} /></Field></>}
    {isPhotoChallengeId(challenge.id) ? <><p className="muted">{challenge.id === "C16" ? "Procura que ambos rostros se vean con claridad." : challenge.id === "C17" ? "Procura que tu rostro y el stand se reconozcan con claridad." : "Procura que el momento del evento se vea con claridad."}</p><PhotoEvidence challengeId={challenge.id} /></> : challenge.id !== "C08" && <Button type="button" variant="accent" block loading={busy} disabled={challenge.category === "CLOUD" && !cloudAnswerReady} onClick={submit}>{["C10", "C11", "C13"].includes(challenge.id) ? "Confirmar código" : isAwsServiceChallengeId(challenge.id) ? "Confirmar respuesta" : "Validar Challenge"}</Button>}
  </>}{message && progress.status !== "completed" && progress.status !== "failed" && <StatusNotice tone="info">{message}</StatusNotice>}</Card></section>;
}
