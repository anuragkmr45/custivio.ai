import { isAuthError } from "@custivio/auth";
import {
  isAssetError,
  isCatalogError,
  isLocationError,
  isOperationsError,
  isReportingError,
  isStockError,
} from "@custivio/core";
import { logger } from "@custivio/telemetry";

import { isHttpApiError } from "./errors";

import type { FastifyReply } from "fastify";

export interface ErrorBody {
  error: {
    code: string;
    message: string;
    requestId: string;
  };
}

function sendKnownError(
  reply: FastifyReply,
  requestId: string,
  code: string,
  message: string,
  status: number,
): FastifyReply {
  return reply
    .status(status)
    .header("x-request-id", requestId)
    .send({
      error: {
        code,
        message,
        requestId,
      },
    } satisfies ErrorBody);
}

function getValidationMessage(error: unknown): string | null {
  if (!(error instanceof Error) || typeof error !== "object") {
    return null;
  }

  const candidate = error as Error & { statusCode?: unknown; validation?: unknown };

  if (candidate.statusCode !== 400 || !Array.isArray(candidate.validation)) {
    return null;
  }

  return candidate.message || "Request validation failed.";
}

export function sendErrorResponse(
  reply: FastifyReply,
  error: unknown,
  requestId: string,
): FastifyReply {
  const validationMessage = getValidationMessage(error);

  if (validationMessage) {
    return sendKnownError(reply, requestId, "invalid_request", validationMessage, 400);
  }

  if (
    isAuthError(error) ||
    isCatalogError(error) ||
    isLocationError(error) ||
    isAssetError(error) ||
    isStockError(error) ||
    isOperationsError(error) ||
    isReportingError(error) ||
    isHttpApiError(error)
  ) {
    return sendKnownError(reply, requestId, error.code, error.message, error.status);
  }

  logger.error("Unhandled API error", {
    requestId,
    errorCode: "internal_error",
    context: { error: error instanceof Error ? error.message : "unknown" },
  });

  return sendKnownError(reply, requestId, "internal_error", "Unexpected server error.", 500);
}

export function sendJson(
  reply: FastifyReply,
  requestId: string,
  body: unknown,
  status = 200,
): FastifyReply {
  return reply.status(status).header("x-request-id", requestId).send(body);
}
