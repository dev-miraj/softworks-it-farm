import { createContext, useContext, useState, ReactNode } from "react";
import { useLocation } from "wouter";

const STORAGE_KEY = "sw_admin_auth";
const PASS_KEY = "sw_admin_pass";
const DEFAULT_USER = "admin";
const DEFAULT_PASS = "Softworks@2024";

interface AdminAuthContextType {
  isAuthenticated: boolean;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  changePassword: (current: string, next: string) => boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType>({
  isAuthenticated: false,
  login: () => false,
  logout: () => {},
  changePassword: () => false,
});

function getStoredPass() {
  return localStorage.getItem(PASS_KEY) || DEFAULT_PASS;
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) === "true";
  });

  const login = (username: string, password: string): boolean => {
    if (username === DEFAULT_USER && password === getStoredPass()) {
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

  const changePassword = (current: string, next: string): boolean => {
    if (current !== getStoredPass()) return false;
    localStorage.setItem(PASS_KEY, next);
    return true;
  };

  return (
    <AdminAuthContext.Provider value={{ isAuthenticated, login, logout, changePassword }}>
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
