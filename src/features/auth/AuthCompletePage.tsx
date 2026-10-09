import { isSignInWithEmailLink, signInWithEmailLink } from "firebase/auth";
import { ArrowLeft, MailCheck } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button, Card, Field, Input, StatusNotice } from "../../design-system/components";
import { auth } from "../../firebase/auth";
import { GeekBrandPanel } from "./GeekEyesLogo";
import { pendingEmailKey } from "./LoginPage";
import "./landing.css";
import { clockPreviewSearch } from "../companion/useNow";

export function AuthCompletePage() {
  const navigate = useNavigate();
  const routeLocation = useLocation();
  const started = useRef(false);
  const [email, setEmail] = useState("");
  const [needsEmail, setNeedsEmail] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const completeSignIn = useCallback(async (value: string) => {
    setBusy(true);
    setError("");
    try {
      await signInWithEmailLink(auth, value.trim(), location.href);
      localStorage.removeItem(pendingEmailKey);
      navigate(`/app${clockPreviewSearch(routeLocation.search)}`, { replace: true });
    } catch (reason) {
      const code = typeof reason === "object" && reason !== null && "code" in reason ? String(reason.code) : "";
      if (code === "auth/invalid-email") {
        setError("Ese no es el correo al que enviamos el enlace. Revisa la dirección e inténtalo de nuevo.");
        setNeedsEmail(true);
      } else {
        setError("El enlace venció o ya se usó. Solicita uno nuevo para entrar.");
        setNeedsEmail(false);
      }
    } finally {
      setBusy(false);
    }
  }, [navigate, routeLocation.search]);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (!isSignInWithEmailLink(auth, location.href)) {
      setError("Este enlace no es válido o ya venció. Solicita uno nuevo para entrar.");
      return;
    }
    const savedEmail = localStorage.getItem(pendingEmailKey);
    if (savedEmail) {
      setEmail(savedEmail);
      void completeSignIn(savedEmail);
    } else {
      setNeedsEmail(true);
    }
  }, [completeSignIn]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!email.trim()) return;
    await completeSignIn(email);
  }

  return <main className="auth-page page">
    <Card className="auth-card stack">
      <Link to="/login" className="auth-backlink"><ArrowLeft aria-hidden size={18} /> Volver al acceso</Link>
      <GeekBrandPanel compact />
      <div className="auth-heading">
        <p className="eyebrow">Acceso seguro</p>
        <h1>{needsEmail ? "Confirma tu correo" : error ? "No pudimos entrar" : "Validando tu acceso"}</h1>
        <p className="muted">{needsEmail ? "Abriste el enlace en otro dispositivo. Confirma el correo al que lo enviamos para continuar." : error ? "Puedes solicitar un enlace nuevo y volver a intentarlo." : "Estamos verificando tu enlace con Firebase."}</p>
      </div>
      {needsEmail ? <form className="stack auth-form" onSubmit={submit}>
        <Field id="confirm-email" label="Correo electrónico" hint="Debe ser el mismo correo donde recibiste el enlace." error={error}>
          <Input id="confirm-email" type="email" autoComplete="email" inputMode="email" autoCapitalize="none" spellCheck={false} required autoFocus value={email} onChange={(event) => { setEmail(event.target.value); setError(""); }} placeholder="tu@correo.com" />
        </Field>
        <Button type="submit" variant="accent" block loading={busy}>Confirmar y entrar</Button>
      </form> : error ? <>
        <StatusNotice tone="error">{error}</StatusNotice>
        <Link className="ds-button ds-button--accent auth-retry" to="/login">Solicitar otro enlace</Link>
      </> : <div className="auth-validating" role="status" aria-live="polite"><span className="auth-delivery__icon"><MailCheck aria-hidden size={24} /></span><p>Un momento, estamos preparando tu experiencia.</p></div>}
    </Card>
  </main>;
}
