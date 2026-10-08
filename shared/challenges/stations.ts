import { EVENT_ID } from "../constants";

export interface ExperienceStation {
  id: string;
  eventId: string;
  name: string;
  challengeId: "C13" | "C14";
  completionMethod: "staff_verified_token";
  active: boolean;
}

export const experienceStations: ExperienceStation[] = [
  { id: "cloudforge", eventId: EVENT_ID, name: "Experiencia VR GuateGeeks", challengeId: "C13", completionMethod: "staff_verified_token", active: true },
  { id: "vr-explorer", eventId: EVENT_ID, name: "GuateGeeks VR Explorer", challengeId: "C14", completionMethod: "staff_verified_token", active: false }
];
