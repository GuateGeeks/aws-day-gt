import { getBlob, ref } from "firebase/storage";
import { useEffect, useState } from "react";
import { Button, StatusNotice } from "../../design-system/components";
import { storage } from "../../firebase/storage";

type PrivateEvidenceImageProps = {
  storagePath?: string;
  missionId: string;
  onReadyChange?: (ready: boolean) => void;
};

type ImageState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; objectUrl: string };

export function PrivateEvidenceImage({ storagePath, missionId, onReadyChange }: PrivateEvidenceImageProps) {
  const [attempt, setAttempt] = useState(0);
  const [image, setImage] = useState<ImageState>({ status: "loading" });

  useEffect(() => {
    let active = true;
    let objectUrl: string | undefined;
    setImage({ status: "loading" });
    onReadyChange?.(false);

    if (!storagePath) {
      setImage({ status: "error" });
      return () => { active = false; };
    }

    void getBlob(ref(storage, storagePath)).then((blob) => {
      if (!active) return;
      objectUrl = URL.createObjectURL(blob);
      setImage({ status: "ready", objectUrl });
      onReadyChange?.(true);
    }).catch(() => {
      if (active) setImage({ status: "error" });
    });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [attempt, onReadyChange, storagePath]);

  if (image.status === "loading") {
    return <div className="moderation-photo moderation-photo__loading" role="status">Cargando fotografía…</div>;
  }

  if (image.status === "error") {
    return <StatusNotice tone="error"><span>No pudimos cargar esta fotografía.</span><Button type="button" variant="secondary" onClick={() => setAttempt((value) => value + 1)}>Reintentar</Button></StatusNotice>;
  }

  return <div className="moderation-photo"><img className="moderation-photo__image" src={image.objectUrl} alt={`Evidencia fotográfica de la misión ${missionId}`} /></div>;
}
