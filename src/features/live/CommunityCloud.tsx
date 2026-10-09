import { useEffect, useMemo, useRef, useState } from "react";
import type { PublicVisualizationEdge, PublicVisualizationNode } from "../../../shared/public-visualization";
import { buildCloudLayout, createCommunityCloudScene, roleColors, type CommunityCloudScene, type CommunityCloudSceneOptions } from "./community-cloud";

export type CommunityCloudSceneFactory = (
  container: HTMLDivElement,
  nodes: PublicVisualizationNode[],
  edges: PublicVisualizationEdge[],
  options: CommunityCloudSceneOptions
) => CommunityCloudScene;

const EMPTY_EDGES = new Set<string>();

function useReducedMotion() {
  const [reduced, setReduced] = useState(() => globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false);
  useEffect(() => {
    const media = globalThis.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!media) return;
    const update = () => setReduced(media.matches);
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, []);
  return reduced;
}

function StaticConstellation({ nodes, edges }: { nodes: PublicVisualizationNode[]; edges: PublicVisualizationEdge[] }) {
  const layout = buildCloudLayout(nodes, edges);
  const point = (position: readonly number[]) => ({ x: 50 + position[0]! * 8, y: 50 - position[1]! * 8 });
  return <svg className="community-cloud__fallback" viewBox="0 0 100 100" role="img" aria-label="Representación alternativa de la red de conexiones">
    {layout.edges.map((edge) => { const source = point(edge.points[0]); const target = point(edge.points[1]); return <line key={edge.id} x1={source.x} y1={source.y} x2={target.x} y2={target.y} />; })}
    {layout.nodes.map((node) => { const position = point(node.position); return <g key={node.id} transform={`translate(${position.x} ${position.y})`}><circle r={1.5 + Math.min(node.degree, 8) * .18} fill={roleColors[node.category]} /><text y="4">{node.alias}</text></g>; })}
  </svg>;
}

export function CommunityCloud({
  nodes,
  edges,
  newEdgeIds = EMPTY_EDGES,
  sceneFactory = createCommunityCloudScene
}: {
  nodes: PublicVisualizationNode[];
  edges: PublicVisualizationEdge[];
  newEdgeIds?: ReadonlySet<string>;
  sceneFactory?: CommunityCloudSceneFactory;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [fallback, setFallback] = useState(false);
  const reducedMotion = useReducedMotion();
  const labels = useMemo(() => [...nodes].sort((a, b) => b.degree - a.degree || a.alias.localeCompare(b.alias)).slice(0, 7), [nodes]);
  const categories = useMemo(() => [...new Set(nodes.map((node) => node.category))], [nodes]);

  useEffect(() => {
    if (!hostRef.current || !nodes.length) return;
    setFallback(false);
    try {
      const scene = sceneFactory(hostRef.current, nodes, edges, { reducedMotion, newEdgeIds });
      return () => scene.dispose();
    } catch {
      setFallback(true);
    }
  }, [edges, newEdgeIds, nodes, reducedMotion, sceneFactory]);

  const connectionLabel = `${nodes.length} ${nodes.length === 1 ? "persona" : "personas"} y ${edges.length} ${edges.length === 1 ? "conexión QR" : "conexiones QR"}`;
  if (!nodes.length) return <div className="community-cloud community-cloud--empty"><p>La nube de la comunidad está empezando a formarse.</p></div>;

  return <div className="community-cloud">
    <p className="sr-only">{connectionLabel}. Los nodos más conectados son {labels.map((node) => node.alias).join(", ")}.</p>
    <div className="community-cloud__viewport" ref={hostRef}>{fallback ? <StaticConstellation nodes={nodes} edges={edges} /> : null}</div>
    {!fallback ? <div className="community-cloud__labels" aria-hidden>{labels.map((node, index) => <span key={node.id} style={{ left: `${18 + (index * 13) % 68}%`, top: `${19 + (index * 21) % 63}%` }}>{node.alias}<small>{node.degree} conexiones</small></span>)}</div> : null}
    <div className="community-cloud__legend" aria-label="Categorías de participantes">{categories.map((category) => <span key={category}><i style={{ background: roleColors[category] }} />{category}</span>)}</div>
  </div>;
}
