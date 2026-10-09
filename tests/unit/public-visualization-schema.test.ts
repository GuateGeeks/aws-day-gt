import { describe, expect, it } from "vitest";
import { publicVisualizationSchema } from "../../shared/public-visualization";

describe("public visualization contract", () => {
  it("accepts a bounded sanitized event snapshot", () => {
    const parsed = publicVisualizationSchema.parse({
      generatedAt: "2026-10-10T15:00:00.000Z",
      eventId: "aws-community-day-gt-2026",
      nodes: [{ id: "p_0123456789abcdef", alias: "Quetzi", category: "Development", degree: 1 }],
      edges: [],
      photos: [],
      tracks: [],
      insights: [],
      metrics: { participants: 1, connections: 0, approvedPhotos: 0, leadingTrack: null }
    });

    expect(parsed.nodes[0]?.alias).toBe("Quetzi");
    expect(JSON.stringify(parsed)).not.toContain("userId");
  });

  it("rejects raw identifiers and oversized public arrays", () => {
    const tooManyNodes = Array.from({ length: 251 }, (_, index) => ({
      id: `p_${index.toString(16).padStart(16, "0")}`,
      alias: `Geek${index}`,
      category: "Other",
      degree: 0,
      userId: `private-${index}`
    }));

    const result = publicVisualizationSchema.safeParse({
      generatedAt: "2026-10-10T15:00:00.000Z",
      eventId: "aws-community-day-gt-2026",
      nodes: tooManyNodes,
      edges: [], photos: [], tracks: [], insights: [],
      metrics: { participants: 251, connections: 0, approvedPhotos: 0, leadingTrack: null }
    });

    expect(result.success).toBe(false);
  });
});
