import { sendSignInLinkToEmail, signInAnonymously } from "firebase/auth";
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Card, Field, Input, StatusNotice } from "../../design-system/components";
import { useFirebaseEmulators } from "../../firebase/app";
import { auth } from "../../firebase/auth";
import { GeekBrandPanel } from "./GeekEyesLogo";
import "./landing.css";

const pendingEmailKey = "aws-day-gt.pending-email";
export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      await sendSignInLinkToEmail(auth, email.trim(), { url: `${location.origin}/auth/complete`, handleCodeInApp: true });
      localStorage.setItem(pendingEmailKey, email.trim()); setSent(true);
    } catch { setError("No pudimos enviar el enlace. Verifica tu correo e intenta de nuevo."); }
    finally { setBusy(false); }
  }
  async function enterLocalDemo() {
    setBusy(true); setError("");
    try { await signInAnonymously(auth); navigate("/onboarding", { replace: true }); }
    catch { setError("No pudimos iniciar la demo local. Comprueba que el emulador esté activo."); }
    finally { setBusy(false); }
  }
  return <main className="auth-page page"><Card className="auth-card stack"><Link to="/" className="eyebrow">← Inicio</Link><GeekBrandPanel compact /><h1>{useFirebaseEmulators ? "Prueba local de Aura Challenges" : sent ? "Revisa tu correo" : "Entra a la experiencia"}</h1>
    {useFirebaseEmulators ? <div className="stack"><p className="muted">Accede con una cuenta temporal para recorrer los Challenges. Los datos de esta prueba quedan solo en tu computadora.</p><Button type="button" variant="accent" block loading={busy} onClick={enterLocalDemo}>Entrar en demo local</Button>{error && <StatusNotice tone="error">{error}</StatusNotice>}</div>
      : sent ? <StatusNotice>Enviamos un enlace de acceso a <strong>{email}</strong>. También revisa spam.</StatusNotice>
        : <form className="stack" onSubmit={submit}><p className="muted">Usaremos tu correo únicamente para identificar tu progreso.</p><Field id="email" label="Correo electrónico" error={error}><Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com" /></Field><Button type="submit" variant="accent" block loading={busy}>Enviar enlace de acceso</Button></form>}</Card></main>;
}
export { pendingEmailKey };
