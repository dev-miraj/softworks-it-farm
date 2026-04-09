import app from "./app";

// Vercel serverless: export Express app directly
// Express implements the same (req, res) => void interface that Vercel expects
export default app;
