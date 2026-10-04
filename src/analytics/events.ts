import { logEvent } from "firebase/analytics";
import { getBrowserAnalytics } from "../firebase/analytics";

const allowed = new Set(["mission_id", "evidence_type", "status", "screen"]);
export async function track(name: "login_link_sent" | "onboarding_completed" | "mission_opened" | "submission_completed", parameters: Record<string, string> = {}) {
  const safe = Object.fromEntries(Object.entries(parameters).filter(([key]) => allowed.has(key)));
  const analytics = await getBrowserAnalytics(); if (analytics) logEvent(analytics, name, safe);
}
