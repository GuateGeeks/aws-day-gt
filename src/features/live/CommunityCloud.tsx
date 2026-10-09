import type { PublicVisualizationEdge, PublicVisualizationNode } from "../../../shared/public-visualization";

export function CommunityCloud({ nodes, edges }: { nodes: PublicVisualizationNode[]; edges: PublicVisualizationEdge[]; newEdgeIds?: ReadonlySet<string> }) {
  return <div className="community-cloud__placeholder" data-nodes={nodes.length} data-edges={edges.length}>
    {nodes.length ? <p>{nodes.length} personas · {edges.length} conexiones</p> : <p>La nube de la comunidad está empezando a formarse.</p>}
  </div>;
}
