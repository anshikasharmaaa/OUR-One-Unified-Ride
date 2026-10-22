import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import AuthLayout from '../../components/auth/AuthLayout';
import TextField from '../../components/common/TextField';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import { authService } from '../../services/authService';
import { forgotSchema } from '../../utils/validators';
import { apiErrorMessage } from '../../utils/errors';
import { setPending } from '../../utils/pending';
import styles from '../../components/auth/authForm.module.css';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [formError, setFormError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(forgotSchema), defaultValues: { email: '' } });

  const onSubmit = async ({ email }) => {
    setFormError('');
    try {
      await authService.forgotPassword(email);
      setPending({ email, sentAt: Date.now(), kind: 'reset' });
      navigate('/reset-password', { state: { email } });
    } catch (err) {
      setFormError(apiErrorMessage(err));
    }
  };

  return (
    <AuthLayout title="Forgot your password?" subtitle="Enter your email and we’ll send a code to reset it." pageTitle="Forgot password">
      <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
        {formError && <Alert variant="error">{formError}</Alert>}
        <TextField label="Email" type="email" autoComplete="email" inputMode="email" placeholder="you@example.com" error={errors.email?.message} {...register('email')} />
        <Button type="submit" fullWidth loading={isSubmitting}>Send reset code</Button>
      </form>
      <p className={styles.footer}><Link to="/login">Back to log in</Link></p>
    </AuthLayout>
  );
}
