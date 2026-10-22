import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import AuthLayout from '../../components/auth/AuthLayout';
import VerifyCodeForm from '../../components/auth/VerifyCodeForm';
import PasswordRules from '../../components/auth/PasswordRules';
import PasswordField from '../../components/common/PasswordField';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import { authService } from '../../services/authService';
import { useToast } from '../../context/ToastContext';
import { resetSchema } from '../../utils/validators';
import { apiErrorCode, apiErrorMessage } from '../../utils/errors';
import { clearPending, getPending, setPending } from '../../utils/pending';
import styles from '../../components/auth/authForm.module.css';

function NewPasswordForm({ email, resetToken, onDone, onExpired }) {
  const [formError, setFormError] = useState('');
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(resetSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });
  const onSubmit = async (v) => {
    setFormError('');
    try {
      await authService.resetPassword({ resetToken, password: v.password, confirmPassword: v.confirmPassword });
      onDone();
    } catch (err) {
      if (apiErrorCode(err) === 'INVALID_RESET_TOKEN') onExpired();
      else setFormError(apiErrorMessage(err));
    }
  };
  return (
    <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
      <p className={styles.muted}>Choose a new password for <strong>{email}</strong>.</p>
      {formError && <Alert variant="error">{formError}</Alert>}
      <PasswordField label="New password" autoComplete="new-password" error={errors.password?.message} {...register('password')} />
      <PasswordRules value={watch('password')} />
      <PasswordField label="Confirm new password" autoComplete="new-password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
      <Button type="submit" fullWidth loading={isSubmitting}>Update password</Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const [resetToken, setResetToken] = useState(null); // kept in memory only
  const stored = getPending();
  const email = location.state?.email || (stored?.kind === 'reset' ? stored.email : null);
  if (!email) return <Navigate to="/forgot-password" replace />;
  const sentAt = stored?.email === email ? stored.sentAt : null;

  return (
    <AuthLayout
      title={resetToken ? 'Set a new password' : 'Enter your reset code'}
      subtitle={resetToken ? 'Pick something you haven’t used before.' : 'Check your inbox for the 6-digit code.'}
      pageTitle="Reset password"
    >
      {resetToken ? (
        <NewPasswordForm
          email={email}
          resetToken={resetToken}
          onDone={() => {
            clearPending();
            toast.success('Password updated.');
            navigate('/login', { replace: true, state: { notice: 'reset', email } });
          }}
          onExpired={() => { setResetToken(null); toast.error('That reset session expired. Request a new code.'); navigate('/forgot-password', { replace: true }); }}
        />
      ) : (
        <VerifyCodeForm
          email={email}
          sentAt={sentAt}
          submitLabel="Verify code"
          changeEmail={<Link to="/forgot-password">Use a different email</Link>}
          onSent={(ts) => setPending({ email, sentAt: ts, kind: 'reset' })}
          onResend={() => authService.forgotPassword(email)}
          onVerify={async (code) => {
            const res = await authService.verifyResetOtp({ email, code });
            setResetToken(res.data.resetToken);
          }}
        />
      )}
      <p className={styles.footer}><Link to="/login">Back to log in</Link></p>
    </AuthLayout>
  );
}
