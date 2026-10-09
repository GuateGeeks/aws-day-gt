import { httpsCallable } from "firebase/functions";
import { useState, type FormEvent } from "react";
import type { Mission } from "../../../shared/types";
import { Button, StatusNotice } from "../../design-system/components";
import { useSubmissionWindowOpen, SubmissionWindowNotice } from "./SubmissionWindowNotice";
import { functions } from "../../firebase/functions";
import { isSubmissionWindowOpen } from "../../../shared/submission-window";

type SubmissionResult = { status: "approved" | "incorrect" | "failed"; attemptsRemaining: number };

export function TextEvidence({ mission }: { mission: Mission }) {
  const submissionOpen = useSubmissionWindowOpen();
  const configuration = mission.selection;
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [exhausted, setExhausted] = useState(false);
  const [message, setMessage] = useState("");
  if (!configuration) return <StatusNotice tone="error">Esta misión no tiene opciones configuradas.</StatusNotice>;
  if (!submissionOpen) return <SubmissionWindowNotice />;
  const activeConfiguration = configuration;
  const validCount = selected.length >= activeConfiguration.minSelections && selected.length <= activeConfiguration.maxSelections;
  const guidance = activeConfiguration.minSelections === activeConfiguration.maxSelections
    ? `Selecciona ${activeConfiguration.minSelections} ${activeConfiguration.minSelections === 1 ? "opción" : "opciones"}.`
    : `Selecciona entre ${activeConfiguration.minSelections} y ${activeConfiguration.maxSelections} opciones.`;
  function change(optionId: string, checked: boolean) {
    if (activeConfiguration.mode === "single") { setSelected([optionId]); return; }
    setSelected((current) => checked ? [...current, optionId] : current.filter((id) => id !== optionId));
  }
  async function submit(event: FormEvent) {
    event.preventDefault(); if (!validCount || exhausted) return; setBusy(true); setMessage("");
    try {
      const response = await httpsCallable(functions, "submitTextMission")({ missionId: mission.id, operationId: crypto.randomUUID(), selectionIds: selected });
      const result = response.data as SubmissionResult;
      if (result.status === "approved") setMessage("¡Misión completada! Tus puntos ya están en el marcador.");
      else if (result.status === "incorrect") setMessage("La selección es incorrecta. Te queda 1 intento.");
      else { setExhausted(true); setMessage("Agotaste los dos intentos. Puedes reemplazar esta misión si tienes un reemplazo disponible."); }
    } catch (error) { setMessage(!isSubmissionWindowOpen() || String(error).includes("SUBMISSIONS_CLOSED") ? "El periodo para enviar respuestas, fotos y selfies ya cerró." : "No pudimos enviar tu selección. Comprueba tu conexión e intenta de nuevo."); }
    finally { setBusy(false); }
  }
  return <form className="stack" onSubmit={submit}><fieldset className="selection-field stack" disabled={busy || exhausted}><legend>Elige tu respuesta</legend><p className="muted">{guidance}</p><div className="selection-options">{activeConfiguration.options.map((option) => { const checked = selected.includes(option.id); const atMaximum = activeConfiguration.mode === "multiple" && selected.length >= activeConfiguration.maxSelections; return <label className="selection-option" key={option.id}><input type={activeConfiguration.mode === "single" ? "radio" : "checkbox"} name={`selection-${mission.id}`} value={option.id} checked={checked} disabled={!checked && atMaximum} onChange={(event) => change(option.id, event.target.checked)} /><span>{option.label}</span></label>; })}</div></fieldset>{message && <StatusNotice tone={message.startsWith("¡") ? "success" : "error"}>{message}</StatusNotice>}<Button type="submit" variant="accent" block loading={busy} disabled={!validCount || exhausted}>Enviar evidencia</Button></form>;
}
