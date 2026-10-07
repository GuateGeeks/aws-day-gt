import { describe, expect, it } from "vitest";
import { challenges } from "../../shared/challenges/catalog";
import { selectChallengePack } from "../../shared/challenges/assignment";

describe("initial Aura Challenge bank", () => {
  it("retains Cloud Trio as an inactive historical Challenge", () => {
    expect(challenges.find((challenge) => challenge.id === "C03")).toMatchObject({ id: "C03", active: false, auraReward: 200 });
  });

  it("never selects Cloud Trio for a new ten-Challenge pack", () => {
    for (const seed of ["participant-one", "participant-two", "participant-three"]) {
      const staleCatalog = challenges.map((challenge) => challenge.id === "C03" ? { ...challenge, active: true } : challenge);
      const pack = selectChallengePack(staleCatalog, seed);
      expect(pack).toHaveLength(10);
      expect(pack.map((challenge) => challenge.id)).not.toContain("C03");
    }
  });
  it("keeps fifteen assigned candidates and adds selfies and six AWS extras", () => {
    expect(challenges).toHaveLength(23);
    expect(new Set(challenges.map((challenge) => challenge.id)).size).toBe(23);
    expect(challenges.slice(17).every((challenge) => challenge.auraReward === 150)).toBe(true);
    expect(challenges.find((challenge) => challenge.id === "C16")).toMatchObject({ validationType: "community_photo", category: "COMMUNITY" });
    expect(challenges.find((challenge) => challenge.id === "C17")).toMatchObject({ validationType: "community_photo", category: "COMMUNITY" });
  });

  it("marks the immersive experience and the simple architecture challenge as required", () => {
    expect(challenges.find((challenge) => challenge.id === "C13")).toMatchObject({
      title: "Experiencia VR GuateGeeks", category: "EXPERIENCE", required: true, auraReward: 250
    });
    expect(challenges.filter((challenge) => challenge.required).map((challenge) => challenge.id)).toEqual(["C08", "C13"]);
    expect(challenges.find((challenge) => challenge.id === "C08")?.configuration.options?.map((option) => option.id)).toEqual(["sqs", "lambda", "dynamo"]);
    expect(challenges.some((challenge) => /hidden|secret|escondid/i.test(challenge.title))).toBe(false);
  });

  it("offers every thematic area published in the event agenda", () => {
    expect(challenges.find((challenge) => challenge.id === "C12")?.configuration.tracks?.map((track) => track.label)).toEqual([
      "IA & Agentes", "Datos & Analítica", "Arquitectura & Serverless", "Seguridad",
      "DevOps & Operaciones", "Carrera & Comunidad", "FinOps - Operaciones"
    ]);
  });
});
