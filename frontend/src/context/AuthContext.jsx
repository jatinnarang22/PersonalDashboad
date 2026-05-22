import { createContext, useCallback, useContext, useState } from 'react';
import { authApi } from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [profileComplete, setProfileComplete] = useState(false);

  const refreshAuth = useCallback(async () => {
    try {
      const { data } = await authApi.me();
      setCurrentUser(data.user ?? null);
      setProfileComplete(data.profileComplete === true);
    } catch {
      setCurrentUser(null);
      setProfileComplete(false);
    }
  }, []);

  const logoutAndClear = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      /* ignore */
    }
    setCurrentUser(null);
    setProfileComplete(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{ currentUser, profileComplete, refreshAuth, logoutAndClear }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
