import { randomUUID } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";

export interface ApiErrorBody {
  statusCode: number;
  error: string;
  message: string;
  requestId?: string;
  timestamp?: string;
  path?: string;
}

interface RequestContext {
  allowedOrigins: string[];
  origin?: string;
  requestId: string;
  startedAt: number;
}

const responseContexts = new WeakMap<ServerResponse, RequestContext>();

export function prepareRequest(
  request: IncomingMessage,
  response: ServerResponse,
  options: { allowedOrigins?: string[] } = {}
) {
  const incomingRequestId = request.headers["x-request-id"];
  const requestId = Array.isArray(incomingRequestId)
    ? incomingRequestId[0]
    : incomingRequestId || randomUUID();
  const context: RequestContext = {
    allowedOrigins: options.allowedOrigins ?? ["*"],
    origin: Array.isArray(request.headers.origin) ? request.headers.origin[0] : request.headers.origin,
    requestId,
    startedAt: Date.now()
  };

  responseContexts.set(response, context);
  return context;
}

export function getRequestContext(response: ServerResponse) {
  return responseContexts.get(response);
}

export function json(response: ServerResponse, statusCode: number, body: unknown) {
  const context = responseContexts.get(response);
  response.writeHead(statusCode, {
    ...getCorsHeaders(response, context),
    "Access-Control-Allow-Headers": "authorization, content-type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Content-Type": "application/json",
    "Cross-Origin-Resource-Policy": "same-site",
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    ...(context ? { "X-Request-Id": context.requestId } : {})
  });
  response.end(JSON.stringify(body, null, 2));
}

export function serverError(path: string, requestId?: string): ApiErrorBody {
  return {
    statusCode: 500,
    error: "InternalServerError",
    message: "An unexpected API error occurred",
    requestId,
    timestamp: new Date().toISOString(),
    path
  };
}

export function notFound(path: string, requestId?: string): ApiErrorBody {
  return {
    statusCode: 404,
    error: "NotFound",
    message: "Route not found",
    requestId,
    timestamp: new Date().toISOString(),
    path
  };
}

export async function readBody(request: IncomingMessage) {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  if (!chunks.length) return {};

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
  } catch {
    return {};
  }
}

function getCorsHeaders(response: ServerResponse, context?: RequestContext) {
  const origin = context?.origin;
  const allowedOrigins = context?.allowedOrigins?.length ? context.allowedOrigins : ["*"];

  if (allowedOrigins.includes("*")) {
    return { "Access-Control-Allow-Origin": "*" };
  }

  if (origin && allowedOrigins.includes(origin)) {
    return {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Credentials": "true"
    };
  }

  return {};
}
