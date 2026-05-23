import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import { AccessDeniedPanel, ApiErrorPanel, LoadingPanel } from "@/components/data/ApiState";
import { PageHeader, PageBody, Panel, MetricCard } from "@/components/data/Panel";
import { DataTable, type Column } from "@/components/data/DataTable";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/data/StatusBadge";
import {
  createWarranty,
  createMaintenanceTicket,
  listMaintenanceTickets,
  listWarranties,
  updateMaintenanceTicketStatus,
  type AssetWarranty,
  type MaintenanceTicket,
} from "@/lib/api/maintenance";
import { listAssets } from "@/lib/api/assets";
import { unwrapApiResult } from "@/lib/api/errors";
import { dateField, textField } from "@/lib/api/records";
import { useCurrentSession } from "@/lib/auth";
import {
  ACTION_ACCESS,
  canAccess,
  formatPermissionRequirement,
  ROUTE_ACCESS,
} from "@/lib/permission-policy";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/maintenance")({
  head: () => ({
    meta: [
      { title: "Maintenance - Custivio" },
      { name: "description", content: "Maintenance tickets, warranties and downtime tracking." },
    ],
  }),
  component: MaintenancePage,
});

const maintenanceQueryKey = ["maintenance", "overview"] as const;

function MaintenancePage() {
  const queryClient = useQueryClient();
  const session = useCurrentSession().data ?? null;
  const canViewMaintenance = canAccess(session, ROUTE_ACCESS.maintenance);
  const canWriteMaintenance = canAccess(session, ACTION_ACCESS.maintenanceWrite);
  const canReadAssets = canAccess(session, ROUTE_ACCESS.assets);
  const canCreateMaintenance = canWriteMaintenance && canReadAssets;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [warrantyDialogOpen, setWarrantyDialogOpen] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [warrantyError, setWarrantyError] = useState<string | null>(null);
  const maintenanceQuery = useQuery({
    queryKey: maintenanceQueryKey,
    queryFn: async () => {
      const [tickets, warranties, assets] = await Promise.all([
        listMaintenanceTickets(),
        listWarranties(),
        canCreateMaintenance ? listAssets() : undefined,
      ]);
      return {
        tickets: unwrapApiResult(tickets).tickets,
        warranties: unwrapApiResult(warranties).warranties,
        assets: assets ? unwrapApiResult(assets).assets : [],
      };
    },
    enabled: canViewMaintenance,
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "in_progress" | "resolved" }) =>
      unwrapApiResult(
        await updateMaintenanceTicketStatus(id, {
          status,
          resolutionSummary: status === "resolved" ? "Resolved from UI" : undefined,
        }),
      ).ticket,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: maintenanceQueryKey }),
  });

  const createMutation = useMutation({
    mutationFn: async (form: FormData) => {
      setCreateError(null);
      return unwrapApiResult(
        await createMaintenanceTicket({
          assetId: String(form.get("assetId") ?? ""),
          assignedToUserId: String(form.get("assignedToUserId") ?? "") || undefined,
          issueSummary: String(form.get("issueSummary") ?? ""),
          priority: String(form.get("priority") ?? "medium") || "medium",
        }),
      ).ticket;
    },
    onSuccess: async () => {
      setDialogOpen(false);
      await queryClient.invalidateQueries({ queryKey: maintenanceQueryKey });
    },
    onError: (error) => {
      setCreateError(error instanceof Error ? error.message : "Could not create ticket.");
    },
  });

  const warrantyMutation = useMutation({
    mutationFn: async (form: FormData) => {
      setWarrantyError(null);
      return unwrapApiResult(
        await createWarranty({
          assetId: String(form.get("assetId") ?? ""),
          provider: String(form.get("provider") ?? ""),
          contractNumber: String(form.get("contractNumber") ?? "") || undefined,
          startsAt: String(form.get("startsAt") ?? ""),
          endsAt: String(form.get("endsAt") ?? ""),
          notes: String(form.get("notes") ?? "") || undefined,
          status: "active",
        }),
      ).warranty;
    },
    onSuccess: async () => {
      setWarrantyDialogOpen(false);
      await queryClient.invalidateQueries({ queryKey: maintenanceQueryKey });
    },
    onError: (error) => {
      setWarrantyError(error instanceof Error ? error.message : "Could not create warranty.");
    },
  });

  const tickets = maintenanceQuery.data?.tickets ?? [];
  const warranties = maintenanceQuery.data?.warranties ?? [];
  const open = tickets.filter((t) => t.status === "open" || t.status === "in_progress");
  const high = open.filter((t) => t.priority === "high").length;

  if (!canViewMaintenance) {
    return (
      <>
        <PageHeader
          title="Maintenance"
          description="Tickets, downtime context and warranty coverage from backend APIs."
        />
        <PageBody>
          <AccessDeniedPanel
            description="Your current role cannot view maintenance tickets or warranties."
            required={formatPermissionRequirement(ROUTE_ACCESS.maintenance)}
          />
        </PageBody>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Maintenance"
        description="Tickets, downtime context and warranty coverage from backend APIs."
        actions={
          <div className="flex flex-wrap gap-2">
            {canCreateMaintenance && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="size-4" />
                    New ticket
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form
                    action={(formData) => createMutation.mutate(formData)}
                    className="space-y-4"
                  >
                    <DialogHeader>
                      <DialogTitle>New maintenance ticket</DialogTitle>
                      <DialogDescription>
                        Opens a backend maintenance ticket linked to an asset.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-3">
                      <SelectField
                        name="assetId"
                        label="Asset"
                        options={(maintenanceQuery.data?.assets ?? []).map((asset) => ({
                          value: asset.id,
                          label: `${asset.assetTag ?? asset.id} - ${asset.name ?? "Asset"}`,
                        }))}
                      />
                      <Field name="issueSummary" label="Issue summary" required />
                      <SelectField
                        name="priority"
                        label="Priority"
                        options={[
                          { value: "low", label: "Low" },
                          { value: "medium", label: "Medium" },
                          { value: "high", label: "High" },
                        ]}
                      />
                      {createError && (
                        <p className="text-sm text-[var(--destructive)]">{createError}</p>
                      )}
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createMutation.isPending}>
                        Create ticket
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
            {canCreateMaintenance && (
              <Dialog open={warrantyDialogOpen} onOpenChange={setWarrantyDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Plus className="size-4" />
                    New warranty
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form
                    action={(formData) => warrantyMutation.mutate(formData)}
                    className="space-y-4"
                  >
                    <DialogHeader>
                      <DialogTitle>New warranty</DialogTitle>
                      <DialogDescription>
                        Creates backend warranty metadata for an asset.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-3">
                      <SelectField
                        name="assetId"
                        label="Asset"
                        options={(maintenanceQuery.data?.assets ?? []).map((asset) => ({
                          value: asset.id,
                          label: `${asset.assetTag ?? asset.id} - ${asset.name ?? "Asset"}`,
                        }))}
                      />
                      <Field name="provider" label="Provider" required />
                      <Field name="contractNumber" label="Contract number" />
                      <Field name="startsAt" label="Starts at" type="date" required />
                      <Field name="endsAt" label="Ends at" type="date" required />
                      <Field name="notes" label="Notes" />
                      {warrantyError && (
                        <p className="text-sm text-[var(--destructive)]">{warrantyError}</p>
                      )}
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setWarrantyDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={warrantyMutation.isPending}>
                        Create warranty
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        }
      />
      <PageBody>
        {maintenanceQuery.isLoading && <LoadingPanel label="Loading maintenance..." />}
        {maintenanceQuery.isError && (
          <ApiErrorPanel
            error={maintenanceQuery.error}
            onRetry={() => maintenanceQuery.refetch()}
          />
        )}
        {maintenanceQuery.data && (
          <>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <MetricCard label="Open tickets" value={open.length} />
              <MetricCard label="High priority" value={high} hint="Needs immediate attention" />
              <MetricCard
                label="Resolved"
                value={tickets.filter((t) => t.status === "resolved").length}
              />
              <MetricCard label="Warranties" value={warranties.length} />
            </div>

            <Tabs defaultValue="tickets">
              <TabsList>
                <TabsTrigger value="tickets">Tickets</TabsTrigger>
                <TabsTrigger value="board">Board view</TabsTrigger>
                <TabsTrigger value="warranties">Warranties</TabsTrigger>
              </TabsList>
              <TabsContent value="tickets">
                <DataTable
                  rows={tickets}
                  columns={ticketColumns({
                    busy: statusMutation.isPending,
                    onStatus: (id, status) => statusMutation.mutate({ id, status }),
                    canWrite: canWriteMaintenance,
                  })}
                  initialSort={{ key: "opened", dir: "desc" }}
                />
              </TabsContent>
              <TabsContent value="board">
                <div className="grid gap-4 md:grid-cols-2">
                  <Panel title={`Open · ${open.length}`}>
                    <TicketCards tickets={open} />
                  </Panel>
                  <Panel title={`Resolved · ${tickets.length - open.length}`}>
                    <TicketCards tickets={tickets.filter((t) => t.status === "resolved")} />
                  </Panel>
                </div>
              </TabsContent>
              <TabsContent value="warranties">
                <DataTable rows={warranties} columns={warrantyColumns()} />
              </TabsContent>
            </Tabs>
          </>
        )}
      </PageBody>
    </>
  );
}

function Field({
  name,
  label,
  type = "text",
  required,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} required={required} />
    </div>
  );
}

function SelectField({
  name,
  label,
  options,
  optional,
}: {
  name: string;
  label: string;
  options: Array<{ value: string; label: string }>;
  optional?: boolean;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      <select
        id={name}
        name={name}
        required={!optional}
        className="h-9 rounded-md border border-input bg-background px-3 text-sm"
      >
        {optional && <option value="">Unassigned</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function ticketColumns({
  busy,
  onStatus,
  canWrite,
}: {
  busy: boolean;
  onStatus: (id: string, status: "in_progress" | "resolved") => void;
  canWrite: boolean;
}): Column<MaintenanceTicket>[] {
  return [
    {
      key: "id",
      header: "ID",
      cell: (r) => <span className="font-mono text-xs text-accent">{r.id.slice(0, 8)}</span>,
      searchValue: (r) =>
        `${r.id} ${textField(r, "issueSummary", "")} ${textField(r, "assetId", "")}`,
    },
    {
      key: "title",
      header: "Issue",
      cell: (r) => (
        <div>
          <div className="font-medium">{textField(r, "issueSummary")}</div>
          <div className="text-xs text-muted-foreground">Asset {textField(r, "assetId")}</div>
        </div>
      ),
    },
    {
      key: "priority",
      header: "Priority",
      cell: (r) => (
        <StatusBadge
          status={
            r.priority === "high" ? "repair_needed" : r.priority === "medium" ? "fair" : "good"
          }
          label={textField(r, "priority")}
        />
      ),
    },
    {
      key: "opened",
      header: "Opened",
      sortable: true,
      sortValue: (r) => textField(r, "openedAt"),
      cell: (r) => <span className="font-mono text-xs">{dateField(r, "openedAt")}</span>,
    },
    {
      key: "downtime",
      header: "Downtime",
      align: "right",
      cell: (r) => <span className="font-mono">{r.downtimeMinutes ?? 0}m</span>,
    },
    {
      key: "status",
      header: "Status",
      cell: (r) => <StatusBadge status={textField(r, "status", "open")} />,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: (r) =>
        !canWrite ? (
          <span className="text-xs text-muted-foreground">Read only</span>
        ) : r.status === "open" ? (
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => onStatus(r.id, "in_progress")}
          >
            Start
          </Button>
        ) : r.status === "in_progress" ? (
          <Button
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => onStatus(r.id, "resolved")}
          >
            Resolve
          </Button>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        ),
    },
  ];
}

function warrantyColumns(): Column<AssetWarranty>[] {
  return [
    {
      key: "asset",
      header: "Asset",
      cell: (r) => <span className="font-mono text-xs text-accent">{textField(r, "assetId")}</span>,
    },
    {
      key: "provider",
      header: "Provider",
      searchValue: (r) => `${textField(r, "provider", "")} ${textField(r, "contractNumber", "")}`,
      cell: (r) => textField(r, "provider"),
    },
    {
      key: "contract",
      header: "Contract",
      cell: (r) => <span className="font-mono text-xs">{textField(r, "contractNumber")}</span>,
    },
    { key: "until", header: "Covered until", cell: (r) => dateField(r, "endsAt") },
    {
      key: "status",
      header: "Status",
      cell: (r) => <StatusBadge status={textField(r, "status", "active")} />,
    },
  ];
}

function TicketCards({ tickets }: { tickets: MaintenanceTicket[] }) {
  return (
    <ul className="space-y-2">
      {tickets.map((ticket) => (
        <li key={ticket.id} className="rounded-md border border-border bg-surface p-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-muted-foreground">{ticket.id.slice(0, 8)}</span>
            <StatusBadge
              status={ticket.priority === "high" ? "repair_needed" : "fair"}
              label={textField(ticket, "priority")}
            />
          </div>
          <div className="mt-1 font-medium">{textField(ticket, "issueSummary")}</div>
          <div className="text-xs text-muted-foreground">
            Asset {textField(ticket, "assetId")} · Downtime {ticket.downtimeMinutes ?? 0}m
          </div>
        </li>
      ))}
    </ul>
  );
}
