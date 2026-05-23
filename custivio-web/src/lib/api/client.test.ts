import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiRequest } from "./client";
import { applyPathParams, buildApiUrl } from "./endpoint";

const originalFetch = globalThis.fetch;

beforeEach(() => {
  vi.stubEnv("VITE_API_BASE_URL", "http://localhost:3000");
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("API endpoint helpers", () => {
  it("builds URLs with path params and query params", () => {
    const url = buildApiUrl({
      baseUrl: "http://api.test",
      path: "/api/assets/{id}",
      pathParams: { id: "asset 1" },
      query: { q: "UAT-LAP-001", page: 1, empty: undefined, active: true },
    });

    expect(url).toBe("http://api.test/api/assets/asset%201?q=UAT-LAP-001&page=1&active=true");
  });

  it("supports colon path params", () => {
    expect(applyPathParams("/api/assets/:id", { id: "a/b" })).toBe("/api/assets/a%2Fb");
  });
});

describe("apiRequest", () => {
  it("returns JSON success and captures request ID", async () => {
    const fetchMock = mockFetch(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json", "x-request-id": "req-1" },
      }),
    );

    const result = await apiRequest<{ ok: boolean }>({ method: "GET", path: "/api/health/live" });

    expect(result).toEqual({ ok: true, data: { ok: true }, requestId: "req-1" });
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/api/health/live",
      expect.objectContaining({
        credentials: "include",
        headers: expect.any(Headers),
        method: "GET",
      }),
    );
    expect(getRequestHeaders(fetchMock).get("accept")).toBe("application/json");
  });

  it.each([
    [400, "invalid_input"],
    [401, "unauthenticated"],
    [403, "forbidden"],
    [409, "conflict"],
    [500, "server_error"],
  ])("parses %i JSON error responses", async (status, fallbackCode) => {
    mockFetch(
      new Response(
        JSON.stringify({
          error: { code: fallbackCode, message: "Request failed.", requestId: "req-error" },
        }),
        {
          status,
          headers: { "content-type": "application/json" },
        },
      ),
    );

    const result = await apiRequest({ method: "POST", path: "/api/example", body: { name: "x" } });

    expect(result).toMatchObject({
      ok: false,
      status,
      code: fallbackCode,
      message: "Request failed.",
      requestId: "req-error",
    });
  });

  it("captures retry-after for rate limits", async () => {
    mockFetch(
      new Response(JSON.stringify({ error: { code: "rate_limited", message: "Try later." } }), {
        status: 429,
        headers: { "content-type": "application/json", "retry-after": "30" },
      }),
    );

    const result = await apiRequest({ method: "POST", path: "/api/auth/login", body: {} });

    expect(result).toMatchObject({
      ok: false,
      status: 429,
      code: "rate_limited",
      retryAfterSeconds: 30,
    });
  });

  it("returns a typed network error when fetch cannot reach the API", async () => {
    globalThis.fetch = vi.fn(async () => {
      throw new TypeError("fetch failed");
    }) as unknown as typeof fetch;

    const result = await apiRequest({ method: "GET", path: "/api/auth/me" });

    expect(result).toMatchObject({
      ok: false,
      status: 0,
      code: "network_error",
      message:
        "The backend API is unavailable at http://localhost:3000. Start the API server and try again.",
    });
  });

  it("sends JSON bodies with content-type", async () => {
    const fetchMock = mockFetch(new Response(JSON.stringify({ ok: true }), { status: 200 }));

    await apiRequest({ method: "POST", path: "/api/assets", body: { name: "Laptop" } });

    const init = getRequestInit(fetchMock);
    expect((init.headers as Headers).get("content-type")).toBe("application/json");
    expect(init.body).toBe(JSON.stringify({ name: "Laptop" }));
  });

  it("does not set content-type for FormData", async () => {
    const fetchMock = mockFetch(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    const form = new FormData();
    form.append("file", new Blob(["demo"], { type: "text/plain" }), "demo.txt");

    await apiRequest({
      method: "POST",
      path: "/api/assets/{id}/attachments",
      pathParams: { id: "1" },
      body: form,
    });

    const init = getRequestInit(fetchMock);
    expect((init.headers as Headers).get("content-type")).toBeNull();
    expect(init.body).toBe(form);
  });

  it("returns blob downloads", async () => {
    mockFetch(new Response(new Blob(["file"]), { status: 200 }));

    const result = await apiRequest<Blob>({
      method: "GET",
      path: "/api/assets/{id}/attachments/{attachmentId}/download",
      pathParams: { id: "asset-1", attachmentId: "att-1" },
      expect: "blob",
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(await result.data.text()).toBe("file");
    }
  });

  it("passes abort signals and idempotency keys", async () => {
    const fetchMock = mockFetch(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    const controller = new AbortController();

    await apiRequest({
      method: "POST",
      path: "/api/stock/movements",
      body: { quantity: 1 },
      signal: controller.signal,
      timeoutMs: 0,
      idempotencyKey: "stock-1",
    });

    const init = getRequestInit(fetchMock);
    expect(init.signal).toBe(controller.signal);
    expect((init.headers as Headers).get("idempotency-key")).toBe("stock-1");
  });

  it("returns a typed timeout error for slow requests", async () => {
    vi.useFakeTimers();
    globalThis.fetch = vi.fn(
      async (_input: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            reject(new DOMException("The request timed out.", "TimeoutError"));
          });
        }),
    ) as unknown as typeof fetch;

    const resultPromise = apiRequest({
      method: "GET",
      path: "/api/assets",
      timeoutMs: 5,
    });

    await vi.advanceTimersByTimeAsync(5);
    const result = await resultPromise;
    vi.useRealTimers();

    expect(result).toMatchObject({
      ok: false,
      status: 0,
      code: "request_timeout",
      message: "The backend API did not respond in time. Check the connection and try again.",
    });
  });
});

type FetchMock = ReturnType<typeof vi.fn> & {
  mock: { calls: Array<[RequestInfo | URL, RequestInit?]> };
};

function mockFetch(response: Response): FetchMock {
  const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => response);
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock as FetchMock;
}

function getRequestInit(fetchMock: FetchMock): RequestInit {
  const init = fetchMock.mock.calls[0]?.[1];
  if (!init) throw new Error("Expected fetch init.");
  return init;
}

function getRequestHeaders(fetchMock: FetchMock): Headers {
  const headers = getRequestInit(fetchMock).headers;
  if (!(headers instanceof Headers)) throw new Error("Expected Headers instance.");
  return headers;
}
