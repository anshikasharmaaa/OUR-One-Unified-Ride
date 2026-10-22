import { Link } from 'react-router-dom';
import AuthLayout from '../../components/auth/AuthLayout';
import { useAuth } from '../../context/AuthContext';
import { homeFor } from '../../routes/paths';

export default function NotFoundPage() {
  const { status, user } = useAuth();
  const to = status === 'authenticated' ? homeFor(user.role) : '/login';
  return (
    <AuthLayout title="Page not found" subtitle="The page you’re looking for doesn’t exist or has moved.">
      <Link to={to}>{status === 'authenticated' ? 'Go to your home page' : 'Go to log in'}</Link>
    </AuthLayout>
  );
}
