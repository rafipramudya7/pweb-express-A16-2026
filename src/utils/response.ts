import { Response } from "express";

// Format JSON standar seluruh endpoint:
//   sukses : { status: true, message, data, metadata? }
//   gagal  : { status: false, message }

export interface Metadata {
  currentPage?: number;
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
  // Disesuaikan menjadi boolean true sesuai spesifikasi PDF halaman 7
  const body: Record<string, unknown> = { status: true, message, data };
  if (metadata) body.metadata = metadata;
  return res.status(status).json(body);
}

export function fail(res: Response, statusCode: number, message: string): Response {
  // Disesuaikan menjadi boolean false sesuai spesifikasi PDF halaman 7
  return res.status(statusCode).json({ status: false, message });
}
