import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";
import { useLocation } from "wouter";
import { API } from "@/lib/apiUrl";

interface AdminUser {
  username: string;
  role: string;
}

interface AdminAuthContextType {
  isAuthenticated: boolean;
  user: AdminUser | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  csrfFetch: (path: string, options?: RequestInit) => Promise<Response>;
  changePassword: (currentPassword: string, newPassword: string) => { ok: boolean; message: string };
}

const AdminAuthContext = createContext<AdminAuthContextType>({
  isAuthenticated: false,
  user: null,
  isLoading: true,
  login: async () => ({ ok: false }),
  logout: async () => {},
  csrfFetch: async () => new Response(null, { status: 500 }),
  changePassword: () => ({ ok: false, message: "Not initialized" }),
});

function baseFetch(path: string, options?: RequestInit, csrfToken?: string) {
  const extraHeaders: Record<string, string> = {};
  if (csrfToken) extraHeaders["x-csrf-token"] = csrfToken;
  return fetch(`${API}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
      ...extraHeaders,
    },
  });
}

async function fetchCsrfToken(): Promise<string | null> {
  try {
    const res = await baseFetch("/api/auth/csrf");
    if (res.ok) {
      const data = await res.json();
      return data.csrfToken ?? null;
    }
  } catch {}
  return null;
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const csrfRef = useRef<string | null>(null);

  const getCsrf = useCallback(async (): Promise<string | null> => {
    if (csrfRef.current) return csrfRef.current;
    const token = await fetchCsrfToken();
    csrfRef.current = token;
    return token;
  }, []);

  const csrfFetch = useCallback(
    async (path: string, options?: RequestInit): Promise<Response> => {
      const csrf = await getCsrf();
      const res = await baseFetch(path, options, csrf ?? undefined);
      if (res.status === 403) {
        const body = await res.clone().json().catch(() => ({}));
        if ((body as any)?.error?.includes("CSRF")) {
          csrfRef.current = null;
          const newCsrf = await fetchCsrfToken();
          csrfRef.current = newCsrf;
          return baseFetch(path, options, newCsrf ?? undefined);
        }
      }
      return res;
    },
    [getCsrf],
  );

  const tryRefresh = useCallback(async (): Promise<boolean> => {
    try {
      const res = await baseFetch("/api/auth/refresh", { method: "POST" });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.csrfToken) csrfRef.current = data.csrfToken;
        return true;
      }
    } catch {}
    return false;
  }, []);

  const checkSession = useCallback(async () => {
    try {
      let res = await baseFetch("/api/auth/me", undefined, csrfRef.current ?? undefined);

      if (res.status === 401) {
        const refreshed = await tryRefresh();
        if (refreshed) {
          res = await baseFetch("/api/auth/me", undefined, csrfRef.current ?? undefined);
        }
      }

      if (res.ok) {
        const data = await res.json();
        setUser({ username: data.username, role: data.role });
        if (!csrfRef.current) {
          const token = await fetchCsrfToken();
          csrfRef.current = token;
        }
      } else {
        setUser(null);
        csrfRef.current = null;
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [tryRefresh]);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const login = async (username: string, password: string): Promise<{ ok: boolean; error?: string }> => {
    try {
      const res = await baseFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setUser({ username: data.username, role: data.role });
        if (data.csrfToken) csrfRef.current = data.csrfToken;
        return { ok: true };
      }

      return { ok: false, error: data.error || "Invalid credentials" };
    } catch {
      return { ok: false, error: "Network error. Please try again." };
    }
  };

  const logout = async () => {
    try {
      await csrfFetch("/api/auth/logout", { method: "POST" });
    } catch {}
    setUser(null);
    csrfRef.current = null;
  };

  return (
    <AdminAuthContext.Provider
      value={{
        isAuthenticated: !!user,
        user,
        isLoading,
        login,
        logout,
        csrfFetch,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}

export function RequireAdminAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAdminAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/admin/login");
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050510] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-zinc-500 text-sm">Verifying session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;
  return <>{children}</>;
}
