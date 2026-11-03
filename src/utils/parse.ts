import { HttpError } from "./http-error";

export interface Pagination {
  page: number;
  limit: number;
  skip: number;
  take: number;
}
export function parsePagination(
  query: Record<string, unknown>,
  defaultLimit = 10,
  maxLimit = 100,
): Pagination {
  const pageRaw = Number(query.page ?? 1);
  const limitRaw = Number(query.limit ?? defaultLimit);

  const page = Number.isInteger(pageRaw) && pageRaw > 0 ? pageRaw : 1;
  const limit =
    Number.isInteger(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, maxLimit) : defaultLimit;

  return { page, limit, skip: (page - 1) * limit, take: limit };
}
export function parseId(value: string): number | null {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}
