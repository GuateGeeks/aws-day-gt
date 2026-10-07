import { httpsCallable } from "firebase/functions";
import { collection, onSnapshot } from "firebase/firestore";
import { useEffect, useState, type FormEvent } from "react";
import type { Challenge } from "../../../shared/challenges/types";
import type { ExperienceStation } from "../../../shared/challenges/stations";
import { Button, Card, Field, Input, StatusNotice, Textarea } from "../../design-system/components";
import { db } from "../../firebase/data";
import { functions } from "../../firebase/functions";

function parseOptions(value: string) {
  return value.split("\n").map((line) => { const [id, ...parts] = line.split(":"); return { id: id?.trim() ?? "", label: parts.join(":").trim() }; }).filter((entry) => entry.id && entry.label);
}

export function ChallengeOperations({ role }: { role?: string }) {
  const [stationId, setStationId] = useState("cloudforge"); const [participantUid, setParticipantUid] = useState(""); const [token, setToken] = useState("");
  const [eventCodeChallengeId, setEventCodeChallengeId] = useState("C10"); const [code, setCode] = useState(""); const [eventCodeActive, setEventCodeActive] = useState(true);
  const cloudId = "C09"; const [cloudPrompt, setCloudPrompt] = useState(""); const [cloudOptions, setCloudOptions] = useState(""); const [cloudCorrect, setCloudCorrect] = useState("");
  const [tracksInput, setTracksInput] = useState("");
  const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false);
  const [challenges, setChallenges] = useState<Challenge[]>([]); const [selectedId, setSelectedId] = useState("");
  const [stations, setStations] = useState<ExperienceStation[]>([]); const [stationName, setStationName] = useState("Experiencia VR GuateGeeks"); const [stationActive, setStationActive] = useState(true);
  const [active, setActive] = useState(true); const [reward, setReward] = useState(100); const [description, setDescription] = useState("");
  useEffect(() => onSnapshot(collection(db, "challenges"), (snapshot) => setChallenges(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Challenge).sort((a, b) => a.id.localeCompare(b.id)))), []);
  useEffect(() => {
    const cloud = challenges.find((item) => item.id === cloudId);
    if (cloud) { setCloudPrompt((cloud.configuration?.clues ?? []).join("\n")); setCloudOptions((cloud.configuration?.options ?? []).map((option) => `${option.id}:${option.label}`).join("\n")); }
    const pulse = challenges.find((item) => item.id === "C12");
    if (pulse) setTracksInput((pulse.configuration?.tracks ?? []).map((track) => `${track.id}:${track.label}`).join("\n"));
  }, [challenges]);
  useEffect(() => onSnapshot(collection(db, "experienceStations"), (snapshot) => {
    const next = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as ExperienceStation);
    setStations(next);
    const current = next.find((item) => item.id === stationId);
    if (current) { setStationName(current.name); setStationActive(current.active); }
  }), [stationId]);
  function selectStation(id: string) {
    setStationId(id); const station = stations.find((item) => item.id === id);
    if (station) { setStationName(station.name); setStationActive(station.active); }
  }
  async function saveStation(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    try { await httpsCallable(functions, "updateExperienceStation")({ stationId, name: stationName, active: stationActive }); setMessage("Estación actualizada."); }
    catch { setMessage("No pudimos actualizar la estación."); }
    finally { setBusy(false); }
  }
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
  async function issue() {
    setBusy(true); setMessage("");
    try { const result = await httpsCallable<unknown, { token: string }>(functions, "issueStationToken")({ stationId, participantUid: participantUid || undefined }); setToken(result.data.token); setMessage("Código oficial creado y registrado en auditoría. Vence en 10 minutos y sirve una sola vez."); }
    catch { setMessage("No pudimos crear el código. Revisa la estación y el participante."); }
    finally { setBusy(false); }
  }
  async function configure(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      await httpsCallable(functions, "configureEventCode")({ challengeId: eventCodeChallengeId, code, active: eventCodeActive });
      setMessage("Código del evento guardado. Funciona una vez por participante."); setCode("");
    } catch { setMessage("No pudimos guardar el código. Revisa el valor y vuelve a intentar."); }
    finally { setBusy(false); }
  }
  return <div className="stack"><Card className="stack"><h2>Experiencias VR del evento</h2><p className="muted">Emite el código solo después de confirmar la finalización en la estación. Para un ajuste manual, escribe el UID del participante y registra la entrega.</p><Field id="station" label="Estación"><select id="station" className="ds-input" value={stationId} onChange={(event) => selectStation(event.target.value)}><option value="cloudforge">Experiencia VR GuateGeeks</option><option value="vr-explorer">VR Explorer</option></select></Field><Field id="participant-uid" label="UID del participante (recomendado)"><Input id="participant-uid" value={participantUid} onChange={(event) => setParticipantUid(event.target.value)} /></Field><Button type="button" onClick={issue} loading={busy}>Emitir código oficial</Button>{token && <p>Código de un solo uso: <code>{token}</code></p>}</Card>
    {role === "admin" && <Card className="stack"><h2>Configurar estación</h2><p className="muted">Método de validación actual: código oficial emitido por personal.</p><form className="stack" onSubmit={saveStation}><Field id="station-name" label="Nombre de la estación"><Input id="station-name" required value={stationName} onChange={(event) => setStationName(event.target.value)} /></Field><label className="check-row"><input type="checkbox" checked={stationActive} onChange={(event) => setStationActive(event.target.checked)} />Estación activa</label><Button type="submit" loading={busy}>Guardar estación</Button></form></Card>}
    {role === "admin" && <Card className="stack"><h2>Challenge activo y Aura</h2><form className="stack" onSubmit={saveSettings}><Field id="challenge-admin" label="Challenge"><select id="challenge-admin" className="ds-input" required value={selectedId} onChange={(event) => selectChallenge(event.target.value)}><option value="">Elige un Challenge</option>{challenges.map((challenge) => <option key={challenge.id} value={challenge.id}>{challenge.id} · {challenge.title}</option>)}</select></Field><Field id="challenge-reward" label="Aura otorgada"><Input id="challenge-reward" type="number" min={1} max={500} required value={reward} onChange={(event) => setReward(Number(event.target.value))} /></Field><Field id="challenge-description" label="Descripción"><Textarea id="challenge-description" required value={description} onChange={(event) => setDescription(event.target.value)} /></Field><label className="check-row"><input type="checkbox" checked={active} disabled={selectedId === "C13"} onChange={(event) => setActive(event.target.checked)} />Challenge activo</label><Button type="submit" loading={busy}>Guardar Challenge</Button></form></Card>}
    {role === "admin" && <Card className="stack"><h2>Escenario Cloud · C09</h2><p className="muted">C08 «Rescata la señal» ya tiene sus dos situaciones configuradas en la aplicación.</p><form className="stack" onSubmit={saveCloud}><Field id="cloud-prompt" label="Pistas, una por línea"><Textarea id="cloud-prompt" required value={cloudPrompt} onChange={(event) => setCloudPrompt(event.target.value)} /></Field><Field id="cloud-options" label="Opciones: una por línea como id:Texto"><Textarea id="cloud-options" required value={cloudOptions} onChange={(event) => setCloudOptions(event.target.value)} /></Field><Field id="cloud-correct" label="ID correcto (privado)"><Input id="cloud-correct" required value={cloudCorrect} onChange={(event) => setCloudCorrect(event.target.value)} /></Field><Button type="submit" loading={busy}>Guardar escenario</Button></form></Card>}
    {role === "admin" && <Card className="stack"><h2>Tracks de Track Pulse</h2><form className="stack" onSubmit={saveTracks}><Field id="tracks-config" label="Tracks: uno por línea como id:Nombre"><Textarea id="tracks-config" required value={tracksInput} onChange={(event) => setTracksInput(event.target.value)} /></Field><Button type="submit" loading={busy}>Guardar tracks</Button></form></Card>}
    {role === "admin" && <Card className="stack"><h2>Códigos del evento</h2><p className="muted">Un código por actividad: cualquier taller, cualquier charla o el stand GuateGeeks. Cada participante recibe Aura una vez por Challenge.</p><form className="stack" onSubmit={configure}><Field id="event-code-challenge" label="Actividad"><select id="event-code-challenge" className="ds-input" value={eventCodeChallengeId} onChange={(event) => setEventCodeChallengeId(event.target.value)}><option value="C10">Taller · C10</option><option value="C11">Charla · C11</option><option value="C13">Stand GuateGeeks · C13</option></select></Field><Field id="event-code" label="Nuevo código"><Input id="event-code" required minLength={4} maxLength={30} autoCapitalize="characters" value={code} onChange={(event) => setCode(event.target.value)} /></Field><label className="check-row"><input type="checkbox" checked={eventCodeActive} onChange={(event) => setEventCodeActive(event.target.checked)} />Código activo</label><Button type="submit" loading={busy}>Guardar código</Button></form></Card>}
    {message && <StatusNotice tone={message.startsWith("No") ? "error" : "success"}>{message}</StatusNotice>}
  </div>;
}
