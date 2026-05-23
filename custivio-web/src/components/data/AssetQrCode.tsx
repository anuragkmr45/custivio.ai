import { useEffect, useState } from "react";
import { QrCode } from "lucide-react";
import { createQrDataUrl } from "@/lib/qr";

export function AssetQrCode({ payload, label }: { payload: string; label: string }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setDataUrl(null);
    setError(null);

    createQrDataUrl(payload)
      .then((url) => {
        if (!cancelled) setDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setError("QR code could not be rendered.");
      });

    return () => {
      cancelled = true;
    };
  }, [payload]);

  if (error) {
    return (
      <div className="flex aspect-square min-h-44 items-center justify-center rounded-md border border-border bg-surface-2 text-sm text-muted-foreground">
        {error}
      </div>
    );
  }

  if (!dataUrl) {
    return (
      <div className="flex aspect-square min-h-44 items-center justify-center rounded-md border border-border bg-surface-2 text-muted-foreground">
        <QrCode className="size-8" aria-hidden="true" />
        <span className="sr-only">Rendering QR code</span>
      </div>
    );
  }

  return (
    <img
      src={dataUrl}
      alt={`${label} QR code`}
      className="aspect-square w-full max-w-56 rounded-md border border-border bg-white p-3"
    />
  );
}
