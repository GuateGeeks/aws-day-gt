import { useEffect, useRef } from "react";
import * as THREE from "three";
import { serviceIconSrc } from "./awsServiceIcons";

type Props = { selected: string | null };

export function ArchitectureScene({ selected }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const selectedRef = useRef(selected);
  selectedRef.current = selected;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof window.WebGLRenderingContext === "undefined") return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); }
    catch { return; }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 60);
    camera.position.set(0, 4.6, 9.3);
    camera.lookAt(0, 0.7, 0);
    scene.add(new THREE.HemisphereLight(0xd8f7ff, 0x102b3a, 2.9));
    const light = new THREE.PointLight(0x62d0ee, 100, 20);
    light.position.set(-3, 5, 3);
    scene.add(light);

    const floor = new THREE.Mesh(new THREE.BoxGeometry(14, 0.2, 9), new THREE.MeshStandardMaterial({ color: 0x10344a, roughness: 0.8 }));
    floor.position.y = -0.2;
    scene.add(floor);
    const grid = new THREE.GridHelper(14, 14, 0x4da8c2, 0x285a70);
    grid.position.y = -0.08;
    scene.add(grid);

    const nodes = new Map<string, THREE.Group>();
    const textures: THREE.Texture[] = [];
    const textureLoader = new THREE.TextureLoader();
    for (const item of [
      { id: "sqs", x: -3.1, color: 0x9a9c9e },
      { id: "lambda", x: 0, color: 0x0e89af },
      { id: "dynamo", x: 3.1, color: 0x67cce6 }
    ]) {
      const group = new THREE.Group();
      group.position.set(item.x, 0.8, 0);
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1, 0.22, 32), new THREE.MeshStandardMaterial({ color: 0x16536b, metalness: 0.25 }));
      base.position.y = -0.65;
      group.add(base);
      const cube = new THREE.Mesh(new THREE.BoxGeometry(1.22, 1.22, 1.22), new THREE.MeshStandardMaterial({ color: item.color, emissive: item.color, emissiveIntensity: 0.14, metalness: 0.3, roughness: 0.32 }));
      cube.rotation.y = 0.35;
      group.add(cube);
      const iconSrc = serviceIconSrc(item.id);
      if (iconSrc) {
        const texture = textureLoader.load(iconSrc);
        texture.colorSpace = THREE.SRGBColorSpace;
        textures.push(texture);
        const icon = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }));
        icon.position.set(0, 0.12, 0.78);
        icon.scale.set(0.9, 0.9, 1);
        group.add(icon);
      }
      group.userData.cube = cube;
      scene.add(group);
      nodes.set(item.id, group);
    }
    for (const [a, b] of [[-2.2, -0.9], [0.9, 2.2]]) {
      scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(a, 0.8, 0), new THREE.Vector3(b, 0.8, 0)]), new THREE.LineBasicMaterial({ color: 0xbfeef8 })));
    }

    const orb = new THREE.Group();
    orb.position.set(0, 0.65, 3);
    orb.visible = false;
    orb.add(new THREE.Mesh(new THREE.SphereGeometry(0.52, 24, 20), new THREE.MeshStandardMaterial({ color: 0x0e89af, emissive: 0x0a5f7d, emissiveIntensity: 0.3, metalness: 0.5, roughness: 0.2 })));
    for (const [index, color] of [0xffffff, 0x9a9c9e, 0x43c8e8].entries()) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.53, 0.05, 10, 40), new THREE.MeshStandardMaterial({ color }));
      ring.rotation.set(index * 0.7, index * 0.6, index * 0.7);
      orb.add(ring);
    }
    scene.add(orb);

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    let frameId = 0;
    function resize() {
      const width = canvas!.clientWidth;
      const height = canvas!.clientHeight;
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    function frame(time: number) {
      const target = nodes.get(selectedRef.current ?? "");
      orb.visible = !!target;
      if (target) orb.position.lerp(new THREE.Vector3(target.position.x, 0.45, 1.25), 0.1);
      else orb.position.set(0, 0.65, 3);
      orb.rotation.y = time * 0.0005;
      for (const [id, group] of nodes) {
        const cube = group.userData.cube as THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial>;
        cube.material.emissiveIntensity = id === selectedRef.current ? 0.55 : 0.14;
      }
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(frame);
    }
    frameId = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(frameId);
      observer.disconnect();
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => material.dispose());
        } else if (object instanceof THREE.Sprite) object.material.dispose();
      });
      textures.forEach((texture) => texture.dispose());
      renderer.dispose();
    };
  }, []);

  return <canvas className="architecture__canvas" ref={canvasRef} aria-hidden="true" />;
}
