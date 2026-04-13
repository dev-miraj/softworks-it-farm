const RAW = import.meta.env.VITE_API_URL;

let _warned = false;

export function getApiUrl(): string {
  if (RAW) return RAW.replace(/\/$/, "");
  if (!_warned) {
    _warned = true;
    console.error(
      "%c[SOFTWORKS] VITE_API_URL is not set!\n" +
      "All admin API calls will fail. Set VITE_API_URL in your Vercel environment variables " +
      "to the URL of your deployed API server (e.g. https://your-api.railway.app), " +
      "then redeploy the Vercel project.\n" +
      "Local fallback: http://localhost:8080",
      "color:red;font-size:14px;font-weight:bold;"
    );
  }
  if (import.meta.env.DEV) return "http://localhost:8080";
  return "";
}

export const API = getApiUrl();
export const isApiConfigured = !!RAW;
