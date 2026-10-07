import { httpsCallable } from "firebase/functions";
import { ref, uploadBytes } from "firebase/storage";
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
  function selected(event: ChangeEvent<HTMLInputElement>) { const next = event.target.files?.[0] ?? null; setFile(next); if (next) setPreview(URL.createObjectURL(next)); }
  async function upload() { if (!file || !auth.currentUser || !challengeId) return; setBusy(true); setMessage("");
    try { const blob = await processPhoto(file); const operationId = crypto.randomUUID(); const storagePath = `evidence/${EVENT_ID}/${auth.currentUser.uid}/${challengeId}/${operationId}.webp`; await uploadBytes(ref(storage, storagePath), blob, { contentType: "image/webp" }); await httpsCallable(functions, "registerPhotoSubmission")({ missionId: challengeId, operationId, storagePath }); setMessage("Foto enviada. El equipo la revisará antes de sumar Aura."); }
    catch { setMessage("No pudimos subir la foto. Usa una imagen JPG, PNG o WebP e intenta de nuevo."); } finally { setBusy(false); }
  }
  if (!challengeId) return null;
  return <div className="stack"><label className="photo-picker">{preview ? <img src={preview} alt="Vista previa de la foto seleccionada" /> : <span>Selecciona o toma tu selfie</span>}<input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" capture={challengeId === "C15" ? "environment" : "user"} onChange={selected} aria-label="Seleccionar fotografía para revisión" /></label>{message && <StatusNotice tone={message.startsWith("Foto") ? "success" : "error"}>{message}</StatusNotice>}<Button type="button" variant="accent" block loading={busy} disabled={!file} onClick={upload}>Enviar foto para revisión</Button></div>;
}
