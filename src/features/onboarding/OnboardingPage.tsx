import { httpsCallable } from "firebase/functions";
import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { INTERESTS, TERMS_VERSION } from "../../../shared/constants";
import { onboardingInputSchema } from "../../../shared/schemas";
import { Button, Card, Field, Input, StatusNotice } from "../../design-system/components";
import { functions } from "../../firebase/functions";
import { useAuth } from "../auth/AuthProvider";

export function OnboardingPage() {
  const { user, profile, loading } = useAuth(); const navigate = useNavigate();
  const [alias, setAlias] = useState(""); const [interests, setInterests] = useState<string[]>([]);
  const [accepted, setAccepted] = useState(false); const [photoPublication, setPhoto] = useState(false); const [marketing, setMarketing] = useState(false);
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  if (!loading && !user) return <Navigate to="/login" replace />;
  if (profile?.onboardingComplete) return <Navigate to="/app/missions" replace />;
  async function submit(event: FormEvent) {
    event.preventDefault(); setError("");
    const result = onboardingInputSchema.safeParse({ alias, interests, consent: { termsVersion: TERMS_VERSION, accepted, photoPublication, marketing } });
    if (!result.success) { setError("Revisa tu alias y acepta los términos para continuar."); return; }
    setBusy(true);
    try { await httpsCallable(functions, "completeOnboarding")(result.data); navigate("/app/missions", { replace: true }); }
    catch (reason) { setError(String(reason).includes("ALIAS_TAKEN") ? "Ese alias ya está en uso. Prueba otro." : "No pudimos guardar tu perfil. Intenta de nuevo."); }
    finally { setBusy(false); }
  }
  return <main className="onboarding page"><div className="stack"><p className="eyebrow">Configura tu experiencia</p><h1>¿Cómo aparecerás?</h1><p className="muted">Tu alias será público en el ranking. Tu correo nunca se mostrará.</p>
    <form className="stack" onSubmit={submit}><Card className="stack"><Field id="alias" label="Alias público" hint="3–24 caracteres: letras, números, punto, guion o guion bajo."><Input id="alias" required minLength={3} maxLength={24} value={alias} onChange={(e) => setAlias(e.target.value)} /></Field></Card>
    <Card className="stack"><h2>¿Qué te interesa?</h2><p className="muted">Opcional. Nos ayuda a personalizar tus misiones.</p><div className="interest-grid">{INTERESTS.map((interest) => <label className="check-tile" key={interest}><input type="checkbox" checked={interests.includes(interest)} onChange={() => setInterests((all) => all.includes(interest) ? all.filter((item) => item !== interest) : all.length < 6 ? [...all, interest] : all)} />{interest}</label>)}</div></Card>
    <Card className="stack"><h2>Privacidad y consentimiento</h2><label className="check-row"><input type="checkbox" required checked={accepted} onChange={(e) => setAccepted(e.target.checked)} /><span>Acepto los términos y el aviso de privacidad (versión {TERMS_VERSION}).</span></label><label className="check-row"><input type="checkbox" checked={photoPublication} onChange={(e) => setPhoto(e.target.checked)} /><span>Permito que mis fotos aprobadas se usen en comunicaciones del evento.</span></label><label className="check-row"><input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} /><span>Deseo recibir novedades de próximos eventos.</span></label></Card>
    {error && <StatusNotice tone="error">{error}</StatusNotice>}<Button type="submit" block variant="accent" loading={busy}>Crear mi reto</Button></form></div></main>;
}
