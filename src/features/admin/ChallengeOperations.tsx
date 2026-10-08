import { httpsCallable } from "firebase/functions";
import { collection, onSnapshot } from "firebase/firestore";
import { useEffect, useState, type FormEvent } from "react";
import type { Challenge } from "../../../shared/challenges/types";
import { Button, Card, Field, Input, StatusNotice, Textarea } from "../../design-system/components";
import { db } from "../../firebase/data";
import { functions } from "../../firebase/functions";

function parseOptions(value: string) {
  return value.split("\n").map((line) => { const [id, ...parts] = line.split(":"); return { id: id?.trim() ?? "", label: parts.join(":").trim() }; }).filter((entry) => entry.id && entry.label);
}

export function ChallengeOperations({ role }: { role?: string }) {
  const cloudId = "C09"; const [cloudPrompt, setCloudPrompt] = useState(""); const [cloudOptions, setCloudOptions] = useState(""); const [cloudCorrect, setCloudCorrect] = useState("");
  const [tracksInput, setTracksInput] = useState("");
  const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false);
  const [challenges, setChallenges] = useState<Challenge[]>([]); const [selectedId, setSelectedId] = useState("");
  const [active, setActive] = useState(true); const [reward, setReward] = useState(100); const [description, setDescription] = useState("");
  useEffect(() => onSnapshot(collection(db, "challenges"), (snapshot) => setChallenges(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Challenge).sort((a, b) => a.id.localeCompare(b.id)))), []);
  useEffect(() => {
    const cloud = challenges.find((item) => item.id === cloudId);
    if (cloud) { setCloudPrompt((cloud.configuration?.clues ?? []).join("\n")); setCloudOptions((cloud.configuration?.options ?? []).map((option) => `${option.id}:${option.label}`).join("\n")); }
    const pulse = challenges.find((item) => item.id === "C12");
    if (pulse) setTracksInput((pulse.configuration?.tracks ?? []).map((track) => `${track.id}:${track.label}`).join("\n"));
  }, [challenges]);
  function selectChallenge(id: string) {
    setSelectedId(id); const challenge = challenges.find((item) => item.id === id);
    if (challenge) { setActive(challenge.active); setReward(challenge.auraReward); setDescription(challenge.description); }
  }
  async function saveCloud(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    try { await httpsCallable(functions, "configureCloudQuestion")({ challengeId: cloudId, prompt: cloudPrompt, options: parseOptions(cloudOptions), correctOptionId: cloudCorrect }); setMessage("Pregunta Cloud actualizada."); setCloudCorrect(""); }
    catch { setMessage("No pudimos actualizar la pregunta Cloud."); }
    finally { setBusy(false); }
  }
  async function saveTracks(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    try { await httpsCallable(functions, "configureTrackPulse")({ tracks: parseOptions(tracksInput) }); setMessage("Tracks actualizados."); }
    catch { setMessage("No pudimos actualizar los tracks."); }
    finally { setBusy(false); }
  }
  async function saveSettings(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    try { await httpsCallable(functions, "updateChallengeSettings")({ challengeId: selectedId, active, auraReward: reward, description }); setMessage("Challenge actualizado."); }
    catch (error) { setMessage(String(error).includes("CHALLENGE_ALREADY_ASSIGNED") ? "Este Challenge ya está asignado y no se puede pausar." : "No pudimos actualizar el Challenge. Revisa sus datos."); }
    finally { setBusy(false); }
  }
  return <div className="stack">
    {role === "admin" && <Card className="stack"><h2>Desafío activo y créditos</h2><form className="stack" onSubmit={saveSettings}><Field id="challenge-admin" label="Desafío"><select id="challenge-admin" className="ds-input" required value={selectedId} onChange={(event) => selectChallenge(event.target.value)}><option value="">Elige un desafío</option>{challenges.filter((challenge) => !["C03", "C05", "C10", "C11", "C13", "C14"].includes(challenge.id)).map((challenge) => <option key={challenge.id} value={challenge.id}>{challenge.id} · {challenge.title}</option>)}</select></Field><Field id="challenge-reward" label="Créditos otorgados"><Input id="challenge-reward" type="number" min={1} max={500} required value={reward} onChange={(event) => setReward(Number(event.target.value))} /></Field><Field id="challenge-description" label="Descripción"><Textarea id="challenge-description" required value={description} onChange={(event) => setDescription(event.target.value)} /></Field><label className="check-row"><input type="checkbox" checked={active} disabled={["C08", "C12", "C15"].includes(selectedId)} onChange={(event) => setActive(event.target.checked)} />Desafío activo</label><Button type="submit" loading={busy}>Guardar desafío</Button></form></Card>}
    {role === "admin" && <Card className="stack"><h2>Escenario Cloud · C09</h2><p className="muted">C08 «Rescata la señal» ya tiene sus dos situaciones configuradas en la aplicación.</p><form className="stack" onSubmit={saveCloud}><Field id="cloud-prompt" label="Pistas, una por línea"><Textarea id="cloud-prompt" required value={cloudPrompt} onChange={(event) => setCloudPrompt(event.target.value)} /></Field><Field id="cloud-options" label="Opciones: una por línea como id:Texto"><Textarea id="cloud-options" required value={cloudOptions} onChange={(event) => setCloudOptions(event.target.value)} /></Field><Field id="cloud-correct" label="ID correcto (privado)"><Input id="cloud-correct" required value={cloudCorrect} onChange={(event) => setCloudCorrect(event.target.value)} /></Field><Button type="submit" loading={busy}>Guardar escenario</Button></form></Card>}
    {role === "admin" && <Card className="stack"><h2>Tracks de Track Pulse</h2><form className="stack" onSubmit={saveTracks}><Field id="tracks-config" label="Tracks: uno por línea como id:Nombre"><Textarea id="tracks-config" required value={tracksInput} onChange={(event) => setTracksInput(event.target.value)} /></Field><Button type="submit" loading={busy}>Guardar tracks</Button></form></Card>}
    {message && <StatusNotice tone={message.startsWith("No") ? "error" : "success"}>{message}</StatusNotice>}
  </div>;
}
