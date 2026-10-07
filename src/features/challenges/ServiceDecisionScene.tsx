import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { ChallengeOption } from "../../../shared/challenges/types";
import "./service-decision.css";

type Props = { options: ChallengeOption[]; selected: string | null; onSelect: (id: string) => void };

const colors = [0x39c6e5, 0x94dc75, 0xffc35a];

export function ServiceDecisionScene({ options, selected, onSelect }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const selectedRef = useRef(selected);
  const selectRef = useRef(onSelect);
  selectedRef.current = selected;
  selectRef.current = onSelect;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof window.WebGLRenderingContext === "undefined") return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); }
    catch { return; }
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 40);
    camera.position.set(0, 2.9, 6.8);
    camera.lookAt(0, 0.55, 0);
    scene.add(new THREE.HemisphereLight(0xe6faff, 0x176077, 3));
    const keyLight = new THREE.PointLight(0xffffff, 75, 18);
    keyLight.position.set(-2, 5, 4);
    scene.add(keyLight);
    const floor = new THREE.Mesh(new THREE.CylinderGeometry(5.2, 5.4, 0.22, 48), new THREE.MeshStandardMaterial({ color: 0x0c536d, roughness: 0.8 }));
    floor.position.y = -0.2;
    scene.add(floor);
    const pickable: THREE.Object3D[] = [];
    const tokens = options.map((option, index) => {
      const group = new THREE.Group();
      group.position.set((index - (options.length - 1) / 2) * 2.15, 0.65, 0);
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.83, 0.94, 0.2, 32), new THREE.MeshStandardMaterial({ color: 0x155a74, metalness: 0.2 }));
      base.position.y = -0.55;
      group.add(base);
      const material = new THREE.MeshStandardMaterial({ color: colors[index % colors.length], emissive: colors[index % colors.length], emissiveIntensity: 0.16, metalness: 0.18, roughness: 0.27 });
      const core = new THREE.Mesh(index === 1 ? new THREE.DodecahedronGeometry(0.67) : new THREE.IcosahedronGeometry(0.67, 0), material);
      core.userData.optionId = option.id;
      group.add(core);
      pickable.push(core);
      const halo = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.045, 10, 42), new THREE.MeshStandardMaterial({ color: 0xa8eaf6, emissive: 0x288eb5, emissiveIntensity: 0.3 }));
      halo.rotation.x = Math.PI / 2;
      halo.position.y = -0.4;
      group.add(halo);
      scene.add(group);
      return { option, group, core, material };
    });
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    function chooseFromScene(event: PointerEvent) {
      const bounds = canvas!.getBoundingClientRect();
      pointer.set(((event.clientX - bounds.left) / bounds.width) * 2 - 1, -((event.clientY - bounds.top) / bounds.height) * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(pickable)[0];
      const id = hit?.object.userData.optionId;
      if (typeof id === "string") selectRef.current(id);
    }
    canvas.addEventListener("pointerup", chooseFromScene);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    function resize() {
      const width = canvas!.clientWidth, height = canvas!.clientHeight;
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    let frameId = 0;
    function frame(time: number) {
      tokens.forEach(({ option, group, core, material }, index) => {
        const active = option.id === selectedRef.current;
        core.rotation.y = time * 0.00045 + index;
        group.position.y = 0.65 + Math.sin(time * 0.0014 + index) * 0.08 + (active ? 0.18 : 0);
        material.emissiveIntensity = active ? 0.68 : 0.16;
        group.scale.setScalar(active ? 1.12 : 1);
      });
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(frame);
    }
    frameId = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(frameId);
      observer.disconnect();
      canvas.removeEventListener("pointerup", chooseFromScene);
      scene.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => material.dispose());
      });
      renderer.dispose();
    };
  }, [options]);

  return <div className="service-decision">
    <div className="service-decision__scene">
      <canvas className="service-decision__canvas" ref={canvasRef} aria-hidden="true" />
      <span className="service-decision__hint">{selected ? `Elegiste: ${options.find((option) => option.id === selected)?.label ?? selected}` : "Toca un objeto o elige su nombre"}</span>
    </div>
    <div className="service-decision__options" role="group" aria-label="Servicios AWS">
      {options.map((option, index) => <button key={option.id} type="button" className={`service-decision__option${selected === option.id ? " is-selected" : ""}`} onClick={() => onSelect(option.id)} aria-pressed={selected === option.id}>
        <span className="service-decision__symbol" style={{ background: `#${colors[index % colors.length]!.toString(16).padStart(6, "0")}` }} aria-hidden="true" />
        {option.label}
      </button>)}
    </div>
  </div>;
}
