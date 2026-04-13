import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useLocation } from "wouter";
import { API } from "@/lib/apiUrl";

const STORAGE_KEY = "sw_admin_auth";
const TOKEN_KEY = "sw_admin_token";

interface AdminAuthContextType {
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  changePassword: (current: string, next: string) => boolean;
  token: string | null;
}

const AdminAuthContext = createContext<AdminAuthContextType>({
  isAuthenticated: false,
  login: async () => false,
  logout: async () => {},
  changePassword: () => false,
  token: null,
});

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return (
      localStorage.getItem(STORAGE_KEY) === "true" ||
      !!localStorage.getItem(TOKEN_KEY)
    );
  });
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(TOKEN_KEY)
  );

  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (stored && !token) {
      setToken(stored);
      setIsAuthenticated(true);
    }
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.token) {
          localStorage.setItem(TOKEN_KEY, data.token);
          localStorage.setItem(STORAGE_KEY, "true");
          setToken(data.token);
          setIsAuthenticated(true);
          return true;
        }
      }
      return false;
    } catch {
      return false;
    }
  };

  const logout = async () => {
    try {
      await fetch(`${API}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch {
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setIsAuthenticated(false);
  };

  const changePassword = (_current: string, _next: string): boolean => {
    return false;
  };

  return (
    <AdminAuthContext.Provider value={{ isAuthenticated, login, logout, changePassword, token }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}

export function RequireAdminAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAdminAuth();
  const [, navigate] = useLocation();

  if (!isAuthenticated) {
    navigate("/admin/login");
    return null;
  }
  return <>{children}</>;
}
