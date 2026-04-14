import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import client, { setAuthToken } from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const t = localStorage.getItem("sat_token");
    if (!t) {
      setTeacher(null);
      setLoading(false);
      return;
    }
    setAuthToken(t);
    try {
      const { data } = await client.get("/auth/me");
      setTeacher(data.teacher);
    } catch {
      setAuthToken(null);
      setTeacher(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async (email, password) => {
    const { data } = await client.post("/auth/login", { email, password });
    if (!data?.token || !data?.teacher) {
      throw new Error("Invalid response from server");
    }
    setAuthToken(data.token);
    setTeacher(data.teacher);
    return data;
  }, []);

  const register = useCallback(async (payload) => {
    const { data } = await client.post("/auth/register", payload);
    if (!data?.token || !data?.teacher) {
      throw new Error("Invalid response from server");
    }
    setAuthToken(data.token);
    setTeacher(data.teacher);
    return data;
  }, []);

  const logout = useCallback(() => {
    setAuthToken(null);
    setTeacher(null);
  }, []);

  const value = useMemo(
    () => ({
      teacher,
      loading,
      login,
      register,
      logout,
      refresh,
      isAdmin: teacher?.role === "admin",
    }),
    [teacher, loading, login, register, logout, refresh]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth outside provider");
  return ctx;
}
