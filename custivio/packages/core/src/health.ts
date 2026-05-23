import { checkValkeyHealth } from "@custivio/cache";
import { checkPostgresHealth } from "@custivio/db";
import { checkMinioHealth } from "@custivio/storage";
import { recordDependencyFailure } from "@custivio/telemetry";

export type DependencyName = "postgres" | "valkey" | "minio";

export interface ReadinessDependencyStatus {
  name: DependencyName;
  ok: boolean;
  latencyMs: number;
  error?: string;
}

export interface ReadinessStatus {
  status: "ready" | "not_ready";
  dependencies: ReadinessDependencyStatus[];
  checkedAt: string;
}

export function getReadinessHttpStatus(readiness: ReadinessStatus): 200 | 503 {
  return readiness.status === "ready" ? 200 : 503;
}

export async function getReadinessStatus(): Promise<ReadinessStatus> {
  const [postgres, valkey, minio] = await Promise.all([
    checkPostgresHealth(),
    checkValkeyHealth(),
    checkMinioHealth(),
  ]);

  const dependencies: ReadinessDependencyStatus[] = [
    { name: "postgres", ...postgres },
    { name: "valkey", ...valkey },
    { name: "minio", ...minio },
  ];

  for (const dependency of dependencies) {
    if (!dependency.ok) {
      recordDependencyFailure(dependency.name);
    }
  }

  return {
    status: dependencies.every((dependency) => dependency.ok) ? "ready" : "not_ready",
    dependencies,
    checkedAt: new Date().toISOString(),
  };
}
