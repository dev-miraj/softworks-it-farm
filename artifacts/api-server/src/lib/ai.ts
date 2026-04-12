import OpenAI from "openai";

const apiKey =
  process.env["OPENAI_API_KEY"] ||
  process.env["AI_INTEGRATIONS_OPENAI_API_KEY"];

const baseURL =
  process.env["OPENAI_BASE_URL"] ||
  process.env["AI_INTEGRATIONS_OPENAI_BASE_URL"];

export const openai: OpenAI | null = apiKey
  ? new OpenAI({ apiKey, ...(baseURL ? { baseURL } : {}) })
  : null;

export function isAiEnabled(): boolean {
  return openai !== null;
}
