export type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

export type ApiResult<T> =
  | { ok: true; data: T; requestId?: string }
  | {
      ok: false;
      status: number;
      code: string;
      message: string;
      requestId?: string;
      retryAfterSeconds?: number;
      raw?: unknown;
    };

export type QueryPrimitive = string | number | boolean | null | undefined;
export type QueryValue = QueryPrimitive | QueryPrimitive[];

export type PageInfo = {
  total: number;
  limit: number;
  offset: number;
  hasNextPage?: boolean;
};

export type ApiRequestOptions<
  TBody = unknown,
  TQuery extends Record<string, QueryValue> = Record<string, QueryValue>,
  TPath extends Record<string, string | number> = Record<string, string | number>,
> = {
  method: HttpMethod;
  path: string;
  pathParams?: TPath;
  query?: TQuery;
  body?: TBody;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  timeoutMs?: number;
  idempotencyKey?: string;
  expect?: "json" | "text" | "blob" | "stream";
};

export type ApiErrorEnvelope = {
  error?: {
    code?: string;
    message?: string;
    requestId?: string;
  };
};

export type AuthenticatedSession = {
  tenant: {
    id: string;
    slug: string;
    name: string;
    status: string;
  };
  user: {
    id: string;
    email: string;
    displayName: string;
    status: string;
  };
  permissionKeys: string[];
  expiresAt: string;
};

export type SessionEnvelope = {
  session: AuthenticatedSession;
};
