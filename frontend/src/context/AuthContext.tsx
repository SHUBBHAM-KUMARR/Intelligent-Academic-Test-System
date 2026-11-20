import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import axios from "axios";

export interface User {
  id: number;
  name: string;
  email: string;
  role: "student" | "admin" | "educator";
  created_at?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (
    name: string,
    email: string,
    password: string,
    role?: "student" | "admin" | "educator"
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = import.meta.env.VITE_SERVER_URL || "http://127.0.0.1:5000";

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem("iats_user");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem("iats_token") || null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Set up global axios authorization header whenever token changes
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      localStorage.setItem("iats_token", token);
    } else {
      delete axios.defaults.headers.common["Authorization"];
      localStorage.removeItem("iats_token");
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem("iats_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("iats_user");
    }
  }, [user]);

  // Check token validity on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem("iats_token");
      if (storedToken) {
        try {
          const res = await axios.get(`${API_BASE}/api/v1/auth/profile`, {
            headers: { Authorization: `Bearer ${storedToken}` },
            timeout: 4000,
          });
          if (res.data && res.data.user) {
            setUser(res.data.user);
            setToken(storedToken);
          }
        } catch {
          // If token expired or invalid, clear local auth
          logout();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await axios.post(`${API_BASE}/api/v1/auth/login`, {
        email: email.trim().toLowerCase(),
        password,
      });

      const { token: receivedToken, user: receivedUser } = res.data;
      if (receivedToken && receivedUser) {
        setToken(receivedToken);
        setUser(receivedUser);
        return { success: true };
      }
      return { success: false, error: "Unexpected response format from server" };
    } catch (err: unknown) {
      let message = "Invalid email or password";
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        message = err.response.data.error;
      } else if (axios.isAxiosError(err) && err.message) {
        message = err.message;
      }
      return { success: false, error: message };
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    role: "student" | "admin" | "educator" = "student"
  ) => {
    try {
      const endpoint =
        role === "admin" || role === "educator"
          ? `${API_BASE}/api/v1/auth/register/admin`
          : `${API_BASE}/api/v1/auth/register`;

      const payload =
        role === "admin" || role === "educator"
          ? { name: name.trim(), email: email.trim().toLowerCase(), password, role }
          : { name: name.trim(), email: email.trim().toLowerCase(), password };

      const res = await axios.post(endpoint, payload);

      const receivedToken = res.data.token;
      const receivedUser = res.data.user || res.data.admin;

      if (receivedToken && receivedUser) {
        setToken(receivedToken);
        setUser(receivedUser);
        return { success: true };
      }
      return { success: true };
    } catch (err: unknown) {
      let message = "Registration failed";
      if (axios.isAxiosError(err)) {
        if (err.response?.data?.error) {
          message = err.response.data.error;
        } else if (err.response?.data?.errors) {
          const errorMap = err.response.data.errors;
          const firstKey = Object.keys(errorMap)[0];
          message = `${firstKey}: ${errorMap[firstKey][0] || errorMap[firstKey]}`;
        } else if (err.message) {
          message = err.message;
        }
      }
      return { success: false, error: message };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("iats_token");
    localStorage.removeItem("iats_user");
    delete axios.defaults.headers.common["Authorization"];
  };

  const refreshProfile = async () => {
    if (!token) return;
    try {
      const res = await axios.get(`${API_BASE}/api/v1/auth/profile`);
      if (res.data?.user) {
        setUser(res.data.user);
      }
    } catch {
      // ignore
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
