import { httpsCallable } from "firebase/functions";
import { ref, uploadBytes } from "firebase/storage";
import { Camera, Images } from "lucide-react";
import { useEffect, useState, type ChangeEvent } from "react";
import { EVENT_ID } from "../../../shared/constants";
import type { Mission } from "../../../shared/types";
import { Button, StatusNotice } from "../../design-system/components";
import { auth } from "../../firebase/auth";
import { functions } from "../../firebase/functions";
import { storage } from "../../firebase/storage";
import { processPhoto } from "../../offline/photo-processing";

export function PhotoEvidence({ challengeId }: { mission?: Mission; challengeId?: string }) {
  const [file, setFile] = useState<File | null>(null); const [preview, setPreview] = useState(""); const [busy, setBusy] = useState(false); const [message, setMessage] = useState("");
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  function selected(event: ChangeEvent<HTMLInputElement>) { const next = event.target.files?.[0]; if (next) { setFile(next); setPreview(URL.createObjectURL(next)); } event.target.value = ""; }
  async function upload() { if (!file || !auth.currentUser || !challengeId) return; setBusy(true); setMessage("");
    try { const blob = await processPhoto(file, challengeId === "C15" ? 2000 : 1600); const operationId = crypto.randomUUID(); const storagePath = `evidence/${EVENT_ID}/${auth.currentUser.uid}/${challengeId}/${operationId}.webp`; await uploadBytes(ref(storage, storagePath), blob, { contentType: "image/webp" }); await httpsCallable(functions, "registerPhotoSubmission")({ missionId: challengeId, operationId, storagePath }); setMessage("Imagen enviada. El equipo la revisará antes de sumar créditos."); }
    catch { setMessage("No pudimos subir la foto. Usa una imagen JPG, PNG o WebP e intenta de nuevo."); } finally { setBusy(false); }
  }
  if (!challengeId) return null;
  const screenshot = challengeId === "C15";
  return <div className="stack">
    <div className={`photo-picker${screenshot ? " photo-picker--screenshot" : ""}`}>{preview ? <img src={preview} alt={screenshot ? "Vista previa de la captura seleccionada" : "Vista previa de la foto seleccionada"} /> : <span>{screenshot ? "Selecciona la captura de tu publicación" : "Selecciona o toma tu selfie"}</span>}</div>
    <div className="photo-picker__actions">
      {!screenshot && <label className="photo-picker__action"><Camera aria-hidden size={21} /><span>Tomar selfie</span><input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" capture="user" onChange={selected} aria-label="Tomar selfie con la cámara" disabled={busy} /></label>}
      <label className="photo-picker__action"><Images aria-hidden size={21} /><span>{screenshot ? "Elegir captura de la galería" : "Elegir de la galería"}</span><input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" onChange={selected} aria-label={screenshot ? "Seleccionar captura para revisión" : "Elegir de la galería"} disabled={busy} /></label>
    </div>
    {message && <StatusNotice tone={message.startsWith("Imagen") ? "success" : "error"}>{message}</StatusNotice>}
    <Button type="button" variant="accent" block loading={busy} disabled={!file} onClick={upload}>Enviar imagen para revisión</Button>
  </div>;
}
