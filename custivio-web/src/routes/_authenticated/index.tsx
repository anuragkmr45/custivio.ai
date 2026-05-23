import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Boxes,
  Warehouse,
  UserCheck,
  Wrench,
  ClipboardCheck,
  Activity,
  ArrowUpRight,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { ApiErrorPanel, LoadingPanel } from "@/components/data/ApiState";
import { PageHeader, PageBody, Panel, MetricCard } from "@/components/data/Panel";
import { StatusBadge } from "@/components/data/StatusBadge";
import { Button } from "@/components/ui/button";
import { useCurrentSession } from "@/lib/auth";
import { listAssets } from "@/lib/api/assets";
import { getStockOverview, type StockOverview } from "@/lib/api/stock";
import { getCustodyOverview, type CustodyOverview } from "@/lib/api/custody";
import { listMaintenanceTickets } from "@/lib/api/maintenance";
import { listAuditCampaigns } from "@/lib/api/reporting";
import { unwrapApiResult } from "@/lib/api/errors";
import { dateField, textField } from "@/lib/api/records";
import { canAccess, ROUTE_ACCESS, type RouteAccessKey } from "@/lib/permission-policy";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Dashboard - Custivio" },
      {
        name: "description",
        content: "Tenant overview of assets, stock, custody and maintenance.",
      },
    ],
  }),
  component: Dashboard,
});

const quickLinks: {
  to: string;
  label: string;
  icon: typeof Boxes;
  hint: string;
  routeAccess: RouteAccessKey;
}[] = [
  {
    to: "/assets",
    label: "Asset registry",
    icon: Boxes,
    hint: "Tag, serial, custody",
    routeAccess: "assets",
  },
  {
    to: "/stock",
    label: "Stock ledger",
    icon: Warehouse,
    hint: "Receive, issue, transfer",
    routeAccess: "stock",
  },
  {
    to: "/custody",
    label: "Custody & transfers",
    icon: UserCheck,
    hint: "Handovers",
    routeAccess: "custody",
  },
  {
    to: "/maintenance",
    label: "Maintenance",
    icon: Wrench,
    hint: "Tickets & warranties",
    routeAccess: "maintenance",
  },
  {
    to: "/audit-reports",
    label: "Audit & reports",
    icon: ClipboardCheck,
    hint: "Campaigns & exports",
    routeAccess: "auditReports",
  },
  {
    to: "/status",
    label: "System status",
    icon: Activity,
    hint: "Dependency health",
    routeAccess: "status",
  },
];

const dashboardQueryKey = ["dashboard", "summary"] as const;
const emptyStock: StockOverview = { units: [], items: [], balances: [], ledger: [], lowStock: [] };
const emptyCustody: CustodyOverview = {
  assets: [],
  users: [],
  assignments: [],
  transfers: [],
};

