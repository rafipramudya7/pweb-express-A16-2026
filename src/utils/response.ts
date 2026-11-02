import { Response } from "express";

// Format JSON standar seluruh endpoint:
//   sukses : { status: "success", message, data, metadata? }
//   gagal  : { status: "error", message, data: null }

export interface Metadata {
  page?: number;
  limit?: number;
  totalItems?: number;
  totalPages?: number;
  [key: string]: unknown;
}

export function success(
  res: Response,
  options: {
    status?: number;
    message: string;
    data?: unknown;
    metadata?: Metadata;
  },
): Response {
  const { status = 200, message, data = null, metadata } = options;
  const body: Record<string, unknown> = { status: "success", message, data };
  if (metadata) body.metadata = metadata;
  return res.status(status).json(body);
}

export function fail(
  res: Response,
  statusCode: number,
  message: string,
  data: unknown = null,
): Response {
  return res.status(statusCode).json({ status: "error", message, data });
}
