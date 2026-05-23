import { buildApiUrl } from "./endpoint";
import { toApiError } from "./errors";
import type { ApiRequestOptions, ApiResult, QueryValue } from "./types";

const defaultRequestTimeoutMs = 20_000;

export async function apiRequest<T>(
  options: ApiRequestOptions<unknown, Record<string, QueryValue>, Record<string, string | number>>,
): Promise<ApiResult<T>> {
  const headers = new Headers(options.headers);
  const expectsJson = options.expect === undefined || options.expect === "json";

  if (expectsJson && !headers.has("accept")) {
    headers.set("accept", "application/json");
  }

  if (options.idempotencyKey && !headers.has("idempotency-key")) {
    headers.set("idempotency-key", options.idempotencyKey);
  }

  let body: BodyInit | undefined;
  if (options.body !== undefined && options.body !== null) {
    if (options.body instanceof FormData) {
      body = options.body;
    } else if (typeof options.body === "string" || options.body instanceof Blob) {
      body = options.body;
    } else {
      body = JSON.stringify(options.body);
      if (!headers.has("content-type")) {
        headers.set("content-type", "application/json");
      }
    }
  }

  const url = buildApiUrl({
    path: options.path,
    pathParams: options.pathParams,
    query: options.query,
  });

  let response: Response;
  const requestSignal = createRequestSignal(options.signal, options.timeoutMs);
  try {
    response = await fetch(url, {
      method: options.method,
      credentials: "include",
      headers,
      body,
      signal: requestSignal.signal,
    });
  } catch (error) {
    const origin = getUrlOrigin(url);
    return {
      ok: false,
      status: 0,
      code: requestSignal.didTimeout()
        ? "request_timeout"
        : isAbortError(error)
          ? "request_aborted"
          : "network_error",
      message: requestSignal.didTimeout()
        ? "The backend API did not respond in time. Check the connection and try again."
        : isAbortError(error)
          ? "The request was cancelled."
          : `The backend API is unavailable at ${origin}. Start the API server and try again.`,
      raw: error,
    };
  } finally {
    requestSignal.cleanup();
  }

  const requestId = response.headers.get("x-request-id") ?? undefined;

  if (!response.ok) {
    return toApiError<T>(response, requestId);
  }

  const data = await readSuccessBody<T>(response, options.expect);
  return { ok: true, data, requestId };
}

function isAbortError(error: unknown): boolean {
  return (
    error instanceof DOMException && (error.name === "AbortError" || error.name === "TimeoutError")
  );
}

function createRequestSignal(
  inputSignal: AbortSignal | undefined,
  timeoutMs = defaultRequestTimeoutMs,
) {
  if (!inputSignal && timeoutMs <= 0) {
    return {
      signal: undefined,
      cleanup: () => undefined,
      didTimeout: () => false,
    };
  }

  if (inputSignal && timeoutMs <= 0) {
    return {
      signal: inputSignal,
      cleanup: () => undefined,
      didTimeout: () => false,
    };
  }

  const controller = new AbortController();
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  let timedOut = false;

  const abortFromInput = () => controller.abort(inputSignal?.reason);

  if (inputSignal) {
    if (inputSignal.aborted) {
      abortFromInput();
    } else {
      inputSignal.addEventListener("abort", abortFromInput, { once: true });
    }
  }

  if (timeoutMs > 0) {
    timeoutId = setTimeout(() => {
      timedOut = true;
      controller.abort(new DOMException("The request timed out.", "TimeoutError"));
    }, timeoutMs);
  }

  return {
    signal: controller.signal,
    cleanup: () => {
      if (timeoutId) clearTimeout(timeoutId);
      inputSignal?.removeEventListener("abort", abortFromInput);
    },
    didTimeout: () => timedOut,
  };
}

function getUrlOrigin(url: string): string {
  try {
    return new URL(url).origin;
  } catch {
    return "the configured address";
  }
}

async function readSuccessBody<T>(
  response: Response,
  expect: ApiRequestOptions["expect"] = "json",
): Promise<T> {
  if (response.status === 204) return undefined as T;
  if (expect === "text") return (await response.text()) as T;
  if (expect === "blob") return (await response.blob()) as T;
  if (expect === "stream") return response.body as T;
  return (await response.json()) as T;
}
