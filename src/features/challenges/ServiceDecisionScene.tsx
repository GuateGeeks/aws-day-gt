import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { ChallengeOption } from "../../../shared/challenges/types";
import { AwsServiceIcon, serviceIconSrc } from "./awsServiceIcons";
import "./service-decision.css";

type Props = { options: readonly ChallengeOption[]; selected: string | null; onSelect: (id: string) => void; disabled?: boolean };

const iconColors: Record<string, number> = {
  "api-gateway": 0x8c4fff, bedrock: 0x01a88d, cloudfront: 0x8c4fff,
  cloudwatch: 0xe7157b, dynamodb: 0xc925d1, ebs: 0x7aa116,
  ec2: 0xed7100, eventbridge: 0xe7157b, iam: 0xdd344c,
  lambda: 0xed7100, rds: 0xc925d1, route53: 0x8c4fff,
  s3: 0x7aa116, sns: 0xe7157b, sqs: 0xe7157b,
  "step-functions": 0xe7157b
};

export function ServiceDecisionScene({ options, selected, onSelect, disabled = false }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const selectedRef = useRef(selected);
  const selectRef = useRef(onSelect);
  const disabledRef = useRef(disabled);
  selectedRef.current = selected;
  selectRef.current = onSelect;
  disabledRef.current = disabled;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof window.WebGLRenderingContext === "undefined") return;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); }
    catch { return; }
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 40);
    camera.position.set(0, 0.3, 7);
    camera.lookAt(0, 0, 0);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x286078, 2.4));
    const keyLight = new THREE.PointLight(0xffffff, 32, 14);
    keyLight.position.set(-3, 3, 5);
    scene.add(keyLight);
    const pickable: THREE.Mesh[] = [];
    const textures: THREE.Texture[] = [];
    const textureLoader = new THREE.TextureLoader();
    const icons = options.map((option, index) => {
      const group = new THREE.Group();
      group.position.set((index - (options.length - 1) / 2) * 2.45, 0, 0);
      const iconSrc = serviceIconSrc(option.id);
      const sideColor = new THREE.Color(iconColors[option.id] ?? 0x236c83).multiplyScalar(0.55);
      const side = new THREE.MeshStandardMaterial({ color: sideColor, metalness: 0.3, roughness: 0.38 });
      const face = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.38 });
      if (iconSrc) {
        const texture = textureLoader.load(iconSrc);
        texture.colorSpace = THREE.SRGBColorSpace;
        textures.push(texture);
        face.map = texture;
      }
      const badge = new THREE.Mesh(new THREE.BoxGeometry(1.95, 1.95, 0.4), [side, side, side, side, face, side]);
      badge.userData.optionId = option.id;
      group.add(badge);
      pickable.push(badge);
      scene.add(group);
      return { option, group, badge };
    });
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    function chooseFromScene(event: PointerEvent) {
      if (disabledRef.current) return;
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
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    function frame(time: number) {
      icons.forEach(({ option, group, badge }, index) => {
        const active = option.id === selectedRef.current;
        badge.rotation.y = (index % 2 === 0 ? -0.3 : 0.3) + (reduceMotion ? 0 : Math.sin(time * 0.0009 + index) * 0.07);
        badge.rotation.x = -0.1 + (reduceMotion ? 0 : Math.sin(time * 0.0007 + index * 1.4) * 0.04);
        group.position.y = (reduceMotion ? 0 : Math.sin(time * 0.0012 + index) * 0.07) + (active ? 0.15 : 0);
        group.scale.setScalar(active ? 1.14 : 1);
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
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          new Set(materials).forEach((material) => material.dispose());
        }
      });
      textures.forEach((texture) => texture.dispose());
      renderer.dispose();
    };
  }, [options]);

  return <div className="service-decision">
    <div className={`service-decision__scene${disabled ? " is-disabled" : ""}`}>
      <canvas className="service-decision__canvas" ref={canvasRef} aria-hidden="true" />
      <span className="service-decision__hint">{selected ? `Elegiste: ${options.find((option) => option.id === selected)?.label ?? selected}` : "Toca un ícono o elige su nombre"}</span>
    </div>
    <div className="service-decision__options" role="group" aria-label="Servicios AWS">
      {options.map((option) => <button key={option.id} type="button" className={`service-decision__option${selected === option.id ? " is-selected" : ""}`} onClick={() => onSelect(option.id)} aria-pressed={selected === option.id} disabled={disabled}>
        <AwsServiceIcon id={option.id} />
        {option.label}
      </button>)}
    </div>
  </div>;
}
