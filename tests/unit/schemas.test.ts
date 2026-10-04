import { describe, expect, it } from "vitest";
import { missionSchema, onboardingInputSchema } from "../../shared/schemas";

describe("domain schemas", () => {
  it("accepts a valid mission and rejects mismatched points", () => {
    const mission = {
      id: "M45",
      eventId: "aws-community-day-gt-2026",
      title: "AWS Day en una palabra",
      description: "Resume el evento.",
      instructions: "Escribe una palabra.",
      evidenceType: "word",
      points: 5,
      category: "Evento",
      validation: { evidenceType: "word", minLength: 2, maxLength: 30 },
      tags: ["general", "closing"],
      active: true
    };
    expect(missionSchema.parse(mission).id).toBe("M45");
    expect(() => missionSchema.parse({ ...mission, points: 15 })).toThrow();
  });

  it("requires terms acceptance during onboarding", () => {
    const result = onboardingInputSchema.safeParse({
      alias: "cloudquetzal",
      interests: [],
      consent: { termsVersion: "provisional-2026-10-04", accepted: false, photoPublication: false, marketing: false }
    });
    expect(result.success).toBe(false);
  });
});
