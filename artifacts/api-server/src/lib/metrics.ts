/**
 * Lightweight in-process metrics — Prometheus-compatible text format
 * No external dependency required. Scrape at /api/metrics
 */

interface Counter {
  type: "counter";
  value: number;
  labels: Record<string, string>;
}

interface Histogram {
  type: "histogram";
  buckets: Map<number, number>;
  sum: number;
  count: number;
  labels: Record<string, string>;
}

type Metric = Counter | Histogram;

class MetricsRegistry {
  private counters = new Map<string, Map<string, Counter>>();
  private histograms = new Map<string, Map<string, Histogram>>();
  private startTime = Date.now();

  inc(name: string, labels: Record<string, string> = {}, value = 1): void {
    const key = JSON.stringify(labels);
    if (!this.counters.has(name)) this.counters.set(name, new Map());
    const group = this.counters.get(name)!;
    const existing = group.get(key);
    if (existing) {
      existing.value += value;
    } else {
      group.set(key, { type: "counter", value, labels });
    }
  }

  observe(name: string, value: number, labels: Record<string, string> = {}): void {
    const key = JSON.stringify(labels);
    if (!this.histograms.has(name)) this.histograms.set(name, new Map());
    const group = this.histograms.get(name)!;

    let h = group.get(key);
    if (!h) {
      h = {
        type: "histogram",
        buckets: new Map([[5, 0], [10, 0], [25, 0], [50, 0], [100, 0], [250, 0], [500, 0], [1000, 0], [Infinity, 0]]),
        sum: 0,
        count: 0,
        labels,
      };
      group.set(key, h);
    }

    h.sum += value;
    h.count++;
    for (const [le] of h.buckets) {
      if (value <= le) h.buckets.set(le, (h.buckets.get(le) ?? 0) + 1);
    }
  }

  toPrometheus(): string {
    const lines: string[] = [
      `# HELP process_uptime_seconds Server uptime in seconds`,
      `# TYPE process_uptime_seconds gauge`,
      `process_uptime_seconds ${(Date.now() - this.startTime) / 1000}`,
      ``,
      `# HELP process_memory_bytes Heap memory usage`,
      `# TYPE process_memory_bytes gauge`,
      `process_memory_bytes ${process.memoryUsage().heapUsed}`,
    ];

    for (const [name, group] of this.counters) {
      lines.push(`\n# HELP ${name} Counter`, `# TYPE ${name} counter`);
      for (const [, c] of group) {
        const labelStr = Object.entries(c.labels).map(([k, v]) => `${k}="${v}"`).join(",");
        lines.push(`${name}{${labelStr}} ${c.value}`);
      }
    }

    for (const [name, group] of this.histograms) {
      lines.push(`\n# HELP ${name} Histogram`, `# TYPE ${name} histogram`);
      for (const [, h] of group) {
        const labelStr = Object.entries(h.labels).map(([k, v]) => `${k}="${v}"`).join(",");
        const base = labelStr ? `{${labelStr},` : `{`;
        for (const [le, count] of h.buckets) {
          lines.push(`${name}_bucket${base}le="${le === Infinity ? '+Inf' : le}"} ${count}`);
        }
        lines.push(`${name}_sum${labelStr ? `{${labelStr}}` : ``} ${h.sum}`);
        lines.push(`${name}_count${labelStr ? `{${labelStr}}` : ``} ${h.count}`);
      }
    }

    return lines.join("\n");
  }
}

export const metrics = new MetricsRegistry();

import type { Request, Response, NextFunction } from "express";

export function metricsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  res.on("finish", () => {
    const ms = Date.now() - start;
    const route = req.route?.path || req.path.split("/").slice(0, 4).join("/");
    metrics.inc("http_requests_total", { method: req.method, route, status: String(res.statusCode) });
    metrics.observe("http_request_duration_ms", ms, { method: req.method, route });
    if (res.statusCode >= 400) {
      metrics.inc("http_errors_total", { method: req.method, route, status: String(res.statusCode) });
    }
  });
  next();
}
