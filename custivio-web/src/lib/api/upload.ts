import { apiRequest } from "./client";
import type { ApiResult } from "./types";

export function uploadFile<T>(input: {
  path: string;
  pathParams?: Record<string, string | number>;
  file: File | Blob;
  filename?: string;
  fieldName?: string;
  signal?: AbortSignal;
}): Promise<ApiResult<T>> {
  const form = new FormData();
  form.append(input.fieldName ?? "file", input.file, input.filename);

  return apiRequest<T>({
    method: "POST",
    path: input.path,
    pathParams: input.pathParams,
    body: form,
    signal: input.signal,
  });
}
