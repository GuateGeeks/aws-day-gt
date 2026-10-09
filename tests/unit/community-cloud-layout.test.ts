import { describe, expect, it } from "vitest";
import { buildCloudLayout, positionForNode } from "../../src/features/live/community-cloud";

const nodes = [
  { id: "p_0123456789abcdef", alias: "Ada", category: "Development" as const, degree: 1 },
  { id: "p_fedcba9876543210", alias: "Nube", category: "Cloud" as const, degree: 1 }
];
const edges = [{ id: "e_0123456789abcdef", source: nodes[0]!.id, target: nodes[1]!.id }];

describe("community cloud layout", () => {
  it("keeps deterministic node positions inside the cloud radius", () => {
    const first = positionForNode(nodes[0]!.id, 5);
    expect(positionForNode(nodes[0]!.id, 5)).toEqual(first);
    expect(Math.hypot(...first)).toBeLessThanOrEqual(5);
    expect(positionForNode(nodes[1]!.id, 5)).not.toEqual(first);
  });

  it("maps only edges whose endpoints exist", () => {
    const layout = buildCloudLayout(nodes, [...edges, { id: "e_fedcba9876543210", source: nodes[0]!.id, target: "p_aaaaaaaaaaaaaaaa" }]);
    expect(layout.nodes).toHaveLength(2);
    expect(layout.edges).toHaveLength(1);
    expect(layout.edges[0]).toMatchObject({ id: edges[0]!.id });
    expect(layout.edges[0]?.points).toHaveLength(2);
  });
});
