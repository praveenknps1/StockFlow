import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { api } from "./api.js";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!localStorage.getItem("sf_token"));

  useEffect(() => {
    if (!localStorage.getItem("sf_token")) return;
    api("/auth/me")
      .then((d) => setUser(d.user))
      .catch(() => localStorage.removeItem("sf_token"))
      .finally(() => setLoading(false));
  }, []);

  const finish = useCallback((d) => {
    localStorage.setItem("sf_token", d.token);
    setUser(d.user);
  }, []);

  const login = async (email, password) =>
    finish(
      await api("/auth/login", { method: "POST", body: { email, password } }),
    );
  const signup = async (payload) =>
    finish(await api("/auth/signup", { method: "POST", body: payload }));
  const logout = () => {
    localStorage.removeItem("sf_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
