import { httpsCallable } from "firebase/functions";
import { ref, uploadBytes } from "firebase/storage";
import { useState, type ChangeEvent } from "react";
import { EVENT_ID } from "../../../shared/constants";
import type { Mission } from "../../../shared/types";
import { Button, StatusNotice } from "../../design-system/components";
import { auth } from "../../firebase/auth";
import { functions } from "../../firebase/functions";
import { storage } from "../../firebase/storage";
import { processPhoto } from "../../offline/photo-processing";

export function PhotoEvidence({ mission }: { mission: Mission }) {
  const [file, setFile] = useState<File | null>(null); const [preview, setPreview] = useState(""); const [busy, setBusy] = useState(false); const [message, setMessage] = useState("");
  function selected(event: ChangeEvent<HTMLInputElement>) { const next = event.target.files?.[0] ?? null; setFile(next); if (next) setPreview(URL.createObjectURL(next)); }
  async function upload() { if (!file || !auth.currentUser) return; setBusy(true); setMessage("");
    try { const blob = await processPhoto(file); const operationId = crypto.randomUUID(); const storagePath = `evidence/${EVENT_ID}/${auth.currentUser.uid}/${mission.id}/${operationId}.webp`; await uploadBytes(ref(storage, storagePath), blob, { contentType: "image/webp" }); await httpsCallable(functions, "registerPhotoSubmission")({ missionId: mission.id, operationId, storagePath }); setMessage("Foto enviada. El equipo la revisará antes de sumar los puntos."); }
    catch { setMessage("No pudimos subir la foto. Usa una imagen JPG, PNG o WebP e intenta de nuevo."); } finally { setBusy(false); }
  }
  return <div className="stack"><label className="photo-picker">{preview ? <img src={preview} alt="Vista previa de la evidencia" /> : <span>Selecciona o toma una foto</span>}<input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={selected} /></label>{message && <StatusNotice tone={message.startsWith("Foto") ? "success" : "error"}>{message}</StatusNotice>}<Button type="button" variant="accent" block loading={busy} disabled={!file} onClick={upload}>Enviar foto</Button></div>;
}
