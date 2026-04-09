// ESM entry point for Vercel serverless function
// This re-exports the pre-built Express bundle (serverless.mjs)
// The bundle is included via `includeFiles` in vercel.json
export { default } from "../artifacts/api-server/dist/serverless.mjs";
