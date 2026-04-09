// Export the raw Express app — Vercel Lambda calls it directly as (req, res)
// Avoids serverless-http v4 which doesn't resolve its Promise on Vercel's response objects
import app from "./app";

export default app;
