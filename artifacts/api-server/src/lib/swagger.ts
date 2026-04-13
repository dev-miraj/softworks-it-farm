/**
 * Swagger / OpenAPI 3.0 spec — auto-generated documentation
 * Available at: /api/docs
 */
export const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "SOFTWORKS IT FARM API",
    version: "2.0.0",
    description: "Enterprise-grade REST API with JWT auth, RBAC, subscriptions, and multi-tenant support",
    contact: { name: "SOFTWORKS IT FARM", url: "https://softworksit.vercel.app" },
  },
  servers: [
    { url: "/api", description: "API base path" },
  ],
  components: {
    securitySchemes: {
      cookieAuth: { type: "apiKey", in: "cookie", name: "sw_access_token" },
      csrfHeader: { type: "apiKey", in: "header", name: "X-CSRF-Token" },
    },
    schemas: {
      Success: {
        type: "object",
        properties: {
          success: { type: "boolean", example: true },
          data: { type: "object" },
          meta: { type: "object" },
        },
      },
      Error: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          error: { type: "string" },
          details: { type: "object" },
        },
      },
    },
  },
  paths: {
    "/health": {
      get: {
        tags: ["System"],
        summary: "Health check",
        responses: { "200": { description: "Server is healthy" } },
      },
    },
    "/ready": {
      get: {
        tags: ["System"],
        summary: "Readiness check (includes DB connectivity)",
        responses: {
          "200": { description: "Server is ready" },
          "503": { description: "Server not ready" },
        },
      },
    },
    "/metrics": {
      get: {
        tags: ["System"],
        summary: "Prometheus metrics (admin only)",
        security: [{ cookieAuth: [], csrfHeader: [] }],
        responses: { "200": { description: "Prometheus text format metrics" } },
      },
    },
    "/events": {
      get: {
        tags: ["System"],
        summary: "Server-Sent Events stream for real-time dashboard",
        security: [{ cookieAuth: [] }],
        responses: { "200": { description: "SSE stream" } },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Authentication"],
        summary: "Login",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["username", "password"],
                properties: {
                  username: { type: "string" },
                  password: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Login successful — sets httpOnly cookies + returns CSRF token" },
          "401": { description: "Invalid credentials" },
          "429": { description: "Account locked (too many failed attempts)" },
        },
      },
    },
    "/auth/refresh": {
      post: {
        tags: ["Authentication"],
        summary: "Refresh access token (rotates refresh token)",
        responses: {
          "200": { description: "New access token issued" },
          "401": { description: "Invalid or expired refresh token" },
        },
      },
    },
    "/auth/logout": {
      post: {
        tags: ["Authentication"],
        summary: "Logout (clears cookies, deletes session from DB)",
        security: [{ cookieAuth: [], csrfHeader: [] }],
        responses: { "200": { description: "Logged out" } },
      },
    },
    "/auth/logout-all": {
      post: {
        tags: ["Authentication"],
        summary: "Logout from all devices",
        security: [{ cookieAuth: [], csrfHeader: [] }],
        responses: { "200": { description: "All sessions cleared" } },
      },
    },
    "/auth/sessions": {
      get: {
        tags: ["Authentication"],
        summary: "List active sessions/devices",
        security: [{ cookieAuth: [] }],
        responses: { "200": { description: "Active sessions list" } },
      },
    },
    "/auth/me": {
      get: {
        tags: ["Authentication"],
        summary: "Get current user info",
        security: [{ cookieAuth: [] }],
        responses: { "200": { description: "Current user" } },
      },
    },
    "/audit-logs": {
      get: {
        tags: ["Audit"],
        summary: "Get audit logs (admin only)",
        security: [{ cookieAuth: [] }],
        parameters: [
          { name: "limit", in: "query", schema: { type: "integer", default: 50 } },
          { name: "offset", in: "query", schema: { type: "integer", default: 0 } },
          { name: "username", in: "query", schema: { type: "string" } },
        ],
        responses: { "200": { description: "Audit log entries" } },
      },
    },
    "/subscriptions/me": {
      get: {
        tags: ["Subscriptions"],
        summary: "Get current user subscription + plan limits",
        security: [{ cookieAuth: [] }],
        responses: { "200": { description: "Subscription info" } },
      },
    },
    "/subscriptions": {
      post: {
        tags: ["Subscriptions"],
        summary: "Assign subscription plan (admin only)",
        security: [{ cookieAuth: [], csrfHeader: [] }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["username", "plan"],
                properties: {
                  username: { type: "string" },
                  plan: { type: "string", enum: ["free", "pro", "enterprise"] },
                  periodDays: { type: "integer", default: 30 },
                },
              },
            },
          },
        },
        responses: { "200": { description: "Subscription updated" } },
      },
    },
    "/feature-flags": {
      get: {
        tags: ["Feature Flags"],
        summary: "List all feature flags (admin only)",
        security: [{ cookieAuth: [] }],
        responses: { "200": { description: "Feature flags list" } },
      },
      post: {
        tags: ["Feature Flags"],
        summary: "Create or update a feature flag",
        security: [{ cookieAuth: [], csrfHeader: [] }],
        responses: { "200": { description: "Flag saved" } },
      },
    },
    "/feature-flags/{key}/toggle": {
      patch: {
        tags: ["Feature Flags"],
        summary: "Toggle feature flag on/off",
        security: [{ cookieAuth: [], csrfHeader: [] }],
        parameters: [{ name: "key", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Flag toggled" } },
      },
    },
    "/queue/stats": {
      get: {
        tags: ["Job Queue"],
        summary: "Get background job queue statistics",
        security: [{ cookieAuth: [] }],
        responses: { "200": { description: "Queue stats" } },
      },
    },
    "/tenants": {
      get: {
        tags: ["Tenants"],
        summary: "List all tenants (admin only)",
        security: [{ cookieAuth: [] }],
        responses: { "200": { description: "Tenants list" } },
      },
    },
  },
};
