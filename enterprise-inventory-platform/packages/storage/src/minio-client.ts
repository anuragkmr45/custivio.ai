import { HeadBucketCommand, S3Client } from "@aws-sdk/client-s3";
import { getEnv } from "@enterprise-inventory/config";

export interface StorageHealth {
  ok: boolean;
  latencyMs: number;
  error?: string;
}

export function createMinioClient(): S3Client {
  const env = getEnv();

  return new S3Client({
    endpoint: env.MINIO_ENDPOINT,
    region: env.MINIO_REGION,
    forcePathStyle: true,
    credentials: {
      accessKeyId: env.MINIO_ACCESS_KEY,
      secretAccessKey: env.MINIO_SECRET_KEY,
    },
  });
}

export async function checkMinioHealth(): Promise<StorageHealth> {
  const startedAt = performance.now();
  const env = getEnv();
  const client = createMinioClient();

  try {
    await client.send(new HeadBucketCommand({ Bucket: env.MINIO_BUCKET }));

    return {
      ok: true,
      latencyMs: Math.round(performance.now() - startedAt),
    };
  } catch (error) {
    return {
      ok: false,
      latencyMs: Math.round(performance.now() - startedAt),
      error: error instanceof Error ? error.message : "Unknown MinIO error",
    };
  } finally {
    client.destroy();
  }
}
