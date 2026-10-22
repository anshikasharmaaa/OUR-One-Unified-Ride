import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import AuthLayout from '../../components/auth/AuthLayout';
import TextField from '../../components/common/TextField';
import PasswordField from '../../components/common/PasswordField';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import { adminService } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import { adminLoginSchema } from '../../utils/validators';
import { apiErrorMessage } from '../../utils/errors';
import { homeFor } from '../../routes/paths';
import styles from '../../components/auth/authForm.module.css';

/** Deliberately minimal: no Google, no signup, no recovery links. */
export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [formError, setFormError] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(adminLoginSchema), defaultValues: { email: '', password: '' } });

  const onSubmit = async (values) => {
    setFormError('');
    try {
      const res = await adminService.login(values);
      signIn(res.data);
      navigate(homeFor(res.data.user.role), { replace: true });
    } catch (err) {
      setFormError(apiErrorMessage(err));
    }
  };

  return (
    <AuthLayout title="Administrator sign in" subtitle="Authorised platform administrators only." pageTitle="Administrator" noIndex>
      <form className={styles.form} onSubmit={handleSubmit(onSubmit)} noValidate>
        {formError && <Alert variant="error">{formError}</Alert>}
        <TextField label="Email" type="email" autoComplete="username" inputMode="email" error={errors.email?.message} {...register('email')} />
        <PasswordField label="Password" autoComplete="current-password" error={errors.password?.message} {...register('password')} />
        <Button type="submit" fullWidth loading={isSubmitting}>Sign in</Button>
      </form>
    </AuthLayout>
  );
}
