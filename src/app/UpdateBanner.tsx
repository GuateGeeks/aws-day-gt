import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { Button } from "../design-system/components";
import { QuetziSprite } from "../features/companion/QuetziSprite";

type Props = { onUpdate: () => Promise<void> | void; onDismiss: () => void };

export function UpdateBanner({ onUpdate, onDismiss }: Props) {
  const [updating, setUpdating] = useState(false);
  async function update() {
    setUpdating(true);
    try { await onUpdate(); } catch { setUpdating(false); }
  }
  return <div className="update-banner" role="alertdialog" aria-labelledby="update-title" aria-describedby="update-desc">
    <QuetziSprite completed={11} mood="happy" crop="head" label="" />
    <div className="grow">
      <strong id="update-title">¡Quetzi tiene plumas nuevas!</strong>
      <p id="update-desc" className="muted">Hay una nueva versión de la app. Actualiza para ver los últimos cambios.</p>
    </div>
    <div className="update-banner__actions">
      <Button variant="accent" onClick={update} loading={updating}><RefreshCw aria-hidden size={18} /> Actualizar</Button>
      <Button variant="ghost" onClick={onDismiss} disabled={updating}>Luego</Button>
    </div>
  </div>;
}
