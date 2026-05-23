import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badge = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium whitespace-nowrap",
  {
    variants: {
      tone: {
        neutral: "bg-muted text-muted-foreground border-border",
        info: "bg-[color-mix(in_oklab,var(--info)_12%,transparent)] text-[var(--info)] border-[color-mix(in_oklab,var(--info)_28%,transparent)]",
        success:
          "bg-[color-mix(in_oklab,var(--success)_12%,transparent)] text-[var(--success)] border-[color-mix(in_oklab,var(--success)_28%,transparent)]",
        warning:
          "bg-[color-mix(in_oklab,var(--warning)_18%,transparent)] text-[var(--warning-foreground)] border-[color-mix(in_oklab,var(--warning)_45%,transparent)]",
        danger:
          "bg-[color-mix(in_oklab,var(--destructive)_10%,transparent)] text-[var(--destructive)] border-[color-mix(in_oklab,var(--destructive)_28%,transparent)]",
        violet:
          "bg-[var(--primary-soft)] text-[var(--primary)] border-[color-mix(in_oklab,var(--primary)_22%,transparent)]",
        muted: "bg-secondary text-secondary-foreground border-border",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export type StatusKey =
  | "active"
  | "inactive"
  | "in_stock"
  | "in_use"
  | "maintenance"
  | "retired"
  | "good"
  | "fair"
  | "repair_needed"
  | "ready"
  | "not_ready"
  | "pending"
  | "approved"
  | "rejected"
  | "open"
  | "in_progress"
  | "resolved"
  | "checked_out"
  | "checked_in"
  | "processed"
  | "healthy"
  | "failed"
  | "low_stock"
  | "draft"
  | "archived"
  | "import_valid"
  | "import_invalid";

const map: Record<StatusKey, { tone: VariantProps<typeof badge>["tone"]; label: string }> = {
  // success
  active: { tone: "success", label: "Active" },
  approved: { tone: "success", label: "Approved" },
  ready: { tone: "success", label: "Ready" },
  healthy: { tone: "success", label: "Healthy" },
  resolved: { tone: "success", label: "Resolved" },
  good: { tone: "success", label: "Good" },
  import_valid: { tone: "success", label: "Valid" },
  checked_in: { tone: "success", label: "Checked in" },
  // warning
  pending: { tone: "warning", label: "Pending" },
  low_stock: { tone: "warning", label: "Low stock" },
  fair: { tone: "warning", label: "Fair" },
  maintenance: { tone: "warning", label: "Maintenance" },
  // info
  open: { tone: "info", label: "Open" },
  in_progress: { tone: "info", label: "In progress" },
  in_stock: { tone: "info", label: "In stock" },
  checked_out: { tone: "info", label: "Checked out" },
  processed: { tone: "info", label: "Processed" },
  in_use: { tone: "violet", label: "In use" },
  // destructive
  rejected: { tone: "danger", label: "Rejected" },
  failed: { tone: "danger", label: "Failed" },
  not_ready: { tone: "danger", label: "Not ready" },
  repair_needed: { tone: "danger", label: "Repair needed" },
  retired: { tone: "danger", label: "Retired" },
  import_invalid: { tone: "danger", label: "Invalid" },
  // neutral
  draft: { tone: "neutral", label: "Draft" },
  archived: { tone: "neutral", label: "Archived" },
  inactive: { tone: "neutral", label: "Inactive" },
};

export function StatusBadge({
  status,
  className,
  label,
}: {
  status: StatusKey | string;
  className?: string;
  label?: string;
}) {
  const cfg = map[status as StatusKey] ?? {
    tone: "neutral" as VariantProps<typeof badge>["tone"],
    label: status.replaceAll("_", " "),
  };
  return (
    <span className={cn(badge({ tone: cfg.tone }), className)}>
      <span className="size-1.5 rounded-full bg-current opacity-80" />
      {label ?? cfg.label}
    </span>
  );
}
