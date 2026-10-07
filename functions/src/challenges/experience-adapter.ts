import { HttpsError } from "firebase-functions/v2/https";
import { issueStationTokenForStaff } from "./tokens";

export interface ExperienceCompletionAdapter {
  verify(input: { participantUid: string; stationId: "cloudforge" | "vr-explorer"; providerProof: string }): Promise<boolean>;
}

// Connect a trusted VR or station service here after its credentials and completion signal are available.
// No participant callable accepts providerProof directly.
export async function issueVerifiedExperienceToken(
  adapter: ExperienceCompletionAdapter | null,
  issuerId: string,
  input: { participantUid: string; stationId: "cloudforge" | "vr-explorer"; providerProof: string }
) {
  if (!adapter) throw new HttpsError("failed-precondition", "EXPERIENCE_ADAPTER_NOT_CONFIGURED");
  if (!await adapter.verify(input)) throw new HttpsError("permission-denied", "INVALID_EXPERIENCE_PROOF");
  return issueStationTokenForStaff(`adapter:${issuerId}`, input.stationId, input.participantUid);
}
