import { sendSignInLinkToEmail } from "firebase/auth";
import { ArrowLeft, MailCheck, ShieldCheck } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button, Card, Field, Input } from "../../design-system/components";
import { useFirebaseEmulators } from "../../firebase/app";
import { auth } from "../../firebase/auth";
import { GeekBrandPanel } from "./GeekEyesLogo";
import "./landing.css";
import { clockPreviewSearch } from "../companion/useNow";

const pendingEmailKey = "aws-day-gt.pending-email";

function sendErrorMessage(error: unknown) {
  const code = typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";
  if (code === "auth/invalid-email") return "Revisa el formato del correo e inténtalo de nuevo.";
  if (code === "auth/too-many-requests") return "Hiciste varias solicitudes. Espera un momento antes de intentarlo otra vez.";
  if (code === "auth/unauthorized-continue-uri") return "Este dominio aún no está autorizado para iniciar sesión. Contacta al equipo del evento.";
  if (code === "auth/operation-not-allowed") return "El acceso por enlace todavía no está habilitado en Firebase. Contacta al equipo del evento.";
  if (code === "auth/network-request-failed") return "No pudimos conectar con Firebase. Revisa tu conexión e inténtalo otra vez.";
  return "No pudimos enviar el enlace. Verifica tu correo e inténtalo de nuevo.";
}

export function LoginPage() {
  const routeLocation = useLocation();
  const localAuth = useFirebaseEmulators;
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const normalizedEmail = email.trim();
    try {
      await sendSignInLinkToEmail(auth, normalizedEmail, {
        url: `${location.origin}/auth/complete${clockPreviewSearch(routeLocation.search)}`,
        handleCodeInApp: true
      });
      localStorage.setItem(pendingEmailKey, normalizedEmail);
      setEmail(normalizedEmail);
      setSent(true);
    } catch (reason) {
      setError(sendErrorMessage(reason));
    } finally {
      setBusy(false);
    }
  }

  return <main className="auth-page page">
    <Card className="auth-card stack">
      <Link to="/" className="auth-backlink"><ArrowLeft aria-hidden size={18} /> Inicio</Link>
      <GeekBrandPanel compact />
      {sent ? <>
        <div className="auth-heading">
          <p className="eyebrow">Acceso seguro</p>
          <h1>{localAuth ? "Enlace local listo" : "Revisa tu correo"}</h1>
          <p className="muted">{localAuth ? "Firebase Emulator generó un enlace para esta dirección:" : "Enviamos un enlace de acceso a esta dirección:"}</p>
        </div>
        <div className="auth-delivery" role="status" aria-live="polite">
          <span className="auth-delivery__icon" aria-hidden="true"><MailCheck size={24} strokeWidth={2.2} /></span>
          <div className="auth-delivery__copy">
            <strong className="auth-delivery__email">{email}</strong>
            {localAuth ? <p className="auth-delivery__hint">Copia el enlace de la terminal donde ejecutas Firebase Emulator y ábrelo en este navegador.</p> : <>
              <p className="auth-delivery__hint">Abre el enlace del correo para continuar. Si lo abres en otro dispositivo, te pediremos confirmar el correo.</p>
              <p className="auth-delivery__hint">Si no lo encuentras, revisa la carpeta de correo no deseado.</p>
            </>}
          </div>
          <button className="auth-delivery__change" type="button" onClick={() => { setSent(false); setError(""); }}>Usar otro correo</button>
        </div>
      </> : <>
        <div className="auth-heading">
          <p className="eyebrow">AWS Community Day Guatemala</p>
          <h1>Entra a tu cuenta</h1>
          <p className="muted">Escribe el correo que usas en el evento. Te enviaremos un enlace seguro; no necesitas contraseña.</p>
        </div>
        <form className="stack auth-form" onSubmit={submit}>
          <Field id="email" label="Correo electrónico" hint="Si es tu primera vez, podrás crear tu perfil después de confirmar el correo." error={error}>
            <Input id="email" type="email" autoComplete="email" inputMode="email" autoCapitalize="none" spellCheck={false} required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="tu@correo.com" />
          </Field>
          <Button type="submit" variant="accent" block loading={busy}>Enviar enlace de acceso</Button>
        </form>
        <p className="auth-privacy"><ShieldCheck aria-hidden size={17} /> Tu correo sirve para identificar tu progreso y no se mostrará en el ranking.</p>
      </>}
    </Card>
  </main>;
}

export { pendingEmailKey };
