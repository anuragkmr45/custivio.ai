import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw, FileText } from "lucide-react";
import { ApiErrorPanel, LoadingPanel } from "@/components/data/ApiState";
import { PageHeader, PageBody, Panel, MetricCard } from "@/components/data/Panel";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/data/StatusBadge";
import { getApiBaseUrl } from "@/lib/api/config";
import { getMetricsText, getOpsStatus, getReadyHealth } from "@/lib/api/status";
import { unwrapApiResult } from "@/lib/api/errors";

export const Route = createFileRoute("/_authenticated/status")({
  head: () => ({
    meta: [
      { title: "System Status - Custivio" },
      {
        name: "description",
        content: "On-prem dependency health, metrics endpoint and request IDs.",
      },
    ],
  }),
  component: StatusPage,
});

const statusQueryKey = ["status", "ops"] as const;

function StatusPage() {
  const statusQuery = useQuery({
    queryKey: statusQueryKey,
    queryFn: async () => {
      const [ready, ops, metrics] = await Promise.all([
        getReadyHealth(),
        getOpsStatus(),
        getMetricsText(),
      ]);
      return {
        ready: unwrapApiResult(ready),
        ops: unwrapApiResult(ops),
        metrics: unwrapApiResult(metrics),
      };
    },
    refetchInterval: 30_000,
  });

  const data = statusQuery.data;
  const readyCount = data?.ready.dependencies.filter((dependency) => dependency.ok).length ?? 0;

  return (
    <>
      <PageHeader
        title="System Status"
        description="Live health of backend dependencies, metrics endpoint and request IDs."
        actions={
          <>
            <Button size="sm" variant="outline" onClick={() => statusQuery.refetch()}>
              <RefreshCw className="size-4" />
              Refresh
            </Button>
            <Button size="sm" variant="outline" asChild>
              <a href={`${getApiBaseUrl()}/api/docs`} target="_blank" rel="noreferrer">
                <FileText className="size-4" />
                API docs
              </a>
            </Button>
          </>
        }
      />
      <PageBody>
        {statusQuery.isLoading && <LoadingPanel label="Loading system status..." />}
        {statusQuery.isError && (
          <ApiErrorPanel error={statusQuery.error} onRetry={() => statusQuery.refetch()} />
        )}
        {data && (
          <>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <MetricCard
                label="Dependencies"
                value={data.ready.dependencies.length}
                hint={`${readyCount} ready · ${data.ready.dependencies.length - readyCount} not ready`}
              />
              <MetricCard label="API status" value={data.ops.operationalStatus} />
              <MetricCard label="Environment" value={data.ops.environment} />
              <MetricCard label="Request ID" value={data.ready.requestId.slice(0, 8)} />
            </div>

            <Panel title="Dependency status" description={`Checked ${data.ready.checkedAt}`}>
              <table className="w-full text-sm">
                <thead className="text-xs uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Component</th>
                    <th className="px-3 py-2 text-left font-medium">Status</th>
                    <th className="px-3 py-2 text-right font-medium">Latency</th>
                    <th className="px-3 py-2 text-left font-medium">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {data.ready.dependencies.map((dependency) => (
                    <tr key={dependency.name} className="border-t border-border/60">
                      <td className="px-3 py-2 font-medium">{dependency.name}</td>
                      <td className="px-3 py-2">
                        <StatusBadge status={dependency.ok ? "ready" : "not_ready"} />
                      </td>
                      <td className="px-3 py-2 text-right font-mono">{dependency.latencyMs} ms</td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {dependency.error ?? "Healthy"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Panel>

            <div className="grid gap-4 lg:grid-cols-2">
              <Panel
                title="Metrics endpoint"
                description="GET /api/metrics · Prometheus exposition format"
              >
                <pre className="max-h-[420px] overflow-auto rounded-md border border-border bg-surface-2 p-3 font-mono text-xs leading-relaxed">
                  {data.metrics}
                </pre>
              </Panel>
              <Panel title="Runbooks" description="Backend-provided operational documents.">
                <dl className="space-y-2 text-sm">
                  {Object.entries(data.ops.runbooks).map(([key, href]) => (
                    <div key={key} className="flex items-center justify-between gap-3">
                      <dt className="font-medium">{key}</dt>
                      <dd className="font-mono text-xs text-muted-foreground">{href}</dd>
                    </div>
                  ))}
                </dl>
              </Panel>
            </div>
          </>
        )}
      </PageBody>
    </>
  );
}
