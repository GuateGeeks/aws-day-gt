import { sendSignInLinkToEmail, signInAnonymously } from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import { MailCheck } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Button, Card, Field, Input, StatusNotice } from "../../design-system/components";
import { useFirebaseEmulators } from "../../firebase/app";
import { auth } from "../../firebase/auth";
import { functions } from "../../firebase/functions";
import { TERMS_VERSION } from "../../../shared/constants";
import { GeekBrandPanel } from "./GeekEyesLogo";
import "./landing.css";

const pendingEmailKey = "aws-day-gt.pending-email";
export function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const normalizedEmail = email.trim();
      await sendSignInLinkToEmail(auth, normalizedEmail, { url: `${location.origin}/auth/complete`, handleCodeInApp: true });
      localStorage.setItem(pendingEmailKey, normalizedEmail); setEmail(normalizedEmail); setSent(true);
    } catch { setError("No pudimos enviar el enlace. Verifica tu correo e intenta de nuevo."); }
    finally { setBusy(false); }
  }
  async function enterLocalDemo() {
    setBusy(true); setError("");
    try {
      const user = auth.currentUser ?? (await signInAnonymously(auth)).user;
      await httpsCallable(functions, "completeOnboarding")({
        alias: `demo-${user.uid.slice(-6)}`,
        interests: [],
        challengeProfile: { primaryRole: "Development", experienceLevel: "Student", firstAwsCommunityDay: true, awsInterest: [] },
        // Synthetic consent is confined to the Firebase emulator demo account.
        consent: { termsVersion: TERMS_VERSION, accepted: true, photoPublication: false, marketing: false }
      });
      location.replace("/app/challenges");
    }
    catch { setError("No pudimos iniciar la demo local. Comprueba que el emulador esté activo."); }
    finally { setBusy(false); }
  }
  return <main className="auth-page page"><Card className="auth-card stack"><Link to="/" className="eyebrow">← Inicio</Link><GeekBrandPanel compact /><h1>{useFirebaseEmulators ? "Prueba local de desafíos" : sent ? "Revisa tu correo" : "Entra a la experiencia"}</h1>
    {useFirebaseEmulators ? <div className="stack"><p className="muted">Accede con una cuenta temporal para recorrer los Challenges. Los datos de esta prueba quedan solo en tu computadora.</p><Button type="button" variant="accent" block loading={busy} onClick={enterLocalDemo}>Entrar en demo local</Button>{error && <StatusNotice tone="error">{error}</StatusNotice>}</div>
      : sent ? <div className="auth-delivery" role="status">
          <span className="auth-delivery__icon" aria-hidden="true"><MailCheck size={24} strokeWidth={2.2} /></span>
          <div className="auth-delivery__copy">
            <p>Te enviamos un enlace de acceso a:</p>
            <strong className="auth-delivery__email">{email}</strong>
            <p className="auth-delivery__hint">Abre el correo para entrar. Si no lo encuentras, revisa la carpeta de spam.</p>
          </div>
          <button className="auth-delivery__change" type="button" onClick={() => setSent(false)}>Usar otro correo</button>
        </div>
        : <form className="stack" onSubmit={submit}><p className="muted">Usaremos tu correo únicamente para identificar tu progreso.</p><Field id="email" label="Correo electrónico" error={error}><Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com" /></Field><Button type="submit" variant="accent" block loading={busy}>Enviar enlace de acceso</Button></form>}</Card></main>;
}
export { pendingEmailKey };
