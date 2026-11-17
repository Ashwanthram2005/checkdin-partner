import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { UNAUTHORIZED_EVENT, clearSession, getSession, setSession, type StoredSession } from '../api/client';
import { getProperties, getRoles, type LoginResult, type Property, type Role } from '../api/partner';
import { ROLES } from '../data/roles';

interface Auth {
  session: StoredSession | null;
  role: Role | null;
  property: Property | null;
  can: (permission: string) => boolean;
  signIn: (r: LoginResult, email?: string) => void;
  signOut: () => void;
}

const Ctx = createContext<Auth | null>(null);

const fallbackRole = (id: string): Role | null => {
  const r = (ROLES as Record<string, Role | undefined>)[id];
  return r ? { ...r } : null;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [session, setSess] = useState<StoredSession | null>(getSession);
  const [role, setRole] = useState<Role | null>(null);
  const [property, setProperty] = useState<Property | null>(null);

  const signOut = useCallback(() => {
    clearSession();
    setSess(null); setRole(null); setProperty(null);
    navigate('/', { replace: true });
  }, [navigate]);

  const signIn = useCallback((r: LoginResult, email?: string) => {
    const s: StoredSession = { token: r.token, userId: r.user.id, name: r.user.name, roleId: r.user.role_id, hotelId: r.user.hotel_id, email: email ?? r.user.email };
    setSession(s);
    setSess(s);
  }, []);

  // the server says the login expired
  useEffect(() => {
    const onExpired = () => { setSess(null); setRole(null); setProperty(null); navigate('/login', { replace: true }); };
    window.addEventListener(UNAUTHORIZED_EVENT, onExpired);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onExpired);
  }, [navigate]);

  // load the user's role (what they may do) and property once signed in
  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    setRole(fallbackRole(session.roleId));
    getRoles().then((rs) => { if (!cancelled) setRole(rs.find((r) => r.id === session.roleId) ?? fallbackRole(session.roleId)); }).catch(() => {});
    getProperties().then((ps) => { if (!cancelled) setProperty(ps.find((p) => p.id === session.hotelId) ?? ps[0] ?? null); }).catch(() => {});
    return () => { cancelled = true; };
  }, [session]);

  const can = useCallback((p: string) => !!role && (role.permissions.includes('all') || role.permissions.includes(p)), [role]);

  const value = useMemo(() => ({ session, role, property, can, signIn, signOut }), [session, role, property, can, signIn, signOut]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): Auth {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAuth must be used inside <AuthProvider>');
  return v;
}

/** Wrap a screen that needs a signed-in user. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const loc = useLocation();
  if (!session) return <Navigate to="/login" replace state={{ from: loc.pathname }} />;
  return <>{children}</>;
}
