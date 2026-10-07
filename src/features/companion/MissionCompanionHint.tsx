import { OFFICIAL_AGENDA_URL, ROOMS } from "../../../shared/agenda";
import { findSessionForMission } from "../../../shared/companion";
import type { Mission } from "../../../shared/types";
import { QuetziSprite } from "./QuetziSprite";
import "./companion.css";

const TIPS: Record<Mission["evidenceType"], string> = {
  photo: "Busca buena luz y evita mostrar rostros o datos personales sin permiso.",
  comment: "Responde mientras la charla está fresca. ¡Tu primera idea suele ser la mejor!",
  word: "Responde mientras la charla está fresca. ¡Tu primera idea suele ser la mejor!"
};

/** Quetzi explains where and when a mission happens. */
export function MissionCompanionHint({ mission }: { mission: Mission }) {
  const session = findSessionForMission(mission);
  const room = session ? ROOMS[session.room] : undefined;
  return <div className="mission-hint">
    <QuetziSprite completed={11} crop="head" label="Geek" className="mission-hint__bird" />
    <p>
      {session && room
        ? <>Esta misión es de <strong>«{session.title}»</strong> en {room.name} ({room.building}) a las {session.start}. </>
        : null}
      {TIPS[mission.evidenceType]}
      {session && <> <a href={OFFICIAL_AGENDA_URL} target="_blank" rel="noreferrer">Confirma horario y sala en la agenda oficial ↗</a></>}
    </p>
  </div>;
}
