import { getEnv } from "@enterprise-inventory/config";
import { collectDefaultMetrics, Registry } from "prom-client";

const registry = new Registry();

collectDefaultMetrics({
  prefix: getEnv().METRICS_PREFIX,
  register: registry,
});

export function getMetricsContentType(): string {
  return registry.contentType;
}

export async function renderMetrics(): Promise<string> {
  return registry.metrics();
}

export { registry as metricsRegistry };
