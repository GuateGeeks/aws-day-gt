import { signOut } from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import { LogOut, ShieldCheck, Trash2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, StatusNotice } from "../../design-system/components";
import { canOpenAdminConsole } from "../../app/RouteGuards";
import { auth } from "../../firebase/auth";
import { functions } from "../../firebase/functions";
import { useAuth } from "../auth/AuthProvider";
import { ChallengeProfileFields, emptyChallengeProfile, type ChallengeProfileDraft } from "../onboarding/ChallengeProfileFields";
import { CommunityLinks } from "./CommunityLinks";
import { formatConsentDate, ProfileDetail, ProfileSummary } from "./ProfileSummary";

function maskEmail(email: string) { const [name = "", domain = ""] = email.split("@"); return `${name.slice(0, 2)}•••@${domain}`; }
export function ProfilePage() {
  const { user, profile } = useAuth(); const navigate = useNavigate(); const [message, setMessage] = useState("");
  const [challengeProfile, setChallengeProfile] = useState<ChallengeProfileDraft>(() => ({
    ...emptyChallengeProfile,
    primaryRole: profile?.primaryRole ?? "",
    experienceLevel: profile?.experienceLevel ?? "",
    firstAwsCommunityDay: profile?.firstAwsCommunityDay ?? null,
    awsInterest: profile?.awsInterest ?? []
  }));
  async function saveChallengeProfile() {
    try { await httpsCallable(functions, "setChallengeProfile")(challengeProfile); setMessage("Perfil de Challenges guardado."); }
    catch { setMessage("No pudimos guardar el perfil. Intenta de nuevo."); }
  }
  async function remove() { if (!confirm("¿Solicitar la eliminación de tus datos? El equipo procesará la solicitud.")) return; await httpsCallable(functions, "requestDataDeletion")({}); setMessage("Solicitud registrada. Te contactaremos cuando finalice."); }
  const role = profile?.role === "participant" ? "Participante" : profile?.role ?? "No configurado";
  const consent = profile?.consent;
  const challengeProfileComplete = Boolean(profile?.primaryRole);
  return <section className="stack">
    <p className="eyebrow">Cuenta y privacidad</p><h1>Perfil</h1>
    <Card className="stack"><div className="profile-avatar">{profile?.alias?.slice(0, 2).toUpperCase() || "AWS"}</div><h2>{profile?.alias || "Alias no configurado"}</h2><p className="muted">{maskEmail(user?.email ?? "")}</p><div className="cluster"><ShieldCheck aria-hidden size={18} /><span>{role}</span></div></Card>
    {challengeProfileComplete ? <ProfileSummary title="Tu perfil para Challenges">
      <ProfileDetail label="Área principal">{profile?.primaryRole || "No configurado"}</ProfileDetail>
      <ProfileDetail label="Nivel de experiencia">{profile?.experienceLevel || "No configurado"}</ProfileDetail>
      <ProfileDetail label="Primer AWS Community Day">{typeof profile?.firstAwsCommunityDay === "boolean" ? (profile.firstAwsCommunityDay ? "Sí, es mi primera vez" : "No, ya había asistido") : "No configurado"}</ProfileDetail>
      <ProfileDetail label="Intereses AWS">{profile?.awsInterest?.length ? profile.awsInterest.join(", ") : "No configurado"}</ProfileDetail>
    </ProfileSummary> : profile && <Card className="stack"><h2>Tu perfil para Challenges</h2><p className="muted">Completa estos datos para tus retos de conexión. No aparecen en tu QR.</p><form className="stack" onSubmit={(event) => { event.preventDefault(); void saveChallengeProfile(); }}><ChallengeProfileFields value={challengeProfile} onChange={setChallengeProfile} /><Button type="submit">Guardar perfil</Button></form></Card>}
    <ProfileSummary title="Privacidad y consentimiento">
      <ProfileDetail label="Términos y aviso de privacidad">{consent?.termsVersion ? `Aceptados · versión ${consent.termsVersion}` : "No configurado"}</ProfileDetail>
      <ProfileDetail label="Fecha de aceptación">{consent?.acceptedAt ? formatConsentDate(consent.acceptedAt) : "No disponible"}</ProfileDetail>
      <ProfileDetail label="Uso de fotos aprobadas">{typeof consent?.photoPublication === "boolean" ? (consent.photoPublication ? "Permitido" : "No permitido") : "No configurado"}</ProfileDetail>
      <ProfileDetail label="Novedades de próximos eventos">{typeof consent?.marketing === "boolean" ? (consent.marketing ? "Sí desea recibir novedades" : "No desea recibir novedades") : "No configurado"}</ProfileDetail>
    </ProfileSummary>
    {message && <StatusNotice tone={message.startsWith("No") ? "error" : "success"}>{message}</StatusNotice>}
    <CommunityLinks />
    {canOpenAdminConsole(profile) && <Button variant="secondary" block onClick={() => navigate("/admin")}>Abrir consola del evento</Button>}
    <Button variant="secondary" block onClick={async () => { await signOut(auth); navigate("/"); }}><LogOut aria-hidden size={18} /> Cerrar sesión</Button>
    <Button variant="ghost" block onClick={remove}><Trash2 aria-hidden size={18} /> Solicitar eliminación de datos</Button>
  </section>;
}
