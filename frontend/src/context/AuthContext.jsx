import { createContext, useCallback, useContext, useMemo, useState } from "react";
import api from "../api/client";

const AuthContext = createContext(null);

function loadStoredUser() {
  try {
    const raw = localStorage.getItem("vr_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadStoredUser);
  const [pendingEmail, setPendingEmail] = useState(null);

  const login = useCallback(async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    if (res.mfaRequired) {
      setPendingEmail(email);
      return { mfaRequired: true };
    }
    applySession(res);
    return { mfaRequired: false };
  }, []);

  const verifyOtp = useCallback(
    async (otp) => {
      const res = await api.post("/auth/verify-otp", { email: pendingEmail, otp });
      applySession(res);
      setPendingEmail(null);
      return res;
    },
    [pendingEmail]
  );

  function applySession(res) {
    const sessionUser = {
      userId: res.userId,
      fullName: res.fullName,
      email: res.email,
      role: res.role,
      permissions: res.permissions || [],
    };
    localStorage.setItem("vr_token", res.token);
    localStorage.setItem("vr_user", JSON.stringify(sessionUser));
    setUser(sessionUser);
  }

  const logout = useCallback(() => {
    localStorage.removeItem("vr_token");
    localStorage.removeItem("vr_user");
    setUser(null);
  }, []);

  const hasPermission = useCallback(
    (code) => {
      if (!user) return false;
      if (user.role === "SYSTEM_ADMIN") return true;
      return (user.permissions || []).includes(code);
    },
    [user]
  );

  const hasAnyPermission = useCallback(
    (codes = []) => {
      if (!user) return false;
      if (user.role === "SYSTEM_ADMIN") return true;
      return codes.some((c) => (user.permissions || []).includes(c));
    },
    [user]
  );

  const value = useMemo(
    () => ({ user, login, verifyOtp, logout, hasPermission, hasAnyPermission, pendingEmail }),
    [user, login, verifyOtp, logout, hasPermission, hasAnyPermission, pendingEmail]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
