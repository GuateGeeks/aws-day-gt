import type { ReactNode } from "react";
import { Card } from "../../design-system/components";
import "./profile-summary.css";

export function ProfileSummary({ title, children }: { title: string; children: ReactNode }) {
  return <Card className="stack profile-details">
    <h2>{title}</h2>
    <dl className="profile-details__list">{children}</dl>
  </Card>;
}

export function ProfileDetail({ label, children }: { label: string; children: ReactNode }) {
  return <div className="profile-details__item"><dt>{label}</dt><dd>{children}</dd></div>;
}

export function formatConsentDate(value: unknown): string {
  let date: Date | null = null;
  if (value instanceof Date) date = value;
  else if (typeof value === "string" || typeof value === "number") date = new Date(value);
  else if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") date = value.toDate();
  if (!date || Number.isNaN(date.getTime())) return "No disponible";
  return new Intl.DateTimeFormat("es-GT", { dateStyle: "long", timeZone: "America/Guatemala" }).format(date);
}
