import { createContext, useContext, useMemo, useState } from 'react';
import { api } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(null);

  async function login(email, password) {
    const data = await api('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    setToken(data.token);
    localStorage.setItem('token', data.token);
    setUser(data.user);
  }

  function logout() {
    setToken('');
    setUser(null);
    localStorage.removeItem('token');
  }

  const value = useMemo(() => ({ token, user, setUser, login, logout }), [token, user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
