import { BellRing, X } from "lucide-react";
import { useEffect, useState } from "react";
import { OFFICIAL_AGENDA_URL } from "../../../shared/agenda";
import { nextAgendaReminder } from "../../../shared/companion";

type Reminder = NonNullable<ReturnType<typeof nextAgendaReminder>>;

export function AgendaReminderCenter({ now }: { now: Date }) {
  const [active, setActive] = useState<Reminder | null>(null);
  useEffect(() => {
    const reminder = nextAgendaReminder(now);
    if (!reminder) return;
    const key = `agenda-reminder:${reminder.key}`;
    try {
      if (window.sessionStorage.getItem(key) === "seen") return;
      window.sessionStorage.setItem(key, "seen");
    } catch { /* The in-app reminder still works if storage is unavailable. */ }
    setActive(reminder);
    if ("Notification" in window && window.Notification.permission === "granted") {
      try { new window.Notification(`En ${reminder.minutes} minuto${reminder.minutes === 1 ? "" : "s"} · ${reminder.start}`, { body: `${reminder.sessions.length} actividad${reminder.sessions.length === 1 ? "" : "es"} en AWS Community Day Guatemala`, tag: reminder.key }); }
      catch { /* The in-app reminder remains visible. */ }
    }
  }, [now]);
  if (!active) return null;
  return <aside className="agenda-reminder" role="status" aria-live="polite">
    <BellRing aria-hidden size={24} />
    <div><strong>En {active.minutes} minuto{active.minutes === 1 ? "" : "s"} · {active.start}</strong><span>{active.sessions.length === 1 ? active.sessions[0]?.title : `${active.sessions.length} actividades comienzan. Elige tu sala en la agenda.`}</span><a href={OFFICIAL_AGENDA_URL} target="_blank" rel="noreferrer">Ver agenda</a></div>
    <button type="button" aria-label="Cerrar aviso" onClick={() => setActive(null)}><X aria-hidden size={20} /></button>
  </aside>;
}

export function BrowserReminderButton() {
  const [permission, setPermission] = useState<NotificationPermission | "unavailable">(() => "Notification" in window ? window.Notification.permission : "unavailable");
  if (permission === "unavailable") return null;
  return <button className="agenda-browser-reminder" type="button" disabled={permission === "granted" || permission === "denied"} onClick={async () => setPermission(await window.Notification.requestPermission())}>
    <BellRing aria-hidden size={17} /> {permission === "granted" ? "Avisos del navegador activados" : permission === "denied" ? "Avisos del navegador bloqueados" : "Activar avisos del navegador"}
  </button>;
}
