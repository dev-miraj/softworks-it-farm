/**
 * Export utilities — CSV, JSON, basic XLSX-compatible CSV
 */
import type { Response } from "express";

function escapeCsvValue(val: unknown): string {
  if (val === null || val === undefined) return "";
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function toCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(","),
    ...rows.map((row) => headers.map((h) => escapeCsvValue(row[h])).join(",")),
  ];
  return lines.join("\r\n");
}

export function sendCsv(res: Response, rows: Record<string, unknown>[], filename: string): void {
  const csv = toCsv(rows);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}.csv"`);
  res.send("\uFEFF" + csv);
}

export function sendJson(res: Response, data: unknown, filename: string): void {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}.json"`);
  res.json(data);
}

export function paginateArray<T>(
  items: T[],
  page: number,
  limit: number,
): { items: T[]; total: number; pages: number; page: number; limit: number } {
  const total = items.length;
  const pages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  return { items: items.slice(start, start + limit), total, pages, page, limit };
}
