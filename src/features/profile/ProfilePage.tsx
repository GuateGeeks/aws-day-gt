import { signOut } from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import { LogOut, ShieldCheck, Trash2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Card, StatusNotice } from "../../design-system/components";
import { auth } from "../../firebase/auth";
import { functions } from "../../firebase/functions";
import { useAuth } from "../auth/AuthProvider";

function maskEmail(email: string) { const [name = "", domain = ""] = email.split("@"); return `${name.slice(0, 2)}•••@${domain}`; }
export function ProfilePage() {
  const { user, profile } = useAuth(); const navigate = useNavigate(); const [message, setMessage] = useState("");
  async function remove() { if (!confirm("¿Solicitar la eliminación de tus datos? El equipo procesará la solicitud.")) return; await httpsCallable(functions, "requestDataDeletion")({}); setMessage("Solicitud registrada. Te contactaremos cuando finalice."); }
  return <section className="stack"><p className="eyebrow">Cuenta y privacidad</p><h1>Perfil</h1><Card className="stack"><div className="profile-avatar">{profile?.alias?.slice(0, 2).toUpperCase() || "AWS"}</div><h2>{profile?.alias}</h2><p className="muted">{maskEmail(user?.email ?? "")}</p><div className="cluster"><ShieldCheck aria-hidden size={18} /><span>{profile?.role === "participant" ? "Participante" : profile?.role}</span></div></Card>{message && <StatusNotice tone="success">{message}</StatusNotice>}{(profile?.role === "admin" || profile?.role === "moderator") && <Button variant="secondary" block onClick={() => navigate("/admin")}>Abrir consola del evento</Button>}<Button variant="secondary" block onClick={async () => { await signOut(auth); navigate("/"); }}><LogOut aria-hidden size={18} /> Cerrar sesión</Button><Button variant="ghost" block onClick={remove}><Trash2 aria-hidden size={18} /> Solicitar eliminación de datos</Button></section>;
}
