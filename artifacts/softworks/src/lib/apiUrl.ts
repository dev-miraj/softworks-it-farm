const RAW = import.meta.env.VITE_API_URL;

export function getApiUrl(): string {
  if (RAW) return RAW.replace(/\/$/, "");
  if (import.meta.env.DEV) return "http://localhost:8080";
  return "";
}

export const API = getApiUrl();

export function isApiUrl(url: string): boolean {
  return url.startsWith("http") || url.startsWith("/");
}
