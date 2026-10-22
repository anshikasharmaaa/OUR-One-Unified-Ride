import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/common/Spinner';
import UnauthorizedPage from '../pages/common/UnauthorizedPage';
import { homeFor, safeRedirect } from './paths';
import styles from './guards.module.css';

export const FullPageLoader = () => (
  <div className={styles.center}><Spinner label="Restoring your session" /></div>
);

/** Client-side guard. The server enforces the same rules on every API call — this only decides what to render. */
export function RequireRole({ role }) {
  const { status, user } = useAuth();
  const location = useLocation();
  if (status === 'loading') return <FullPageLoader />;
  if (status !== 'authenticated') {
    const loginPath = role === 'ADMIN' ? '/admin/login' : '/login';
    return <Navigate to={loginPath} replace state={{ from: location }} />;
  }
  if (user.role !== role) return <UnauthorizedPage />;
  return <Outlet />;
}

/** Login/signup-style pages: signed-in people are sent to their own home (or where they were headed). */
export function PublicOnly() {
  const { status, user } = useAuth();
  const location = useLocation();
  if (status === 'loading') return <FullPageLoader />;
  if (status === 'authenticated') return <Navigate to={safeRedirect(location.state?.from, user.role)} replace />;
  return <Outlet />;
}

export const RootRedirect = () => {
  const { status, user } = useAuth();
  if (status === 'loading') return <FullPageLoader />;
  return <Navigate to={status === 'authenticated' ? homeFor(user.role) : '/login'} replace />;
};