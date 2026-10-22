import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import AuthLayout from '../../components/auth/AuthLayout';
import VerifyCodeForm from '../../components/auth/VerifyCodeForm';
import { authService } from '../../services/authService';
import { useToast } from '../../context/ToastContext';
import { clearPending, getPending, setPending } from '../../utils/pending';

export default function VerifyEmailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const stored = getPending();
  const email = location.state?.email || (stored?.kind === 'user' ? stored.email : null);
  if (!email) return <Navigate to="/signup" replace />;
  const sentAt = stored?.email === email ? stored.sentAt : null;

  return (
    <AuthLayout title="Verify your email" subtitle="Enter the code to finish creating your account." pageTitle="Verify email">
      <VerifyCodeForm
        email={email}
        sentAt={sentAt}
        autoResend={Boolean(location.state?.autoResend)}
        submitLabel="Verify email"
        changeEmail={<Link to="/signup">Use a different email</Link>}
        onSent={(ts) => setPending({ email, sentAt: ts, kind: 'user' })}
        onResend={() => authService.resendVerification(email)}
        onVerify={async (code) => {
          await authService.verifyEmail({ email, code });
          clearPending();
          toast.success('Email verified.');
          navigate('/login', { replace: true, state: { notice: 'verified', email } });
        }}
      />
    </AuthLayout>
  );
}
