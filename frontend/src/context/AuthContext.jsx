import React, { createContext, useContext, useEffect, useState } from "react";
import api from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));

  const loadUser = async () => {
    try {
      const response = await api.get("/auth/me");
      setUser(response.data);
      return response.data;
    } catch (error) {
      localStorage.removeItem("token");
      setToken(null);
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    const body = new URLSearchParams();

    body.append("username", email);
    body.append("password", password);

    const response = await api.post("/auth/login", body, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    const newToken = response.data.access_token;

    localStorage.setItem("token", newToken);
    setToken(newToken);

    // Load user details including role
    const userResponse = await api.get("/auth/me", {
      headers: {
        Authorization: `Bearer ${newToken}`,
      },
    });

    setUser(userResponse.data);

    return {
      ...response.data,
      user: userResponse.data,
    };
  };

  const signup = async (payload) => {
    const response = await api.post("/auth/signup", payload);
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        login,
        signup,
        logout,
        refreshUser: loadUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);