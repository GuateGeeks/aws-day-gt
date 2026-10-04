import { isSignInWithEmailLink, signInWithEmailLink } from "firebase/auth";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, StatusNotice } from "../../design-system/components";
import { auth } from "../../firebase/auth";
import { pendingEmailKey } from "./LoginPage";

export function AuthCompletePage() {
  const navigate = useNavigate(); const [error, setError] = useState("");
  useEffect(() => { void (async () => {
    const email = localStorage.getItem(pendingEmailKey);
    if (!email || !isSignInWithEmailLink(auth, location.href)) { setError("El enlace no es válido o expiró. Solicita uno nuevo."); return; }
    try { await signInWithEmailLink(auth, email, location.href); localStorage.removeItem(pendingEmailKey); navigate("/app", { replace: true }); }
    catch { setError("No pudimos completar el acceso. Solicita un enlace nuevo."); }
  })(); }, [navigate]);
  return <main className="auth-page page"><Card className="auth-card stack"><h1>Validando acceso…</h1>{error ? <><StatusNotice tone="error">{error}</StatusNotice><Link to="/login">Volver a intentar</Link></> : <p className="muted">Esto tomará solo un momento.</p>}</Card></main>;
}
