import { createHash } from "node:crypto";

export type EventCodes = { C13: string };

export function eventCodeUpdates(codes: EventCodes) {
  return (["C13"] as const).map((challengeId) => {
    const code = codes[challengeId].trim().toUpperCase();
    if (code.length < 4 || code.length > 30) throw new Error(`EVENT_CODE_REQUIRED:${challengeId}`);
    return {
      path: `challengeSecrets/${challengeId}`,
      data: { challengeId, sharedCodeHash: createHash("sha256").update(code).digest("hex"), sharedCodeActive: true }
    };
  });
}

export function eventCodeCommitWrites(projectId: string, codes: EventCodes) {
  return eventCodeUpdates(codes).map(({ path, data }) => ({
    update: {
      name: `projects/${projectId}/databases/(default)/documents/${path}`,
      fields: {
        challengeId: { stringValue: data.challengeId },
        sharedCodeHash: { stringValue: data.sharedCodeHash },
        sharedCodeActive: { booleanValue: data.sharedCodeActive }
      }
    },
    updateMask: { fieldPaths: ["challengeId", "sharedCodeHash", "sharedCodeActive"] }
  }));
}
