import { Link } from 'react-router-dom';
import AuthLayout from '../../components/auth/AuthLayout';
import { useAuth } from '../../context/AuthContext';
import { homeFor } from '../../routes/paths';

export default function UnauthorizedPage() {
  const { user } = useAuth();
  return (
    <AuthLayout title="You don’t have access to this page" subtitle="Your account doesn’t have permission to view it.">
      <Link to={user ? homeFor(user.role) : '/login'}>Back to your home page</Link>
    </AuthLayout>
  );
}
