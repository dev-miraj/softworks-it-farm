import "dotenv/config";
import { validateEnv } from "./lib/env.js";
import { logger } from "./lib/logger.js";

const config = validateEnv();

import app from "./app.js";

app.listen(config.PORT, (err?: Error) => {
  if (err) {
    logger.error({ err }, "Error starting server");
    process.exit(1);
  }
  logger.info({ port: config.PORT, env: config.NODE_ENV }, "Server listening");
});
