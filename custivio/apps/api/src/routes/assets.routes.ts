import {
  appendAssetLifecycleForSession,
  AssetError,
  createAssetForSession,
  deleteAssetAttachmentForSession,
  getAssetAttachmentDownloadForSession,
  getAssetDetail,
  listAssetsForSession,
  uploadAssetAttachmentForSession,
  updateAssetForSession,
} from "@custivio/core";

import { sendJson } from "../http/responses";
import {
  readOptionalQueryInteger,
  readOptionalQueryString,
  readRecordBody,
  requireParam,
} from "../http/validation";
import {
  assetAttachmentParamsSchema,
  createdResponse,
  fileResponse,
  idParamsSchema,
  jsonResponse,
  multipartUploadBodySchema,
  optionalSearchQuerySchema,
  recordBodySchema,
  routeSchema,
} from "../openapi/schemas";

import type { FastifyInstance } from "fastify";

const passthroughMultipartValidation = () => () => true;

export function assetsRoutes(app: FastifyInstance): void {
  app.get(
    "/api/assets",
    {
      schema: routeSchema({
        tags: ["assets"],
        summary: "List assets visible to the current session.",
        querystring: optionalSearchQuerySchema,
        response: jsonResponse("GenericObjectResponse"),
      }),
    },
    async (request, reply) => {
      const search = readOptionalQueryString(request.query, "q");
      const limit = readOptionalQueryInteger(request.query, "limit");
      const offset = readOptionalQueryInteger(request.query, "offset");
      const result = await listAssetsForSession(request.sessionToken, {
        ...(search ? { search } : {}),
        ...(limit !== undefined ? { limit } : {}),
        ...(offset !== undefined ? { offset } : {}),
      });

      return sendJson(reply, request.requestId, result);
    },
  );

  app.post(
    "/api/assets",
    {
      schema: routeSchema({
        tags: ["assets"],
        summary: "Create an asset.",
        body: recordBodySchema,
        response: createdResponse("GenericObjectResponse"),
      }),
    },
    async (request, reply) => {
      const asset = await createAssetForSession(
        request.sessionToken,
        readRecordBody(request.body),
        request.requestId,
      );

      return sendJson(reply, request.requestId, { asset }, 201);
    },
  );

  app.get(
    "/api/assets/:id",
    {
      schema: routeSchema({
        tags: ["assets"],
        summary: "Get asset detail.",
        params: idParamsSchema,
        response: jsonResponse("GenericObjectResponse"),
      }),
    },
    async (request, reply) => {
      const id = requireParam(request.params, "id");
      const detail = await getAssetDetail(request.sessionToken, id);

      return sendJson(reply, request.requestId, { detail });
    },
  );

  app.patch(
    "/api/assets/:id",
    {
      schema: routeSchema({
        tags: ["assets"],
        summary: "Update an asset.",
        params: idParamsSchema,
        body: recordBodySchema,
        response: jsonResponse("GenericObjectResponse"),
      }),
    },
    async (request, reply) => {
      const id = requireParam(request.params, "id");
      const asset = await updateAssetForSession(
        request.sessionToken,
        id,
        readRecordBody(request.body),
        request.requestId,
      );

      return sendJson(reply, request.requestId, { asset });
    },
  );

  app.post(
    "/api/assets/:id/lifecycle",
    {
      schema: routeSchema({
        tags: ["assets"],
        summary: "Append a lifecycle event to an asset.",
        params: idParamsSchema,
        body: recordBodySchema,
        response: createdResponse("GenericObjectResponse"),
      }),
    },
    async (request, reply) => {
      const id = requireParam(request.params, "id");
      const event = await appendAssetLifecycleForSession(
        request.sessionToken,
        id,
        readRecordBody(request.body),
        request.requestId,
      );

      return sendJson(reply, request.requestId, { event }, 201);
    },
  );

  app.post(
    "/api/assets/:id/attachments",
    {
      schema: routeSchema({
        tags: ["assets"],
        summary: "Upload an attachment for an asset.",
        params: idParamsSchema,
        body: multipartUploadBodySchema,
        response: createdResponse("GenericObjectResponse"),
      }),
      // The multipart parser owns file validation for this route; AJV sees the
      // raw stream body and rejects valid FormData before request.file() runs.
      validatorCompiler: passthroughMultipartValidation,
    },
    async (request, reply) => {
      const id = requireParam(request.params, "id");
      let file: Awaited<ReturnType<typeof request.file>>;

      try {
        file = await request.file();
      } catch {
        throw new AssetError("invalid_asset_input", "Attachment file is required.", 400);
      }

      if (!file) {
        throw new AssetError("invalid_asset_input", "Attachment file is required.", 400);
      }

      if (file.fieldname !== "file") {
        throw new AssetError(
          "invalid_asset_input",
          "Attachment file field must be named file.",
          400,
        );
      }

      const attachment = await uploadAssetAttachmentForSession(
        request.sessionToken,
        id,
        {
          filename: file.filename,
          contentType: file.mimetype || "application/octet-stream",
          body: new Uint8Array(await file.toBuffer()),
        },
        request.requestId,
      );

      return sendJson(reply, request.requestId, { attachment }, 201);
    },
  );

  app.get(
    "/api/assets/:id/attachments/:attachmentId/download",
    {
      schema: routeSchema({
        tags: ["assets"],
        summary: "Download an authorized asset attachment through the API.",
        params: assetAttachmentParamsSchema,
        response: fileResponse("Binary asset attachment stream."),
      }),
    },
    async (request, reply) => {
      const id = requireParam(request.params, "id");
      const attachmentId = requireParam(request.params, "attachmentId");
      const download = await getAssetAttachmentDownloadForSession(
        request.sessionToken,
        id,
        attachmentId,
        request.requestId,
      );

      return reply
        .status(200)
        .header("x-request-id", request.requestId)
        .type(download.attachment.contentType)
        .header("content-disposition", download.contentDisposition)
        .header(
          "content-length",
          String(
            download.attachment.contentLength ??
              download.object.contentLength ??
              download.object.body.byteLength,
          ),
        )
        .send(Buffer.from(download.object.body));
    },
  );

  app.delete(
    "/api/assets/:id/attachments/:attachmentId",
    {
      schema: routeSchema({
        tags: ["assets"],
        summary: "Soft-delete an asset attachment.",
        params: assetAttachmentParamsSchema,
        response: jsonResponse("GenericObjectResponse"),
      }),
    },
    async (request, reply) => {
      const id = requireParam(request.params, "id");
      const attachmentId = requireParam(request.params, "attachmentId");
      const attachment = await deleteAssetAttachmentForSession(
        request.sessionToken,
        id,
        attachmentId,
        request.requestId,
      );

      return sendJson(reply, request.requestId, { attachment });
    },
  );
}
