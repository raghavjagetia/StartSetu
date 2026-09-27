import { createContext, useContext, useEffect, useState } from "react";
import client from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("startsetu_user");
    return raw ? JSON.parse(raw) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("startsetu_token");
    if (!token) {
      setLoading(false);
      return;
    }
    client
      .get("/api/auth/me")
      .then((res) => {
        setUser(res.data);
        localStorage.setItem("startsetu_user", JSON.stringify(res.data));
      })
      .catch(() => {
        localStorage.removeItem("startsetu_token");
        localStorage.removeItem("startsetu_user");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  function login(token, userData) {
    localStorage.setItem("startsetu_token", token);
    localStorage.setItem("startsetu_user", JSON.stringify(userData));
    setUser(userData);
  }

  function logout() {
    localStorage.removeItem("startsetu_token");
    localStorage.removeItem("startsetu_user");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
