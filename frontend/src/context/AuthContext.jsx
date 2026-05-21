import { createContext, useContext, useState, useCallback } from 'react';
import api from '../api/index';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('voxstore_token'));
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('voxstore_user')); } catch { return null; }
  });

  const _persist = (data) => {
    localStorage.setItem('voxstore_token', data.token);
    localStorage.setItem('voxstore_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
  };

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    _persist(data);
    return data;
  }, []);

  const signup = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/signup', { email, password });
    _persist(data);
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('voxstore_token');
    localStorage.removeItem('voxstore_user');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
