import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import AuthLayout from '../../components/auth/AuthLayout';
import GoogleButton from '../../components/auth/GoogleButton';
import PasswordRules from '../../components/auth/PasswordRules';
import TextField from '../../components/common/TextField';
import PasswordField from '../../components/common/PasswordField';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import { authService } from '../../services/authService';
import useGoogleSignIn from '../../hooks/useGoogleSignIn';
import { signupSchema } from '../../utils/validators';
import { apiErrorMessage, applyFieldErrors } from '../../utils/errors';
import { setPending } from '../../utils/pending';
import styles from '../../components/auth/authForm.module.css';

// A friend's invite link looks like /signup?ref=OURABC234. Anything that is not a letter or digit is dropped.
const cleanRef = (v) => (v || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20);

export default function SignupPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [formError, setFormError] = useState('');
  const { register, handleSubmit, setError, watch, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '', referralCode: cleanRef(params.get('ref')) },
  });
  const onGoogle = useGoogleSignIn(setFormError);

  const onSubmit = async (values) => {
    setFormError('');
    try {
      await authService.register(values);
      setPending({ email: values.email, sentAt: Date.now(), kind: 'user' });
      navigate('/verify-email', { state: { email: values.email } });
    } catch (err) {
      if (err.response?.status === 409) setError('email', { type: 'server', message: 'An account with this email already exists.' });
      else if (!applyFieldErrors(err, setError, ['name', 'email', 'password', 'confirmPassword', 'referralCode'])) setFormError(apiErrorMessage(err));
    }
  };

  return (
    <AuthLayout title="Create your account" subtitle="Compare cabs, autos and bike taxis in one search." pageTitle="Sign up">
      <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
        {formError && <Alert variant="error">{formError}</Alert>}
        <div className={styles.grid2}>
          <TextField label="Full name" autoComplete="name" placeholder="Riya Sharma" error={errors.name?.message} {...register('name')} />
          <TextField label="Email" type="email" autoComplete="email" inputMode="email" placeholder="you@example.com" error={errors.email?.message} {...register('email')} />
        </div>
        <div className={styles.grid2}>
          <PasswordField label="Password" autoComplete="new-password" placeholder="Create a password" error={errors.password?.message} {...register('password')} />
          <PasswordField label="Confirm password" autoComplete="new-password" placeholder="Repeat password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
        </div>
        <PasswordRules value={watch('password')} />
        <TextField
          label="Referral code (optional)" autoComplete="off" autoCapitalize="characters" spellCheck={false} placeholder="e.g. OURABC234"
          hint="Have a friend’s code? Add it here. It counts once you compare fares after verifying your email."
          error={errors.referralCode?.message} {...register('referralCode')}
        />
        <Button type="submit" fullWidth loading={isSubmitting}>Create account</Button>
      </form>
      <div className={styles.divider}>or continue with</div>
      <GoogleButton onCredential={onGoogle} text="signup_with" />
      <p className={styles.footer}>Already have an account? <Link to="/login">Log in</Link></p>
    </AuthLayout>
  );
}