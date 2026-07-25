"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import api from "@/app/lib/api";

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  registerUser: (data: any) => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Load auth from localStorage on mount
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (loading) return;

    const publicRoutes = ["/login"];
    const isPublicRoute = publicRoutes.includes(pathname);

    if (!token && !isPublicRoute) {
      router.push("/login");
    } else if (token && isPublicRoute) {
      router.push("/");
    }
  }, [token, loading, pathname, router]);

  const login = async (email: string, pass: string) => {
    try {
      const response = await api.post("/auth/login", { email, password: pass });
      const { access_token, user: userData } = response.data;

      localStorage.setItem("token", access_token);
      localStorage.setItem("user", JSON.stringify(userData));

      setToken(access_token);
      setUser(userData);
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    router.push("/login");
  };

  const registerUser = async (data: any) => {
    try {
      const response = await api.post("/auth/register", data);
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, registerUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
