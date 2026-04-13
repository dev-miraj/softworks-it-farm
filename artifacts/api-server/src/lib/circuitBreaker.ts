/**
 * Circuit Breaker — fault-tolerance for DB and external services
 * 
 * States: CLOSED → OPEN → HALF_OPEN → CLOSED
 *   CLOSED    : normal operation, failures tracked
 *   OPEN      : fail-fast, no calls through
 *   HALF_OPEN : probe one call, recover if success
 */
import { logger } from "./logger.js";

type CBState = "CLOSED" | "OPEN" | "HALF_OPEN";

interface CBOptions {
  name: string;
  failureThreshold?: number;
  successThreshold?: number;
  timeout?: number;
}

export class CircuitBreaker {
  private state: CBState = "CLOSED";
  private failures = 0;
  private successes = 0;
  private lastFailureTime = 0;

  private readonly name: string;
  private readonly failureThreshold: number;
  private readonly successThreshold: number;
  private readonly timeout: number;

  constructor(opts: CBOptions) {
    this.name = opts.name;
    this.failureThreshold = opts.failureThreshold ?? 5;
    this.successThreshold = opts.successThreshold ?? 2;
    this.timeout = opts.timeout ?? 30_000;
  }

  async call<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === "OPEN") {
      const elapsed = Date.now() - this.lastFailureTime;
      if (elapsed >= this.timeout) {
        this.state = "HALF_OPEN";
        this.successes = 0;
        logger.info({ name: this.name }, "Circuit breaker: HALF_OPEN probe");
      } else {
        throw new Error(`Circuit breaker OPEN for '${this.name}' — retrying in ${Math.round((this.timeout - elapsed) / 1000)}s`);
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (err) {
      this.onFailure(err);
      throw err;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    if (this.state === "HALF_OPEN") {
      this.successes++;
      if (this.successes >= this.successThreshold) {
        this.state = "CLOSED";
        logger.info({ name: this.name }, "Circuit breaker: CLOSED (recovered)");
      }
    }
  }

  private onFailure(err: unknown): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    if (this.failures >= this.failureThreshold || this.state === "HALF_OPEN") {
      if (this.state !== "OPEN") {
        this.state = "OPEN";
        logger.error({ name: this.name, failures: this.failures, err: String(err) }, "Circuit breaker: OPEN");
      }
    }
  }

  getState(): CBState { return this.state; }
  getFailures(): number { return this.failures; }
  reset(): void { this.state = "CLOSED"; this.failures = 0; this.successes = 0; }
}

export const dbCircuit = new CircuitBreaker({
  name: "database",
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 30_000,
});
