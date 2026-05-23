import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getEnv } from "@custivio/config";

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

export async function putObject(
  objectKey: string,
  body: Uint8Array,
  contentType: string,
): Promise<void> {
  const env = getEnv();
  const client = createMinioClient();

  try {
    await client.send(
      new PutObjectCommand({
        Bucket: env.MINIO_BUCKET,
        Key: objectKey,
        Body: body,
        ContentType: contentType,
      }),
    );
  } finally {
    client.destroy();
  }
}

export interface StoredObject {
  body: Uint8Array;
  contentType: string;
  contentLength?: number;
}

export async function getObject(objectKey: string): Promise<StoredObject> {
  const env = getEnv();
  const client = createMinioClient();

  try {
    const response = await client.send(
      new GetObjectCommand({
        Bucket: env.MINIO_BUCKET,
        Key: objectKey,
      }),
    );

    const body = await response.Body?.transformToByteArray();

    if (!body) {
      throw new Error("Object body is empty.");
    }

    return {
      body,
      contentType: response.ContentType ?? "application/octet-stream",
      ...(typeof response.ContentLength === "number"
        ? { contentLength: response.ContentLength }
        : {}),
    };
  } finally {
    client.destroy();
  }
}

export async function deleteObject(objectKey: string): Promise<void> {
  const env = getEnv();
  const client = createMinioClient();

  try {
    await client.send(
      new DeleteObjectCommand({
        Bucket: env.MINIO_BUCKET,
        Key: objectKey,
      }),
    );
  } finally {
    client.destroy();
  }
}
