// @vitest-environment node
import { spawnSync } from "node:child_process";
import { initializeApp, deleteApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { describe, expect, it } from "vitest";
import { challenges } from "../../shared/challenges/catalog";
import { EVENT_ID } from "../../shared/constants";

describe.skipIf(!process.env.FIRESTORE_EMULATOR_HOST)("local Cloud Trio retirement command", () => {
  it("previews without writing, requires confirmation, and retires C03 only in the emulator", async () => {
    const projectId = `retire-test-${crypto.randomUUID().replaceAll("-", "").slice(0, 12)}`;
    const app = initializeApp({ projectId }, projectId);
    const db = getFirestore(app);
    const ref = db.doc("challenges/C03");
    const c03 = challenges.find((item) => item.id === "C03")!;
    const command = (args: string[]) => spawnSync("./node_modules/.bin/tsx", ["scripts/retire-cloud-trio-emulator.ts", "--project", projectId, ...args], {
      cwd: process.cwd(), encoding: "utf8", env: { ...process.env, FIRESTORE_EMULATOR_HOST: process.env.FIRESTORE_EMULATOR_HOST }
    });
    try {
      await ref.set({ ...c03, active: true });
      const preview = command([]);
      expect(preview.status).toBe(0);
      expect(preview.stdout).toContain("DRY RUN");
      expect((await ref.get()).data()?.active).toBe(true);
      const unconfirmed = command(["--apply"]);
      expect(unconfirmed.status).not.toBe(0);
      expect(unconfirmed.stderr).toContain("Apply requires --confirm");
      expect((await ref.get()).data()?.active).toBe(true);
      const applied = command(["--apply", "--confirm", EVENT_ID]);
      expect(applied.status).toBe(0);
      expect(applied.stdout).toContain("APPLIED");
      expect((await ref.get()).data()?.active).toBe(false);
      expect(command(["--apply", "--confirm", EVENT_ID]).stdout).toContain("already inactive");
    } finally {
      await deleteApp(app);
    }
  }, 30_000);
});
