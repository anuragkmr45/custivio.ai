import { getEnv } from "@custivio/config";
import { collectDefaultMetrics, Counter, Histogram, Registry } from "prom-client";

const registry = new Registry();
const metricsPrefix = getEnv().METRICS_PREFIX;

function metricName(name: string): string {
  return `${metricsPrefix}${name}`;
}

collectDefaultMetrics({
  prefix: metricsPrefix,
  register: registry,
});

const apiRequestsTotal = new Counter({
  name: metricName("api_requests_total"),
  help: "Total Fastify API requests by method, route, and status code.",
  labelNames: ["method", "route", "status"] as const,
  registers: [registry],
});

const apiRequestDurationSeconds = new Histogram({
  name: metricName("api_request_duration_seconds"),
  help: "Fastify API request duration in seconds by method, route, and status code.",
  labelNames: ["method", "route", "status"] as const,
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [registry],
});

const authLoginAttemptsTotal = new Counter({
  name: metricName("auth_login_attempts_total"),
  help: "Authentication login attempts grouped by result.",
  labelNames: ["result"] as const,
  registers: [registry],
});

const assetMutationsTotal = new Counter({
  name: metricName("asset_mutations_total"),
  help: "Asset registry mutations grouped by action.",
  labelNames: ["action"] as const,
  registers: [registry],
});

const stockMovementsTotal = new Counter({
  name: metricName("stock_movements_total"),
  help: "Stock movements grouped by movement type.",
  labelNames: ["movement_type"] as const,
  registers: [registry],
});

const importJobsTotal = new Counter({
  name: metricName("import_jobs_total"),
  help: "Import jobs grouped by status.",
  labelNames: ["status"] as const,
  registers: [registry],
});

const exportJobsTotal = new Counter({
  name: metricName("export_jobs_total"),
  help: "Export jobs grouped by status.",
  labelNames: ["status"] as const,
  registers: [registry],
});

const fileOperationsTotal = new Counter({
  name: metricName("file_operations_total"),
  help: "File operations grouped by operation and result.",
  labelNames: ["operation", "result"] as const,
  registers: [registry],
});

const workerJobsTotal = new Counter({
  name: metricName("worker_jobs_total"),
  help: "Worker jobs grouped by queue, type, and terminal status.",
  labelNames: ["queue", "type", "status"] as const,
  registers: [registry],
});

const workerJobDurationSeconds = new Histogram({
  name: metricName("worker_job_duration_seconds"),
  help: "Worker job processing duration in seconds by queue, type, and terminal status.",
  labelNames: ["queue", "type", "status"] as const,
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 15, 30, 60],
  registers: [registry],
});

const dependencyFailuresTotal = new Counter({
  name: metricName("dependency_failures_total"),
  help: "Dependency readiness failures grouped by dependency name.",
  labelNames: ["dependency"] as const,
  registers: [registry],
});

function initializeDomainMetricLabels(): void {
  for (const result of ["attempt", "success", "failure"] as const) {
    authLoginAttemptsTotal.labels(result).inc(0);
  }

  for (const action of ["create", "update", "delete"] as const) {
    assetMutationsTotal.labels(action).inc(0);
  }

  for (const movementType of ["receive", "issue", "transfer", "adjust"] as const) {
    stockMovementsTotal.labels(movementType).inc(0);
  }

  for (const status of ["pending", "processing", "completed", "failed", "dead_letter"] as const) {
    importJobsTotal.labels(status).inc(0);
    exportJobsTotal.labels(status).inc(0);
  }

  for (const operation of ["upload", "download", "delete", "export_download"] as const) {
    for (const result of ["success", "failure"] as const) {
      fileOperationsTotal.labels(operation, result).inc(0);
    }
  }

  for (const dependency of ["postgres", "valkey", "minio"] as const) {
    dependencyFailuresTotal.labels(dependency).inc(0);
  }
}

initializeDomainMetricLabels();

export function recordApiRequest(input: {
  durationMs: number;
  method: string;
  route: string;
  statusCode: number;
}): void {
  const method = input.method.toUpperCase();
  const status = String(input.statusCode);

  apiRequestsTotal.labels(method, input.route, status).inc();
  apiRequestDurationSeconds.labels(method, input.route, status).observe(input.durationMs / 1000);
}

export function recordAuthLoginAttempt(result: "attempt" | "failure" | "success"): void {
  authLoginAttemptsTotal.labels(result).inc();
}

export function recordAssetMutation(action: "create" | "delete" | "update"): void {
  assetMutationsTotal.labels(action).inc();
}

export function recordStockMovement(
  movementType: "adjust" | "issue" | "receive" | "transfer",
): void {
  stockMovementsTotal.labels(movementType).inc();
}

export function recordImportJob(
  status: "completed" | "dead_letter" | "failed" | "pending" | "processing",
): void {
  importJobsTotal.labels(status).inc();
}

export function recordExportJob(
  status: "completed" | "dead_letter" | "failed" | "pending" | "processing",
): void {
  exportJobsTotal.labels(status).inc();
}

export function recordFileOperation(
  operation: "delete" | "download" | "export_download" | "upload",
  result: "failure" | "success",
): void {
  fileOperationsTotal.labels(operation, result).inc();
}

export function recordWorkerJob(input: {
  durationMs: number;
  queue: string;
  status: "completed" | "dead_letter" | "locked" | "retry";
  type: string;
}): void {
  workerJobsTotal.labels(input.queue, input.type, input.status).inc();
  workerJobDurationSeconds
    .labels(input.queue, input.type, input.status)
    .observe(input.durationMs / 1000);
}

export function recordDependencyFailure(dependency: "minio" | "postgres" | "valkey"): void {
  dependencyFailuresTotal.labels(dependency).inc();
}

export function getMetricsContentType(): string {
  return registry.contentType;
}

export async function renderMetrics(): Promise<string> {
  return registry.metrics();
}

export { registry as metricsRegistry };
