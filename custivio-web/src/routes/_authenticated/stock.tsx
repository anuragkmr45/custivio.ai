import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDownToLine, ArrowLeftRight, Plus, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { AccessDeniedPanel, ApiErrorPanel, LoadingPanel } from "@/components/data/ApiState";
import { PageHeader, PageBody, MetricCard } from "@/components/data/Panel";
import { DataTable, type Column } from "@/components/data/DataTable";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/data/StatusBadge";
import {
  createStockItem,
  createStockMovement,
  createStockUnit,
  getStockOverview,
  type StockBalance,
  type StockItem,
  type StockLedgerEntry,
  type StockOverview,
} from "@/lib/api/stock";
import { unwrapApiResult } from "@/lib/api/errors";
import { createIdempotencyKey } from "@/lib/api/idempotency";
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

export const Route = createFileRoute("/_authenticated/stock")({
  head: () => ({
    meta: [
      { title: "Stock - Custivio" },
      {
        name: "description",
        content: "Stock items, balances and movement ledger across locations.",
      },
    ],
  }),
  component: StockPage,
});

const stockQueryKey = ["stock", "overview"] as const;

function StockPage() {
  const queryClient = useQueryClient();
  const session = useCurrentSession().data ?? null;
  const canViewStock = canAccess(session, ROUTE_ACCESS.stock);
  const canWriteStock = canAccess(session, ACTION_ACCESS.stockWrite);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [itemDialogOpen, setItemDialogOpen] = useState(false);
  const [movementError, setMovementError] = useState<string | null>(null);
  const [itemError, setItemError] = useState<string | null>(null);

  const stockQuery = useQuery({
    queryKey: stockQueryKey,
    queryFn: async () => unwrapApiResult(await getStockOverview()),
    enabled: canViewStock,
  });

  const movementMutation = useMutation({
    mutationFn: async (form: FormData) => {
      setMovementError(null);
      return unwrapApiResult(
        await createStockMovement({
          stockItemId: String(form.get("stockItemId") ?? ""),
          movementType: String(form.get("movementType") ?? "receive") as
            "receive" | "issue" | "transfer" | "adjust",
          quantity: Number(form.get("quantity") ?? 0),
          fromLocationKey: String(form.get("fromLocationKey") ?? "") || undefined,
          toLocationKey: String(form.get("toLocationKey") ?? "") || undefined,
          reason: String(form.get("reason") ?? "") || undefined,
          referenceId: String(form.get("referenceId") ?? "") || undefined,
          idempotencyKey: createIdempotencyKey("stock"),
        }),
      ).ledger;
    },
    onSuccess: async () => {
      setDialogOpen(false);
      await queryClient.invalidateQueries({ queryKey: stockQueryKey });
    },
    onError: (error) => {
      setMovementError(error instanceof Error ? error.message : "Stock movement failed.");
    },
  });

  const itemMutation = useMutation({
    mutationFn: async (form: FormData) => {
      setItemError(null);
      let unitId = String(form.get("unitId") ?? "");
      const newUnitCode = String(form.get("newUnitCode") ?? "").trim();
      if (!unitId && newUnitCode) {
        unitId = unwrapApiResult(
          await createStockUnit({
            code: newUnitCode,
            name: String(form.get("newUnitName") ?? newUnitCode),
          }),
        ).unit.id;
      }

      return unwrapApiResult(
        await createStockItem({
          unitId,
          sku: String(form.get("sku") ?? ""),
          name: String(form.get("name") ?? ""),
          itemType: String(form.get("itemType") ?? "consumable") || "consumable",
          lowStockThreshold: Number(form.get("lowStockThreshold") ?? 0),
        }),
      ).item;
    },
    onSuccess: async () => {
      setItemDialogOpen(false);
      await queryClient.invalidateQueries({ queryKey: stockQueryKey });
    },
    onError: (error) => {
      setItemError(error instanceof Error ? error.message : "Could not create stock item.");
    },
  });

  const overview = stockQuery.data;
  const itemById = useMemo(
    () => new Map((overview?.items ?? []).map((item) => [item.id, item])),
    [overview?.items],
  );
  const totalBalance =
    overview?.balances.reduce((sum, balance) => sum + (balance.quantityOnHand ?? 0), 0) ?? 0;

  if (!canViewStock) {
    return (
      <>
        <PageHeader
          title="Stock"
          description="Warehouse-wide stock items, on-hand balances and movement ledger."
        />
        <PageBody>
          <AccessDeniedPanel
            description="Your current role cannot view stock and inventory records."
            required={formatPermissionRequirement(ROUTE_ACCESS.stock)}
          />
        </PageBody>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Stock"
        description="Warehouse-wide stock items, on-hand balances and movement ledger."
        actions={
          <>
            {canWriteStock && (
              <MovementDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                overview={overview}
                error={movementError}
                pending={movementMutation.isPending}
                onSubmit={(formData) => movementMutation.mutate(formData)}
              />
            )}
            {canWriteStock && (
              <Button size="sm" variant="outline">
                <ArrowLeftRight className="size-4" />
                Transfer
              </Button>
            )}
            {canWriteStock && (
              <StockItemDialog
                open={itemDialogOpen}
                onOpenChange={setItemDialogOpen}
                overview={overview}
                error={itemError}
                pending={itemMutation.isPending}
                onSubmit={(formData) => itemMutation.mutate(formData)}
              />
            )}
          </>
        }
      />
      <PageBody>
        {stockQuery.isLoading && <LoadingPanel label="Loading stock overview..." />}
        {stockQuery.isError && (
          <ApiErrorPanel error={stockQuery.error} onRetry={() => stockQuery.refetch()} />
        )}
        {overview && (
          <>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <MetricCard label="Items tracked" value={overview.items.length} />
              <MetricCard label="Total on hand" value={totalBalance} hint="All locations" />
              <MetricCard
                label="Low stock alerts"
                value={overview.lowStock.length}
                hint="Below reorder point"
              />
              <MetricCard
                label="Ledger entries"
                value={overview.ledger.length}
                hint="Receive + issue + transfer"
              />
            </div>

            <Tabs defaultValue="items">
              <TabsList>
                <TabsTrigger value="items">Items</TabsTrigger>
                <TabsTrigger value="balances">Balances</TabsTrigger>
                <TabsTrigger value="ledger">Ledger</TabsTrigger>
                <TabsTrigger value="low">Low stock</TabsTrigger>
              </TabsList>
              <TabsContent value="items">
                <DataTable
                  rows={overview.items}
                  columns={itemColumns(overview)}
                  initialSort={{ key: "sku", dir: "asc" }}
                  toolbar={
                    <Button size="sm" variant="outline">
                      <SlidersHorizontal className="size-4" />
                      Filters
                    </Button>
                  }
                />
              </TabsContent>
              <TabsContent value="balances">
                <DataTable rows={overview.balances} columns={balanceColumns(itemById)} />
              </TabsContent>
              <TabsContent value="ledger">
                <DataTable
                  rows={overview.ledger}
                  columns={ledgerColumns(itemById)}
                  initialSort={{ key: "at", dir: "desc" }}
                />
              </TabsContent>
              <TabsContent value="low">
                <DataTable rows={overview.lowStock} columns={balanceColumns(itemById)} />
              </TabsContent>
            </Tabs>
          </>
        )}
      </PageBody>
    </>
  );
}

function StockItemDialog({
  open,
  onOpenChange,
  overview,
  error,
  pending,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  overview?: StockOverview;
  error: string | null;
  pending: boolean;
  onSubmit: (formData: FormData) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-4" />
          New item
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form action={onSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>New stock item</DialogTitle>
            <DialogDescription>
              Creates a stock item. Select an existing unit or enter a new unit code.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <Field name="sku" label="SKU" required />
            <Field name="name" label="Name" required />
            <Field name="itemType" label="Item type" />
            <Field name="lowStockThreshold" label="Low stock threshold" type="number" />
            <div className="grid gap-1.5">
              <Label htmlFor="unitId">Existing unit</Label>
              <select
                id="unitId"
                name="unitId"
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">Create new unit below</option>
                {(overview?.units ?? []).map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.code} - {unit.name}
                  </option>
                ))}
              </select>
            </div>
            <Field name="newUnitCode" label="New unit code" />
            <Field name="newUnitName" label="New unit name" />
            {error && <p className="text-sm text-[var(--destructive)]">{error}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              Create item
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function itemColumns(overview: StockOverview): Column<StockItem>[] {
  const unitById = new Map(overview.units.map((unit) => [unit.id, unit]));
  const balanceByItem = new Map<string, number>();
  for (const balance of overview.balances) {
    balanceByItem.set(
      balance.stockItemId ?? "",
      (balanceByItem.get(balance.stockItemId ?? "") ?? 0) + (balance.quantityOnHand ?? 0),
    );
  }

  return [
    {
      key: "sku",
      header: "SKU",
      sortable: true,
      sortValue: (r) => textField(r, "sku"),
      searchValue: (r) => `${textField(r, "sku", "")} ${textField(r, "name", "")}`,
      cell: (r) => <span className="font-mono text-xs">{textField(r, "sku")}</span>,
    },
    {
      key: "name",
      header: "Item",
      sortable: true,
      sortValue: (r) => textField(r, "name"),
      cell: (r) => <span className="font-medium">{textField(r, "name")}</span>,
    },
    { key: "category", header: "Type", cell: (r) => textField(r, "itemType") },
    {
      key: "unit",
      header: "Unit",
      cell: (r) => (
        <span className="text-xs uppercase">{textField(unitById.get(r.unitId ?? ""), "code")}</span>
      ),
    },
    {
      key: "balance",
      header: "Balance",
      align: "right",
      sortable: true,
      sortValue: (r) => balanceByItem.get(r.id) ?? 0,
      cell: (r) => <span className="font-semibold">{balanceByItem.get(r.id) ?? 0}</span>,
    },
    {
      key: "reorder",
      header: "Reorder pt",
      align: "right",
      cell: (r) => r.lowStockThreshold ?? 0,
    },
    {
      key: "status",
      header: "Status",
      cell: (r) => <StatusBadge status={textField(r, "status", "active")} />,
    },
  ];
}

function balanceColumns(itemById: Map<string, StockItem>): Column<StockBalance>[] {
  return [
    {
      key: "sku",
      header: "SKU",
      cell: (r) => (
        <span className="font-mono text-xs">
          {textField(itemById.get(r.stockItemId ?? ""), "sku")}
        </span>
      ),
      searchValue: (r) => textField(itemById.get(r.stockItemId ?? ""), ["sku", "name"], ""),
    },
    {
      key: "name",
      header: "Item",
      cell: (r) => textField(itemById.get(r.stockItemId ?? ""), "name"),
    },
    {
      key: "location",
      header: "Location",
      sortable: true,
      sortValue: (r) => textField(r, "locationKey"),
      cell: (r) => textField(r, "locationKey"),
    },
    {
      key: "quantity",
      header: "On hand",
      align: "right",
      sortable: true,
      sortValue: (r) => r.quantityOnHand ?? 0,
      cell: (r) => <span className="font-semibold">{r.quantityOnHand ?? 0}</span>,
    },
  ];
}

function ledgerColumns(itemById: Map<string, StockItem>): Column<StockLedgerEntry>[] {
  return [
    {
      key: "at",
      header: "When",
      sortable: true,
      sortValue: (r) => textField(r, "createdAt"),
      cell: (r) => <span className="font-mono text-xs">{dateField(r, "createdAt")}</span>,
    },
    {
      key: "sku",
      header: "SKU",
      cell: (r) => (
        <span className="font-mono text-xs">
          {textField(itemById.get(r.stockItemId ?? ""), "sku")}
        </span>
      ),
      searchValue: (r) =>
        `${textField(itemById.get(r.stockItemId ?? ""), "sku", "")} ${textField(r, "referenceId", "")}`,
    },
    {
      key: "name",
      header: "Item",
      cell: (r) => textField(itemById.get(r.stockItemId ?? ""), "name"),
    },
    {
      key: "type",
      header: "Type",
      cell: (r) => <span className="text-xs uppercase tracking-wide">{r.movementType}</span>,
    },
    {
      key: "qty",
      header: "Qty",
      align: "right",
      cell: (r) => <span className="font-semibold">{r.quantity ?? 0}</span>,
    },
    { key: "from", header: "From", cell: (r) => textField(r, "fromLocationKey") },
    { key: "to", header: "To", cell: (r) => textField(r, "toLocationKey") },
    {
      key: "ref",
      header: "Reference",
      cell: (r) => <span className="font-mono text-xs">{textField(r, "referenceId")}</span>,
    },
  ];
}

function MovementDialog({
  open,
  onOpenChange,
  overview,
  error,
  pending,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  overview?: StockOverview;
  error: string | null;
  pending: boolean;
  onSubmit: (formData: FormData) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <ArrowDownToLine className="size-4" />
          Movement
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form action={onSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Record stock movement</DialogTitle>
            <DialogDescription>
              Submits a backend stock ledger mutation with a generated idempotency key.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="stockItemId">Item</Label>
              <select
                id="stockItemId"
                name="stockItemId"
                required
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                {(overview?.items ?? []).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.sku} - {item.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="movementType">Movement type</Label>
              <select
                id="movementType"
                name="movementType"
                required
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="receive">Receive</option>
                <option value="issue">Issue</option>
                <option value="transfer">Transfer</option>
                <option value="adjust">Adjust</option>
              </select>
            </div>
            <Field name="quantity" label="Quantity" type="number" required />
            <Field name="fromLocationKey" label="From location key" />
            <Field name="toLocationKey" label="To location key" />
            <Field name="referenceId" label="Reference" />
            <Field name="reason" label="Reason" />
            {error && <p className="text-sm text-[var(--destructive)]">{error}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              Submit movement
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
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
