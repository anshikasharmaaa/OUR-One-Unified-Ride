import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Logo from './Logo';
import PasswordField from './PasswordField';
import Button from './Button';
import PasswordRules from '../auth/PasswordRules';
import GoogleButton from '../auth/GoogleButton';

test('Logo renders the real logo file with a descriptive alt and does not set a width', () => {
  render(<Logo size="lg" />);
  const img = screen.getByRole('img', { name: /OUR — One Unified Ride/ });
  expect(img).toHaveAttribute('src', '/assets/logo.png');
  expect(img.getAttribute('width')).toBeNull();
});

test('Logo degrades to readable text if the file is missing', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  render(<Logo />);
  fireEvent.error(screen.getByRole('img'));
  expect(screen.getByRole('img', { name: /OUR/ })).toHaveTextContent('OUR');
  expect(warn).toHaveBeenCalled();
  warn.mockRestore();
});

test('password field toggles visibility with an accessible button', async () => {
  const user = userEvent.setup();
  render(<PasswordField label="Password" />);
  const input = screen.getByLabelText('Password');
  expect(input).toHaveAttribute('type', 'password');
  await user.click(screen.getByRole('button', { name: 'Show password' }));
  expect(input).toHaveAttribute('type', 'text');
  expect(screen.getByRole('button', { name: 'Hide password' })).toHaveAttribute('aria-pressed', 'true');
});

test('loading buttons are disabled and busy', () => {
  render(<Button loading>Save</Button>);
  expect(screen.getByRole('button')).toBeDisabled();
  expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
});

test('password rules reflect the typed password', () => {
  const { rerender } = render(<PasswordRules value="abc" />);
  expect(screen.getByText(/One uppercase letter/).closest('li')).not.toHaveClass('ok');
  rerender(<PasswordRules value="Str0ng!Passw0rd" />);
  expect(screen.getByText(/One uppercase letter/).closest('li')).toHaveClass('ok');
  expect(screen.getByText(/At least 8 characters/).closest('li')).toHaveClass('ok');
});

test('Google button says it is unavailable (no fake button) when no client ID is configured', () => {
  render(<GoogleButton onCredential={() => {}} />);
  expect(screen.getByRole('note')).toHaveTextContent(/temporarily unavailable/i);
});
