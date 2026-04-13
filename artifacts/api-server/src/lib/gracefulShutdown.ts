/**
 * Graceful Shutdown — drain active connections before exiting
 * Handles SIGTERM (Docker stop), SIGINT (Ctrl+C), uncaught exceptions
 */
import type { Server } from "node:http";
import { logger } from "./logger.js";

const SHUTDOWN_TIMEOUT_MS = 10_000;

interface ShutdownOptions {
  server: Server;
  onCleanup?: () => Promise<void>;
}

export function setupGracefulShutdown({ server, onCleanup }: ShutdownOptions): void {
  let isShuttingDown = false;

  async function shutdown(signal: string): Promise<void> {
    if (isShuttingDown) return;
    isShuttingDown = true;

    logger.info({ signal }, "Graceful shutdown initiated");

    const timer = setTimeout(() => {
      logger.error("Shutdown timeout — forcing exit");
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);

    timer.unref();

    try {
      await new Promise<void>((resolve, reject) => {
        server.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      logger.info("HTTP server closed");

      if (onCleanup) {
        await onCleanup();
        logger.info("Cleanup complete");
      }

      clearTimeout(timer);
      logger.info("Graceful shutdown complete");
      process.exit(0);
    } catch (err) {
      logger.error({ err }, "Error during shutdown");
      clearTimeout(timer);
      process.exit(1);
    }
  }

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT",  () => shutdown("SIGINT"));

  process.on("uncaughtException", (err) => {
    logger.error({ err }, "Uncaught exception");
    shutdown("uncaughtException");
  });

  process.on("unhandledRejection", (reason) => {
    logger.error({ reason: String(reason) }, "Unhandled promise rejection");
  });

  logger.info("Graceful shutdown handler registered");
}
