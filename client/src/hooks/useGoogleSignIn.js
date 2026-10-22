import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { safeRedirect } from '../routes/paths';
import { apiErrorMessage } from '../utils/errors';

/** Sends Google's ID token to our backend for verification. Nothing from the token is trusted client-side. */
export default function useGoogleSignIn(onError) {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  return useCallback(
    async (credential) => {
      try {
        const res = await authService.google(credential);
        signIn(res.data);
        navigate(safeRedirect(location.state?.from, res.data.user.role), { replace: true });
      } catch (err) {
        onError(apiErrorMessage(err, 'Google sign-in failed. Please try again.'));
      }
    },
    [signIn, navigate, location.state, onError],
  );
}
