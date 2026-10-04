import { EVENT_ID, INITIAL_ADMIN_EMAIL, TERMS_VERSION } from "../../shared/constants";
import type { EventConfig } from "../../shared/types";

export const event = {
  id: EVENT_ID,
  name: "AWS Community Day Guatemala 2026",
  date: "2026-10-10",
  timezone: "America/Guatemala",
  venue: "Universidad Rafael Landívar, Campus Central",
  status: "published",
  updatedAt: new Date().toISOString()
};

export const eventConfig: EventConfig = {
  eventId: EVENT_ID,
  registrationOpen: true,
  missionsEnabled: true,
  leaderboardEnabled: true,
  uploadsEnabled: true,
  photoMissionsEnabled: true,
  maintenanceMode: false,
  maxPhotoSize: 1_572_864,
  maxReplacements: 2,
  eventMode: "PRE_EVENT",
  legal: {
    termsVersion: TERMS_VERSION,
    terms: "Al participar aceptas completar misiones de forma respetuosa y seguir el código de conducta del evento.",
    privacy: "Usamos tu correo para autenticarte y tu alias para mostrar tu progreso. No publicamos tu correo.",
    retention: "Los datos de participación se conservarán solo durante el periodo operativo y de análisis del evento."
  },
  initialAdminEmails: [INITIAL_ADMIN_EMAIL]
};
