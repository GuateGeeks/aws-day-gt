import { randomUUID } from "node:crypto";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const emulatorProjectId = process.env.FIRESTORE_EMULATOR_HOST
  ? `aws-day-gt-test-${randomUUID().replaceAll("-", "").slice(0, 12)}`
  : undefined;

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": "/src", "@shared": "/shared" } },
  test: {
    environment: "jsdom",
    ...(emulatorProjectId ? { env: {
      GCLOUD_PROJECT: emulatorProjectId,
      FIREBASE_CONFIG: JSON.stringify({ projectId: emulatorProjectId, storageBucket: `${emulatorProjectId}.firebasestorage.app` })
    } } : {}),
    setupFiles: ["./tests/setup.ts"],
    exclude: ["tests/e2e/**", "**/node_modules/**", "**/dist/**"]
  }
});
