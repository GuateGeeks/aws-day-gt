import { httpsCallable } from "firebase/functions";
import { Camera, Store, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Card, StatusNotice } from "../../design-system/components";
import { functions } from "../../firebase/functions";
import { useChallenges } from "./useChallenges";

const selfieChallenges = [
  { id: "C16", title: "Selfie con un speaker", icon: UserRound, instruction: "Aparece junto a un speaker del evento." },
  { id: "C17", title: "Selfie en un stand", icon: Store, instruction: "Aparece frente a cualquier stand del evento." }
];

export function GeekIdPage() {
  const { items, loading } = useChallenges();
  const [image, setImage] = useState("");
  const [token, setToken] = useState("");
  const [expiresAtMillis, setExpiresAtMillis] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function refresh() {
    setBusy(true);
    setError("");
    try {
      const response = await httpsCallable<unknown, { token: string; expiresAtMillis: number }>(functions, "issueGeekId")({});
      const QRCode = await import("qrcode");
      setToken(response.data.token);
      setExpiresAtMillis(response.data.expiresAtMillis);
      setImage(await QRCode.toDataURL(response.data.token, { margin: 2, width: 280, errorCorrectionLevel: "M" }));
    } catch {
      setImage("");
      setToken("");
      setError("No pudimos generar tu Geek ID. Intenta de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => { void refresh(); }, []);
  useEffect(() => {
    if (!expiresAtMillis) return;
    const timer = window.setTimeout(() => { void refresh(); }, Math.max(1000, expiresAtMillis - Date.now() - 30_000));
    return () => window.clearTimeout(timer);
  }, [expiresAtMillis]);

  return <section className="stack geek-page">
    <header className="page-heading"><p className="eyebrow">Conecta en persona</p><h1>Mi Geek ID</h1><p className="muted">Tu código está disponible desde el registro. Compártelo con otras personas para completar retos de conexión.</p></header>
    <div className="geek-page__grid">
      <Card className="stack geek-id-card">
        <div><h2>Tu código para conectar</h2><p className="muted">Se renueva cada cinco minutos.</p></div>
        {image && <img className="geek-qr" src={image} alt="Código QR temporal de tu Geek ID" />}
        {token && <p className="muted geek-token">Si la cámara falla, comparte este código temporal: <code>{token}</code></p>}
        {error && <StatusNotice tone="error">{error}</StatusNotice>}
        <Button type="button" onClick={refresh} loading={busy}>Renovar Geek ID</Button>
      </Card>
      <section className="challenge-section geek-selfies" aria-labelledby="geek-selfies">
        <div className="challenge-section__heading"><div><p className="eyebrow"><Camera aria-hidden size={15} /> Bonus del evento</p><h2 id="geek-selfies">Selfies del evento</h2></div></div>
        <p className="muted">Sube cada selfie por separado. El equipo confirmará las imágenes antes de acreditar Aura.</p>
        <div className="selfie-shortcuts">{selfieChallenges.map(({ id, title, icon: Icon, instruction }) => {
          const current = items.find(({ challenge }) => challenge.id === id);
          const status = current?.progress.status;
          const unavailable = !current || !current.challenge.active || status === "locked";
          const content = <><span className="selfie-shortcut__icon"><Icon aria-hidden size={23} /></span><span className="grow"><strong>{title}</strong><small>{instruction}</small></span><span className="selfie-shortcut__status">{unavailable ? loading ? "Preparando reto" : "No disponible temporalmente" : status === "completed" ? "Aprobada" : status === "processing" ? "En revisión" : status === "rejected" ? "Reenviar" : "Subir foto"}</span></>;
          return unavailable ? <div className="selfie-shortcut selfie-shortcut--disabled" aria-disabled="true" key={id}>{content}</div> : <Link className="selfie-shortcut" to={`/app/challenges/${id}`} key={id}>{content}</Link>;
        })}</div>
      </section>
    </div>
  </section>;
}
