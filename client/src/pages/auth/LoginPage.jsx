import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import AuthLayout from '../../components/auth/AuthLayout';
import GoogleButton from '../../components/auth/GoogleButton';
import TextField from '../../components/common/TextField';
import PasswordField from '../../components/common/PasswordField';
import Checkbox from '../../components/common/Checkbox';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import { authService } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import useGoogleSignIn from '../../hooks/useGoogleSignIn';
import { loginSchema } from '../../utils/validators';
import { apiErrorCode, apiErrorMessage } from '../../utils/errors';
import { setPending } from '../../utils/pending';
import { safeRedirect } from '../../routes/paths';
import styles from '../../components/auth/authForm.module.css';

const NOTICES = {
  verified: 'Email verified. Log in to continue.',
  reset: 'Password updated. Log in with your new password.',
};

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();
  const toast = useToast();
  const [formError, setFormError] = useState('');
  const notice = NOTICES[location.state?.notice];
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: location.state?.email || '', password: '', rememberMe: false },
  });
  const onGoogle = useGoogleSignIn(setFormError);

  const onSubmit = async (values) => {
    setFormError('');
    try {
      const res = await authService.login(values);
      signIn(res.data); // only after the server confirmed success
      toast.success('Welcome back.');
      navigate(safeRedirect(location.state?.from, res.data.user.role), { replace: true });
    } catch (err) {
      if (apiErrorCode(err) === 'EMAIL_NOT_VERIFIED') {
        setPending({ email: values.email, sentAt: null, kind: 'user' });
        navigate('/verify-email', { state: { email: values.email, autoResend: true } });
        return;
      }
      setFormError(apiErrorMessage(err));
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Log in to compare rides in one place." pageTitle="Log in">
      <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
        {notice && <Alert variant="success">{notice}</Alert>}
        {formError && <Alert variant="error">{formError}</Alert>}
        <TextField label="Email" type="email" autoComplete="email" inputMode="email" placeholder="you@example.com" error={errors.email?.message} {...register('email')} />
        <PasswordField label="Password" autoComplete="current-password" placeholder="Your password" error={errors.password?.message} {...register('password')} />
        <div className={styles.row}>
          <Checkbox label="Keep me signed in" {...register('rememberMe')} />
          <Link to="/forgot-password">Forgot password?</Link>
        </div>
        <Button type="submit" fullWidth loading={isSubmitting}>Log in</Button>
      </form>
      <div className={styles.divider}>or continue with</div>
      <GoogleButton onCredential={onGoogle} text="signin_with" />
      <div className={styles.alt}>
        <p>New to OUR?<Link to="/signup">Create an account</Link></p>
      </div>
    </AuthLayout>
  );
}