import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, X, ArrowRightLeft, UserPlus } from "lucide-react";
import { useState } from "react";
import { AccessDeniedPanel, ApiErrorPanel, LoadingPanel } from "@/components/data/ApiState";
import { PageHeader, PageBody, Panel, MetricCard } from "@/components/data/Panel";
import { DataTable, type Column } from "@/components/data/DataTable";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/data/StatusBadge";
import {
  checkInAsset,
  checkoutAsset,
  createTransfer,
  decideTransfer,
  getCustodyOverview,
  handoverAsset,
  type CustodyAssignment,
  type TransferRequest,
} from "@/lib/api/custody";
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

export const Route = createFileRoute("/_authenticated/custody")({
  head: () => ({
    meta: [
      { title: "Custody - Custivio" },
      {
        name: "description",
        content: "Asset checkout, check-in, custodian tracking and transfer approvals.",
      },
    ],
  }),
  component: CustodyPage,
});

const custodyQueryKey = ["custody", "overview"] as const;

function CustodyPage() {
  const queryClient = useQueryClient();
  const session = useCurrentSession().data ?? null;
  const canViewCustody = canAccess(session, ROUTE_ACCESS.custody);
  const canWriteCustody = canAccess(session, ACTION_ACCESS.custodyWrite);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [handoverAssignment, setHandoverAssignment] = useState<CustodyAssignment | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [transferError, setTransferError] = useState<string | null>(null);
  const [handoverError, setHandoverError] = useState<string | null>(null);
  const custodyQuery = useQuery({
    queryKey: custodyQueryKey,
    queryFn: async () => unwrapApiResult(await getCustodyOverview()),
    enabled: canViewCustody,
  });

  const checkInMutation = useMutation({
    mutationFn: async (assignmentId: string) =>
      unwrapApiResult(await checkInAsset({ assignmentId, notes: "Checked in from UI" })).assignment,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: custodyQueryKey }),
  });

  const handoverMutation = useMutation({
    mutationFn: async (form: FormData) => {
      const assignment = handoverAssignment;
      if (!assignment) throw new Error("No custody assignment selected.");
      setHandoverError(null);
      const toUserId = String(form.get("toUserId") ?? "");
      if (!toUserId) throw new Error("Select a target custodian.");
      if (toUserId === assignment.assignedToUserId) {
        throw new Error("Target custodian must be different from the current custodian.");
      }
      return unwrapApiResult(
        await handoverAsset({
          assignmentId: assignment.id,
          toUserId,
          notes: String(form.get("notes") ?? "") || undefined,
        }),
      ).assignment;
    },
    onSuccess: async () => {
      setHandoverAssignment(null);
      await queryClient.invalidateQueries({ queryKey: custodyQueryKey });
    },
    onError: (error) =>
      setHandoverError(error instanceof Error ? error.message : "Could not hand over asset."),
  });

  const checkoutMutation = useMutation({
    mutationFn: async (form: FormData) => {
      setCheckoutError(null);
      return unwrapApiResult(
        await checkoutAsset({
          assetId: String(form.get("assetId") ?? ""),
          assignedToUserId: String(form.get("assignedToUserId") ?? ""),
          dueAt: String(form.get("dueAt") ?? "") || undefined,
          notes: String(form.get("notes") ?? "") || undefined,
        }),
      ).assignment;
    },
    onSuccess: async () => {
      setCheckoutOpen(false);
      await queryClient.invalidateQueries({ queryKey: custodyQueryKey });
    },
    onError: (error) =>
      setCheckoutError(error instanceof Error ? error.message : "Could not check out asset."),
  });

  const createTransferMutation = useMutation({
    mutationFn: async (form: FormData) => {
      setTransferError(null);
      return unwrapApiResult(
        await createTransfer({
          assetId: String(form.get("assetId") ?? ""),
          toCustodianUserId: String(form.get("toCustodianUserId") ?? ""),
          reason: String(form.get("reason") ?? "") || undefined,
        }),
      ).transfer;
    },
    onSuccess: async () => {
      setTransferOpen(false);
      await queryClient.invalidateQueries({ queryKey: custodyQueryKey });
    },
    onError: (error) =>
      setTransferError(error instanceof Error ? error.message : "Could not create transfer."),
  });

  const transferDecisionMutation = useMutation({
    mutationFn: async ({ id, decision }: { id: string; decision: "approved" | "rejected" }) =>
      unwrapApiResult(await decideTransfer(id, { decision })).transfer,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: custodyQueryKey }),
  });

  const overview = custodyQuery.data;
  const assetById = new Map((overview?.assets ?? []).map((asset) => [asset.id, asset]));
  const userById = new Map((overview?.users ?? []).map((user) => [user.id, user]));
  const activeAssignments = (overview?.assignments ?? []).filter(
    (assignment) => assignment.status === "active",
  );
  const assignedAssetIds = new Set(activeAssignments.map((assignment) => assignment.assetId));
  const availableAssets = (overview?.assets ?? []).filter(
    (asset) => !assignedAssetIds.has(asset.id),
  );
  const pendingTransfers = (overview?.transfers ?? []).filter(
    (transfer) => transfer.status === "pending",
  );

  if (!canViewCustody) {
    return (
      <>
        <PageHeader
          title="Custody"
          description="Track who holds which asset and manage transfer requests."
        />
        <PageBody>
          <AccessDeniedPanel
            description="Your current role cannot view custody and transfer records."
            required={formatPermissionRequirement(ROUTE_ACCESS.custody)}
          />
        </PageBody>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Custody"
        description="Track who holds which asset and manage transfer requests."
        actions={
          <div className="flex flex-wrap gap-2">
            {canWriteCustody && (
              <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" disabled={!overview}>
                    <UserPlus className="size-4" />
                    Check out asset
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form
                    action={(formData) => checkoutMutation.mutate(formData)}
                    className="space-y-4"
                  >
                    <DialogHeader>
                      <DialogTitle>Check out asset</DialogTitle>
                      <DialogDescription>
                        Assigns an available backend asset to a tenant user.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-3">
                      <SelectField
                        name="assetId"
                        label="Asset"
                        options={availableAssets.map((asset) => ({
                          value: asset.id,
                          label: `${textField(asset, "assetTag")} - ${textField(asset, "name")}`,
                        }))}
                      />
                      <SelectField
                        name="assignedToUserId"
                        label="Custodian"
                        options={(overview?.users ?? []).map((user) => ({
                          value: user.id,
                          label: textField(user, "displayName"),
                        }))}
                      />
                      <Field name="dueAt" label="Due date" type="date" />
                      <Field name="notes" label="Notes" />
                      {checkoutError && (
                        <p className="text-sm text-[var(--destructive)]">{checkoutError}</p>
                      )}
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setCheckoutOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={checkoutMutation.isPending}>
                        Check out
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
            {canWriteCustody && (
              <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" disabled={!overview}>
                    <ArrowRightLeft className="size-4" />
                    Request transfer
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form
                    action={(formData) => createTransferMutation.mutate(formData)}
                    className="space-y-4"
                  >
                    <DialogHeader>
                      <DialogTitle>Request transfer</DialogTitle>
                      <DialogDescription>
                        Creates a backend transfer request for manager review.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-3">
                      <SelectField
                        name="assetId"
                        label="Asset"
                        options={(overview?.assets ?? []).map((asset) => ({
                          value: asset.id,
                          label: `${textField(asset, "assetTag")} - ${textField(asset, "name")}`,
                        }))}
                      />
                      <SelectField
                        name="toCustodianUserId"
                        label="To custodian"
                        options={(overview?.users ?? []).map((user) => ({
                          value: user.id,
                          label: textField(user, "displayName"),
                        }))}
                      />
                      <Field name="reason" label="Reason" />
                      {transferError && (
                        <p className="text-sm text-[var(--destructive)]">{transferError}</p>
                      )}
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setTransferOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createTransferMutation.isPending}>
                        Create request
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
        {custodyQuery.isLoading && <LoadingPanel label="Loading custody overview..." />}
        {custodyQuery.isError && (
          <ApiErrorPanel error={custodyQuery.error} onRetry={() => custodyQuery.refetch()} />
        )}
        {overview && (
          <>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <MetricCard
                label="In custody"
                value={activeAssignments.length}
                hint="Currently assigned"
              />
              <MetricCard
                label="Pending transfers"
                value={pendingTransfers.length}
                hint="Awaiting approval"
              />
              <MetricCard label="Assets in scope" value={overview.assets.length} />
              <MetricCard label="Users in scope" value={overview.users.length} />
            </div>

            <Tabs defaultValue="active">
              <TabsList>
                <TabsTrigger value="active">Active custody</TabsTrigger>
                <TabsTrigger value="transfers">Transfer requests</TabsTrigger>
              </TabsList>
              <TabsContent value="active">
                <DataTable
                  rows={activeAssignments}
                  columns={custodyColumns({
                    assetById,
                    userById,
                    onCheckIn: (assignment) => checkInMutation.mutate(assignment.id),
                    onHandover: (assignment) => {
                      setHandoverError(null);
                      setHandoverAssignment(assignment);
                    },
                    busy: checkInMutation.isPending || handoverMutation.isPending,
                    canWrite: canWriteCustody,
                  })}
                />
              </TabsContent>
              <TabsContent value="transfers">
                <DataTable
                  rows={overview.transfers}
                  columns={transferColumns({
                    assetById,
                    userById,
                    onDecision: (id, decision) => transferDecisionMutation.mutate({ id, decision }),
                    busy: transferDecisionMutation.isPending,
                    canWrite: canWriteCustody,
                  })}
                />
              </TabsContent>
            </Tabs>

            <Panel
              title="State transitions"
              description="Allowed custody state changes within the tenant."
            >
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <StatusBadge status="in_stock" />
                <ArrowRightLeft className="size-4 text-muted-foreground" />
                <StatusBadge status="in_use" />
                <ArrowRightLeft className="size-4 text-muted-foreground" />
                <StatusBadge status="maintenance" />
                <ArrowRightLeft className="size-4 text-muted-foreground" />
                <StatusBadge status="in_stock" />
                <span className="mx-2 text-muted-foreground">·</span>
                <StatusBadge status="in_use" />
                <ArrowRightLeft className="size-4 text-muted-foreground" />
                <StatusBadge status="retired" />
              </div>
            </Panel>

            <Dialog
              open={Boolean(handoverAssignment)}
              onOpenChange={(open) => {
                if (!open) setHandoverAssignment(null);
              }}
            >
              <DialogContent>
                <form
                  action={(formData) => handoverMutation.mutate(formData)}
                  className="space-y-4"
                >
                  <DialogHeader>
                    <DialogTitle>Hand over asset</DialogTitle>
                    <DialogDescription>
                      Select the target custodian explicitly before submitting the backend handover.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-3">
                    <div className="rounded-md border border-border bg-surface-2 p-3 text-sm">
                      <div className="font-medium text-foreground">
                        {textField(assetById.get(handoverAssignment?.assetId ?? ""), "assetTag")} -{" "}
                        {textField(assetById.get(handoverAssignment?.assetId ?? ""), "name")}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Current custodian:{" "}
                        {textField(
                          userById.get(handoverAssignment?.assignedToUserId ?? ""),
                          "displayName",
                        )}
                      </div>
                    </div>
                    <SelectField
                      name="toUserId"
                      label="Target custodian"
                      options={(overview?.users ?? [])
                        .filter((user) => user.id !== handoverAssignment?.assignedToUserId)
                        .map((user) => ({ value: user.id, label: textField(user, "displayName") }))}
                    />
                    <Field name="notes" label="Notes" />
                    {handoverError && (
                      <p className="text-sm text-[var(--destructive)]">{handoverError}</p>
                    )}
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setHandoverAssignment(null)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={handoverMutation.isPending}>
                      Hand over
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </>
        )}
      </PageBody>
    </>
  );
}

function Field({ name, label, type = "text" }: { name: string; label: string; type?: string }) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} />
    </div>
  );
}

function SelectField({
  name,
  label,
  options,
}: {
  name: string;
  label: string;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      <select
        name={name}
        required
        className="h-10 rounded-md border border-input bg-background px-3 text-sm"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function custodyColumns({
  assetById,
  userById,
  onCheckIn,
  onHandover,
  busy,
  canWrite,
}: {
  assetById: Map<string, Record<string, unknown>>;
  userById: Map<string, Record<string, unknown>>;
  onCheckIn: (assignment: CustodyAssignment) => void;
  onHandover: (assignment: CustodyAssignment) => void;
  busy: boolean;
  canWrite: boolean;
}): Column<CustodyAssignment>[] {
  return [
    {
      key: "asset",
      header: "Asset",
      searchValue: (r) =>
        `${textField(assetById.get(r.assetId ?? ""), "assetTag", "")} ${textField(assetById.get(r.assetId ?? ""), "name", "")}`,
      cell: (r) => {
        const asset = assetById.get(r.assetId ?? "");
        return (
          <div>
            <div className="font-mono text-xs text-accent">{textField(asset, "assetTag")}</div>
            <div className="text-xs text-muted-foreground">{textField(asset, "name")}</div>
          </div>
        );
      },
    },
    {
      key: "custodian",
      header: "Custodian",
      cell: (r) => (
        <span className="font-medium">
          {textField(userById.get(r.assignedToUserId ?? ""), "displayName")}
        </span>
      ),
    },
    {
      key: "since",
      header: "Since",
      cell: (r) => <span className="font-mono text-xs">{dateField(r, "checkedOutAt")}</span>,
    },
    {
      key: "status",
      header: "State",
      cell: (r) => <StatusBadge status={textField(r, "status", "in_use")} />,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: (r) =>
        canWrite ? (
          <div className="flex justify-end gap-1">
            <Button size="sm" variant="outline" disabled={busy} onClick={() => onCheckIn(r)}>
              Check in
            </Button>
            <Button size="sm" variant="outline" disabled={busy} onClick={() => onHandover(r)}>
              Handover
            </Button>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">Read only</span>
        ),
    },
  ];
}

function transferColumns({
  assetById,
  userById,
  onDecision,
  busy,
  canWrite,
}: {
  assetById: Map<string, Record<string, unknown>>;
  userById: Map<string, Record<string, unknown>>;
  onDecision: (id: string, decision: "approved" | "rejected") => void;
  busy: boolean;
  canWrite: boolean;
}): Column<TransferRequest>[] {
  return [
    {
      key: "id",
      header: "Req",
      cell: (r) => (
        <span className="font-mono text-xs text-muted-foreground">{r.id.slice(0, 8)}</span>
      ),
    },
    {
      key: "asset",
      header: "Asset",
      searchValue: (r) =>
        `${textField(assetById.get(r.assetId ?? ""), "assetTag", "")} ${textField(assetById.get(r.assetId ?? ""), "name", "")}`,
      cell: (r) => {
        const asset = assetById.get(r.assetId ?? "");
        return (
          <div>
            <div className="font-mono text-xs">{textField(asset, "assetTag")}</div>
            <div className="text-xs text-muted-foreground">{textField(asset, "name")}</div>
          </div>
        );
      },
    },
    {
      key: "to",
      header: "To custodian",
      cell: (r) => textField(userById.get(r.toCustodianUserId ?? ""), "displayName"),
    },
    {
      key: "at",
      header: "When",
      cell: (r) => <span className="font-mono text-xs">{dateField(r, "createdAt")}</span>,
    },
    {
      key: "status",
      header: "Status",
      cell: (r) => <StatusBadge status={textField(r, "status", "pending")} />,
    },
    {
      key: "actions",
      header: "",
      align: "right",
      cell: (r) =>
        canWrite && r.status === "pending" ? (
          <div className="flex justify-end gap-1">
            <Button
              size="sm"
              variant="outline"
              className="text-[var(--success)]"
              disabled={busy}
              onClick={() => onDecision(r.id, "approved")}
            >
              <Check className="size-4" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-[var(--destructive)]"
              disabled={busy}
              onClick={() => onDecision(r.id, "rejected")}
            >
              <X className="size-4" />
              Reject
            </Button>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        ),
    },
  ];
}
