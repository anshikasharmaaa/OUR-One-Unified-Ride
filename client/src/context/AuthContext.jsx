import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authService } from '../services/authService';
import { tokenStore } from '../services/http';
import { useToast } from './ToastContext';

export const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const toast = useToast();
  const [state, setState] = useState({ status: 'loading', user: null });

  // Restore the session on page load from the HttpOnly refresh cookie (no token is ever kept in localStorage).
  useEffect(() => {
    let alive = true;
    authService
      .restore()
      .then((s) => alive && setState({ status: 'authenticated', user: s.user }))
      .catch(() => alive && setState({ status: 'unauthenticated', user: null }));
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    const onExpired = () => {
      tokenStore.set(null);
      setState((s) => {
        if (s.status === 'authenticated') toast?.info('Your session expired. Please sign in again.');
        return { status: 'unauthenticated', user: null };
      });
    };
    window.addEventListener('our:session-expired', onExpired);
    return () => window.removeEventListener('our:session-expired', onExpired);
  }, [toast]);

  const signIn = useCallback((session) => {
    tokenStore.set(session.accessToken);
    setState({ status: 'authenticated', user: session.user });
  }, []);

  const signOut = useCallback(async () => {
    try { await authService.logout(); } catch { /* the cookie is cleared server-side when reachable; local state is cleared regardless */ }
    tokenStore.set(null);
    setState({ status: 'unauthenticated', user: null });
  }, []);

  // Keeps display fields (e.g. the name in the navbar) in step after a profile edit. Never touches the role or tokens.
  const updateUser = useCallback((patch) => {
    setState((s) => (s.user ? { ...s, user: { ...s.user, ...patch } } : s));
  }, []);

  const value = useMemo(() => ({ ...state, signIn, signOut, updateUser }), [state, signIn, signOut, updateUser]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}