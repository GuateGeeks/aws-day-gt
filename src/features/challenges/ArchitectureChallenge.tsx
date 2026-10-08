import { useState } from "react";
import { formatCredits } from "../../design-system/credits";
import { ServiceDecisionScene } from "./ServiceDecisionScene";
import "./architecture.css";

type Result = { status: string; stage?: number; auraAwarded?: number; auraDeducted?: number; solution?: string; incorrectReason?: string };
type Props = { savedStage: number; submit: (stage: number, optionId: string) => Promise<Result> };

const services = [
  { id: "sqs", label: "SQS" },
  { id: "lambda", label: "Lambda" },
  { id: "dynamo", label: "DynamoDB" }
] as const;
const situations = [
  { prompt: "La misma inscripción apareció dos veces. ¿En qué base de datos usarías una escritura condicional para impedir el duplicado?" },
  { prompt: "Un evento defectuoso detiene también a los demás. ¿Qué servicio ejecutaría la validación de cada evento por separado?" }
] as const;

export function ArchitectureChallenge({ savedStage, submit }: Props) {
  const [stage, setStage] = useState<0 | 1>(savedStage === 1 ? 1 : 0);
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [correct, setCorrect] = useState(false);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function confirm() {
    if (busy || correct || done || !selected) return;
    setBusy(true);
    setFeedback("Comprobando tu respuesta…");
    try {
      const result = await submit(stage, selected);
      if (result.status === "failed") {
        setDone(true);
        setFeedback(`Perdiste ${formatCredits(result.auraDeducted ?? 20)}. ${result.incorrectReason ?? ""} ${result.solution ?? "Este reto terminó."} Continúa con otro reto.`);
      } else if (stage === 0 && result.status === "in_progress" && result.stage === 1) {
        setCorrect(true);
        setFeedback("¡Respuesta correcta! Pulsa Siguiente para la última situación.");
      } else if (stage === 1 && result.status === "completed") {
        setDone(true);
        setFeedback(`¡Reto completado! Ganaste ${formatCredits(result.auraAwarded ?? 150)}.`);
      } else {
        setFeedback("No pudimos guardar el resultado. Intenta de nuevo.");
      }
    } catch {
      setFeedback("No pudimos validar tu respuesta. Intenta de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  function next() {
    if (!correct || stage !== 0) return;
    setStage(1);
    setSelected(null);
    setFeedback("");
    setCorrect(false);
  }

  return <div className="architecture">
    <div className="architecture__heading"><span className="eyebrow">Reto {stage + 1} de 2</span><h2>{situations[stage].prompt}</h2><p>Selecciona el servicio que resolvería la falla. Una respuesta incorrecta descuenta 20 créditos, muestra la explicación y cierra el reto.</p></div>
    <ServiceDecisionScene options={services} selected={selected} disabled={busy || correct || done} onSelect={(optionId) => { setSelected(optionId); setFeedback(""); }} />
    <div className="architecture__actions">
      {feedback && <p className="architecture__feedback" role="status" aria-live="polite">{feedback}</p>}
      {correct && stage === 0 ? <button className="ds-button ds-button--accent" type="button" onClick={next}>Siguiente</button>
        : !done && <button className="ds-button ds-button--accent" type="button" disabled={!selected || busy} onClick={() => void confirm()}>Confirmar respuesta</button>}
    </div>
  </div>;
}