function Dashboard() {
  const sessionQuery = useCurrentSession();
  const session = sessionQuery.data ?? null;
  const canReadAssets = canAccess(session, ROUTE_ACCESS.assets);
  const canReadStock = canAccess(session, ROUTE_ACCESS.stock);
  const canReadCustody = canAccess(session, ROUTE_ACCESS.custody);
  const canReadMaintenance = canAccess(session, ROUTE_ACCESS.maintenance);
  const canReadReportingOverview = canAccess(session, ROUTE_ACCESS.auditReports);
  const visibleQuickLinks = quickLinks.filter((item) =>
    canAccess(session, ROUTE_ACCESS[item.routeAccess]),
  );
  const dashboardQuery = useQuery({
    queryKey: [...dashboardQueryKey, session?.permissionKeys.join("|")] as const,
    queryFn: async () => {
      const [assets, stock, custody, tickets, campaigns] = await Promise.all([
        canReadAssets ? listAssets() : undefined,
        canReadStock ? getStockOverview() : undefined,
        canReadCustody ? getCustodyOverview() : undefined,
        canReadMaintenance ? listMaintenanceTickets() : undefined,
        canReadReportingOverview ? listAuditCampaigns() : undefined,
      ]);

      return {
        assets: assets ? unwrapApiResult(assets).assets : [],
        stock: stock ? unwrapApiResult(stock) : emptyStock,
        custody: custody ? unwrapApiResult(custody) : emptyCustody,
        tickets: tickets ? unwrapApiResult(tickets).tickets : [],
        campaigns: campaigns ? unwrapApiResult(campaigns).campaigns : [],
      };
    },
    enabled: Boolean(session),
  });

  const data = dashboardQuery.data;
  const inUse = data?.assets.filter((asset) => asset.status === "in_use").length ?? 0;
  const inStock = data?.assets.filter((asset) => asset.status === "in_stock").length ?? 0;
  const maint = data?.assets.filter((asset) => asset.status === "maintenance").length ?? 0;
  const openTickets =
    data?.tickets.filter((ticket) => ticket.status === "open" || ticket.status === "in_progress")
      .length ?? 0;
  const pendingTransfers =
    data?.custody.transfers.filter((transfer) => transfer.status === "pending").length ?? 0;

  return (
    <>
      <PageHeader
        title={`Welcome back, ${session?.user.displayName.split(" ")[0] ?? "user"}`}
        description="Tenant workspace overview backed by live Fastify APIs."
        meta={
          <span>
            Signed in as{" "}
            <span className="font-medium text-foreground">{session?.user.email ?? "-"}</span> ·
            Tenant{" "}
            <span className="font-medium text-foreground">{session?.tenant.name ?? "-"}</span> ·
            Effective permissions{" "}
            <span className="font-medium text-foreground">
              {session?.permissionKeys.length ?? 0}
            </span>
          </span>
        }
        actions={
          canReadAssets ? (
            <Button
              asChild
              size="sm"
              className="rounded-md text-white"
              style={{ backgroundImage: "var(--gradient-primary)" }}
            >
              <Link to="/assets">
                Open registry <ArrowUpRight className="size-4" />
              </Link>
            </Button>
          ) : null
        }
      />
      <PageBody>
        {dashboardQuery.isLoading && <LoadingPanel label="Loading dashboard summary..." />}
        {dashboardQuery.isError && (
          <ApiErrorPanel error={dashboardQuery.error} onRetry={() => dashboardQuery.refetch()} />
        )}
        {data && (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
              {canReadAssets && (
                <MetricCard
                  label="Total assets"
                  value={data.assets.length}
                  hint={`${inUse} in use · ${inStock} in stock`}
                  icon={<Boxes className="size-4" />}
                />
              )}
              {canReadAssets && (
                <MetricCard
                  label="In maintenance"
                  value={maint}
                  hint="Across all locations"
                  icon={<Wrench className="size-4" />}
                />
              )}
              {canReadMaintenance && (
                <MetricCard
                  label="Open tickets"
                  value={openTickets}
                  icon={<Wrench className="size-4" />}
                />
              )}
              {canReadStock && (
                <MetricCard
                  label="Low stock items"
                  value={data.stock.lowStock.length}
                  hint="Below reorder point"
                  icon={<AlertTriangle className="size-4" />}
                />
              )}
              {canReadCustody && (
                <MetricCard
                  label="Pending transfers"
                  value={pendingTransfers}
                  hint="Awaiting approval"
                  icon={<UserCheck className="size-4" />}
                />
              )}
              {canReadReportingOverview && (
                <MetricCard
                  label="Audit campaigns"
                  value={data.campaigns.length}
                  icon={<TrendingUp className="size-4" />}
                />
              )}
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <Panel
                title="Quick module entry"
                description="Jump into a workspace area."
                className="lg:col-span-2"
                bodyClassName="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2"
              >
                {visibleQuickLinks.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="group flex items-start gap-3 rounded-xl border border-border/70 bg-card p-3.5 shadow-card transition-all hover:-translate-y-0.5 hover:border-[var(--primary)]/40 hover:shadow-[var(--shadow-pop)]"
                  >
                    <div className="flex size-9 items-center justify-center rounded-md bg-[var(--primary-soft)] text-[var(--primary)]">
                      <item.icon className="size-4" />
                    </div>
                    <div className="flex flex-1 flex-col">
                      <span className="text-sm font-semibold">{item.label}</span>
                      <span className="text-xs text-muted-foreground">{item.hint}</span>
                    </div>
                    <ArrowUpRight className="size-4 text-muted-foreground transition-colors group-hover:text-[var(--primary)]" />
                  </Link>
                ))}
              </Panel>

              {canReadAssets && (
                <Panel title="Recent assets" description="Newest records visible to this tenant.">
                  <ul className="-mx-1 divide-y divide-border/60">
                    {data.assets.slice(0, 6).map((asset) => (
                      <li key={asset.id} className="flex flex-col gap-0.5 px-1 py-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[11px] text-muted-foreground">
                            {textField(asset, "assetTag")}
                          </span>
                          <StatusBadge status={textField(asset, "status", "active")} />
                        </div>
                        <div className="text-sm text-foreground">
                          <span className="font-medium">{textField(asset, "name")}</span>
                        </div>
                        <div className="font-mono text-[11px] text-muted-foreground">
                          {dateField(asset, "updatedAt")}
                        </div>
                      </li>
                    ))}
                  </ul>
                </Panel>
              )}
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {canReadMaintenance && (
                <Panel
                  title="Open maintenance tickets"
                  actions={
                    <Link
                      className="text-xs text-[var(--primary)] hover:underline"
                      to="/maintenance"
                    >
                      View all
                    </Link>
                  }
                >
                  <ul className="divide-y divide-border/60">
                    {data.tickets
                      .filter(
                        (ticket) => ticket.status === "open" || ticket.status === "in_progress",
                      )
                      .slice(0, 6)
                      .map((ticket) => (
                        <li
                          key={ticket.id}
                          className="flex items-center justify-between gap-3 py-2"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 text-sm">
                              <span className="font-mono text-xs text-muted-foreground">
                                {ticket.id.slice(0, 8)}
                              </span>
                              <span className="truncate font-medium text-foreground">
                                {textField(ticket, "issueSummary")}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {`${textField(ticket, "assetId")} · Downtime ${
                                ticket.downtimeMinutes ?? 0
                              }m`}
                            </div>
                          </div>
                          <StatusBadge status={textField(ticket, "status", "open")} />
                        </li>
                      ))}
                  </ul>
                </Panel>
              )}

              {canReadStock && (
                <Panel
                  title="Items below reorder point"
                  actions={
                    <Link className="text-xs text-[var(--primary)] hover:underline" to="/stock">
                      Go to stock
                    </Link>
                  }
                >
                  <ul className="divide-y divide-border/60">
                    {data.stock.lowStock.slice(0, 6).map((balance) => (
                      <li key={balance.id} className="flex items-center justify-between gap-3 py-2">
                        <div>
                          <div className="text-sm font-medium text-foreground">
                            {textField(balance, "stockItemId")}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Location <span className="font-mono">{balance.locationKey}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold tabular-nums">
                            {balance.quantityOnHand ?? 0}
                          </div>
                          <StatusBadge status="low_stock" className="mt-1" />
                        </div>
                      </li>
                    ))}
                  </ul>
                </Panel>
              )}
            </div>
          </>
        )}
      </PageBody>
    </>
  );
}
