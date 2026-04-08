import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useLocation } from "wouter";

const ADMIN_USER = "admin";
const ADMIN_PASS = "Softworks@2024";
const STORAGE_KEY = "sw_admin_auth";

interface AdminAuthContextType {
  isAuthenticated: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType>({
  isAuthenticated: false,
  login: () => false,
  logout: () => {},
});

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) === "true";
  });

  const login = (username: string, password: string): boolean => {
    if (username === ADMIN_USER && password === ADMIN_PASS) {
      setIsAuthenticated(true);
      localStorage.setItem(STORAGE_KEY, "true");
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AdminAuthContext.Provider value={{ isAuthenticated, login, logout }}>
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

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/admin/login");
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) return null;
  return <>{children}</>;
}
