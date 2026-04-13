import "dotenv/config";
import { validateEnv } from "./lib/env.js";
import { logger } from "./lib/logger.js";
import { startWorker, stopWorker } from "./lib/queue.js";
import { setupGracefulShutdown } from "./lib/gracefulShutdown.js";
import { getPool } from "./lib/db.js";

const config = validateEnv();

import app from "./app.js";

const server = app.listen(config.PORT, (err?: Error) => {
  if (err) {
    logger.error({ err }, "Error starting server");
    process.exit(1);
  }
  logger.info({ port: config.PORT, env: config.NODE_ENV }, "Server listening");

  if (config.NODE_ENV !== "test") {
    startWorker();
  }
});

server.keepAliveTimeout    = 65_000;
server.headersTimeout      = 66_000;
server.requestTimeout      = 30_000;

setupGracefulShutdown({
  server,
  onCleanup: async () => {
    stopWorker();
    logger.info("Job queue worker stopped");
    try {
      await getPool().end();
      logger.info("DB connection pool closed");
    } catch (err) {
      logger.error({ err }, "Error closing DB pool");
    }
  },
});
