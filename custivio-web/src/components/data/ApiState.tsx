import { AlertCircle, Loader2, RefreshCw, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel } from "./Panel";

export function LoadingPanel({ label = "Loading data..." }: { label?: string }) {
  return (
    <Panel>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        {label}
      </div>
    </Panel>
  );
}

export function ApiErrorPanel({
  title = "Could not load data",
  error,
  onRetry,
}: {
  title?: string;
  error: unknown;
  onRetry?: () => void;
}) {
  const message = error instanceof Error ? error.message : "The backend request failed.";

  return (
    <Panel>
      <div className="flex flex-col gap-3 text-sm">
        <div className="flex items-start gap-2">
          <AlertCircle className="mt-0.5 size-4 text-[var(--destructive)]" />
          <div>
            <div className="font-medium text-foreground">{title}</div>
            <p className="text-muted-foreground">{message}</p>
          </div>
        </div>
        {onRetry && (
          <Button size="sm" variant="outline" className="w-fit" onClick={onRetry}>
            <RefreshCw className="size-4" />
            Retry
          </Button>
        )}
      </div>
    </Panel>
  );
}

export function AccessDeniedPanel({
  title = "Access denied",
  description = "Your current role does not include access to this workspace.",
  required,
}: {
  title?: string;
  description?: string;
  required?: string;
}) {
  return (
    <Panel>
      <div className="flex flex-col gap-2 text-sm">
        <div className="flex items-start gap-2">
          <ShieldAlert className="mt-0.5 size-4 text-[var(--warning)]" />
          <div>
            <div className="font-medium text-foreground">{title}</div>
            <p className="text-muted-foreground">{description}</p>
          </div>
        </div>
        {required && (
          <p className="rounded-md border border-border bg-surface-2 px-3 py-2 font-mono text-xs text-muted-foreground">
            Required: {required}
          </p>
        )}
      </div>
    </Panel>
  );
}
