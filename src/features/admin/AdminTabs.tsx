import { Image, Settings2, ShieldCheck } from "lucide-react";

export type AdminSection = "images" | "privacy" | "configuration";

const sections = [
  { id: "images" as const, label: "Imágenes", icon: Image },
  { id: "privacy" as const, label: "Privacidad", icon: ShieldCheck },
  { id: "configuration" as const, label: "Configuración", icon: Settings2 }
];

export function AdminTabs({ active, onChange, imageCount, deletionCount }: { active: AdminSection; onChange: (section: AdminSection) => void; imageCount: number; deletionCount: number }) {
  return <div className="admin-tabs" role="tablist" aria-label="Secciones administrativas">
    {sections.map(({ id, label, icon: Icon }) => {
      const count = id === "images" ? imageCount : id === "privacy" ? deletionCount : null;
      return <button key={id} type="button" role="tab" aria-selected={active === id} onClick={() => onChange(id)}><Icon aria-hidden size={20} /><span>{label}</span>{count !== null && <strong>{count}</strong>}</button>;
    })}
  </div>;
}
