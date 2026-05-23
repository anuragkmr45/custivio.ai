import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatTechnicalId } from "@/lib/asset-display";
import { cn } from "@/lib/utils";

export function CopyableId({
  value,
  label = "ID",
  className,
}: {
  value: string | null | undefined;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  if (!value) {
    return <span className="text-muted-foreground">Not set</span>;
  }

  async function copyValue() {
    if (!value) return;

    await copyText(value);
    setCopied(true);
    toast.success(`${label} copied`);
    window.setTimeout(() => setCopied(false), 1_200);
  }

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            title={`${label}: ${value}`}
            onClick={() => void copyValue()}
            className={cn(
              "inline-flex max-w-full items-center gap-1 rounded border border-border bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground transition-colors hover:border-accent/60 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring",
              className,
            )}
          >
            <span className="truncate">{formatTechnicalId(value)}</span>
            {copied ? (
              <Check className="size-3 text-[var(--success)]" />
            ) : (
              <Copy className="size-3" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-sm break-all">
          <span className="font-mono">{value}</span>
          <span className="ml-2 text-primary-foreground/75">Click to copy</span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

async function copyText(value: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.append(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}
