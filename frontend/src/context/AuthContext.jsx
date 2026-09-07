import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import api from "../api";

const AuthContext = createContext(null);


export function AuthProvider({ children }) {

  const [token, setToken] = useState(
    () => localStorage.getItem("token")
  );

  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(
    () => Boolean(localStorage.getItem("token"))
  );


  // Check an existing login session only when
  // the application starts.
  useEffect(() => {

    const existingToken =
      localStorage.getItem("token");

    if (!existingToken) {
      setLoading(false);
      return;
    }


    const loadExistingUser = async () => {

      try {

        const response = await api.get(
          "/auth/me",
          {
            headers: {
              Authorization:
                `Bearer ${existingToken}`,
            },
          }
        );

        setUser(response.data);

      } catch (error) {

        console.error(
          "Session expired or invalid:",
          error
        );

        localStorage.removeItem("token");

        setToken(null);
        setUser(null);

      } finally {

        setLoading(false);

      }
    };


    loadExistingUser();

  }, []);


  // LOGIN
  const login = async (
    email,
    password
  ) => {

    const body =
      new URLSearchParams();

    body.append(
      "username",
      email.trim()
    );

    body.append(
      "password",
      password
    );


    // ONE login request.
    const response = await api.post(
      "/auth/login",
      body,
      {
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded",
        },
      }
    );


    const newToken =
      response.data.access_token;


    localStorage.setItem(
      "token",
      newToken
    );

    setToken(newToken);

    // User is already returned by /login.
    // No extra /auth/me request here.
    setUser(response.data.user);

    setLoading(false);


    return response.data;
  };


  // SIGNUP
  const signup = async (
    payload
  ) => {

    const response = await api.post(
      "/auth/signup",
      payload
    );

    return response.data;
  };


  // LOGOUT
  const logout = () => {

    localStorage.removeItem("token");

    setToken(null);
    setUser(null);

  };


  // Refresh user when required by another page.
  const refreshUser = async () => {

    try {

      const response =
        await api.get("/auth/me");

      setUser(response.data);

      return response.data;

    } catch (error) {

      localStorage.removeItem("token");

      setToken(null);
      setUser(null);

      return null;
    }
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
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}


export const useAuth = () =>
  useContext(AuthContext);