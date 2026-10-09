import {
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  FogExp2,
  Group,
  IcosahedronGeometry,
  InstancedMesh,
  LineBasicMaterial,
  LineSegments,
  Matrix4,
  MeshBasicMaterial,
  PerspectiveCamera,
  Scene,
  WebGLRenderer
} from "three";
import type { PublicVisualizationEdge, PublicVisualizationNode } from "../../../shared/public-visualization";

export type Point3 = readonly [number, number, number];
export interface CloudLayoutNode extends PublicVisualizationNode { position: Point3 }
export interface CloudLayoutEdge extends PublicVisualizationEdge { points: readonly [Point3, Point3] }
export interface CloudLayout { nodes: CloudLayoutNode[]; edges: CloudLayoutEdge[] }
export interface CommunityCloudSceneOptions { reducedMotion: boolean; newEdgeIds: ReadonlySet<string> }
export interface CommunityCloudScene { dispose(): void }

const roleColors: Record<PublicVisualizationNode["category"], string> = {
  Development: "#33d7d0", Cloud: "#62b5ff", Data: "#a78bfa", AI: "#f6a84a",
  Cybersecurity: "#fb7185", DevOps: "#7dd35a", Product: "#ffd166", Student: "#67e8f9", Other: "#cbd5e1"
};

function hash32(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function random(seed: number) {
  let state = seed;
  return () => {
    state += 0x6D2B79F5;
    let value = state;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}

export function positionForNode(id: string, radius = 5): Point3 {
  const next = random(hash32(id));
  const theta = next() * Math.PI * 2;
  const phi = Math.acos(2 * next() - 1);
  const distance = Math.cbrt(0.16 + next() * 0.84) * radius;
  return [
    Math.sin(phi) * Math.cos(theta) * distance,
    Math.cos(phi) * distance,
    Math.sin(phi) * Math.sin(theta) * distance
  ];
}

export function buildCloudLayout(
  nodes: PublicVisualizationNode[],
  edges: PublicVisualizationEdge[],
  radius = 5
): CloudLayout {
  const layoutNodes = nodes.map((node) => ({ ...node, position: positionForNode(node.id, radius) }));
  const positions = new Map(layoutNodes.map((node) => [node.id, node.position]));
  const layoutEdges = edges.flatMap((edge) => {
    const source = positions.get(edge.source);
    const target = positions.get(edge.target);
    return source && target ? [{ ...edge, points: [source, target] as const }] : [];
  });
  return { nodes: layoutNodes, edges: layoutEdges };
}

function edgeGeometry(edges: CloudLayoutEdge[]) {
  const points = edges.flatMap((edge) => [...edge.points[0], ...edge.points[1]]);
  return new BufferGeometry().setAttribute("position", new Float32BufferAttribute(points, 3));
}

export function createNodeMaterial() {
  return new MeshBasicMaterial({ color: 0xffffff });
}

export function createCommunityCloudScene(
  container: HTMLDivElement,
  nodes: PublicVisualizationNode[],
  edges: PublicVisualizationEdge[],
  options: CommunityCloudSceneOptions
): CommunityCloudScene {
  const layout = buildCloudLayout(nodes, edges);
  const width = Math.max(container.clientWidth, 640);
  const height = Math.max(container.clientHeight, 480);
  const renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio || 1, 2));
  renderer.setSize(width, height, false);
  renderer.domElement.setAttribute("aria-hidden", "true");
  renderer.domElement.className = "community-cloud__canvas";
  container.append(renderer.domElement);

  const scene = new Scene();
  scene.fog = new FogExp2(0x061520, 0.045);
  const camera = new PerspectiveCamera(45, width / height, 0.1, 100);
  camera.position.set(0, 0, 14);
  const group = new Group();
  scene.add(group);

  const nodeGeometry = new IcosahedronGeometry(0.18, 2);
  const nodeMaterial = createNodeMaterial();
  const nodeMesh = new InstancedMesh(nodeGeometry, nodeMaterial, layout.nodes.length);
  const matrix = new Matrix4();
  layout.nodes.forEach((node, index) => {
    const scale = 0.8 + Math.min(node.degree, 10) * 0.09;
    matrix.makeScale(scale, scale, scale);
    matrix.setPosition(...node.position);
    nodeMesh.setMatrixAt(index, matrix);
    nodeMesh.setColorAt(index, new Color(roleColors[node.category]));
  });
  nodeMesh.instanceMatrix.needsUpdate = true;
  if (nodeMesh.instanceColor) nodeMesh.instanceColor.needsUpdate = true;
  group.add(nodeMesh);

  const baseEdges = layout.edges.filter((edge) => !options.newEdgeIds.has(edge.id));
  const freshEdges = layout.edges.filter((edge) => options.newEdgeIds.has(edge.id));
  const lineGeometry = edgeGeometry(baseEdges);
  const lineMaterial = new LineBasicMaterial({ color: 0x5bbec7, transparent: true, opacity: 0.34 });
  const lines = new LineSegments(lineGeometry, lineMaterial);
  group.add(lines);

  const pulseGeometry = edgeGeometry(freshEdges);
  const pulseMaterial = new LineBasicMaterial({ color: 0xf6a84a, transparent: true, opacity: 0.9 });
  const pulses = new LineSegments(pulseGeometry, pulseMaterial);
  group.add(pulses);

  let frame = 0;
  let disposed = false;
  const render = (time: number) => {
    if (disposed) return;
    if (!options.reducedMotion) {
      group.rotation.y = time * 0.000045;
      group.rotation.x = Math.sin(time * 0.00012) * 0.06;
      pulseMaterial.opacity = 0.5 + Math.sin(time * 0.005) * 0.35;
    }
    renderer.render(scene, camera);
    if (!options.reducedMotion) frame = globalThis.requestAnimationFrame(render);
  };
  render(0);

  const resize = () => {
    const nextWidth = Math.max(container.clientWidth, 1);
    const nextHeight = Math.max(container.clientHeight, 1);
    camera.aspect = nextWidth / nextHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(nextWidth, nextHeight, false);
  };
  const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(resize);
  observer?.observe(container);
  if (!observer) globalThis.addEventListener("resize", resize);

  return { dispose() {
    disposed = true;
    if (frame) globalThis.cancelAnimationFrame(frame);
    observer?.disconnect();
    if (!observer) globalThis.removeEventListener("resize", resize);
    nodeGeometry.dispose(); nodeMaterial.dispose();
    lineGeometry.dispose(); lineMaterial.dispose();
    pulseGeometry.dispose(); pulseMaterial.dispose();
    renderer.dispose();
    renderer.domElement.remove();
  } };
}

export { roleColors };
