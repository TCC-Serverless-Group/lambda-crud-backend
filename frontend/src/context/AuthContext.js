import React, { createContext, useEffect, useState, useContext } from "react";
import authentication from '../SupabaseAuth';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState("");

  useEffect(() => {
    const { data, error } = authentication.getSession()
    return () => {
        setUser(data.session.user)
        setToken(data.session.access_token)
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}