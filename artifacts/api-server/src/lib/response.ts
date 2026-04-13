/**
 * Standardized API response helpers
 * All API responses follow: { success, data?, error?, meta? }
 */
import type { Response } from "express";

interface Meta {
  page?: number;
  limit?: number;
  total?: number;
  [key: string]: unknown;
}

export function ok<T>(res: Response, data: T, meta?: Meta, status = 200) {
  return res.status(status).json({
    success: true,
    data,
    ...(meta ? { meta } : {}),
  });
}

export function created<T>(res: Response, data: T) {
  return ok(res, data, undefined, 201);
}

export function noContent(res: Response) {
  return res.status(204).end();
}

export function fail(res: Response, error: string, status = 400, details?: unknown) {
  return res.status(status).json({
    success: false,
    error,
    ...(details ? { details } : {}),
  });
}

export function unauthorized(res: Response, error = "Authentication required") {
  return fail(res, error, 401);
}

export function forbidden(res: Response, error = "Permission denied") {
  return fail(res, error, 403);
}

export function notFound(res: Response, resource = "Resource") {
  return fail(res, `${resource} not found`, 404);
}

export function serverError(res: Response, error = "Internal server error") {
  return fail(res, error, 500);
}

export function paginated<T>(
  res: Response,
  items: T[],
  total: number,
  page: number,
  limit: number,
) {
  return ok(res, items, { total, page, limit, pages: Math.ceil(total / limit) });
}
