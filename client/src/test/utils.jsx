import { render } from '@testing-library/react';
import { MemoryRouter, Routes, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthContext } from '../context/AuthContext';
import { ToastProvider } from '../context/ToastContext';

export const LocationProbe = () => <div data-testid="loc">{useLocation().pathname}</div>;

export function renderWithProviders(ui, { route = '/', auth = { status: 'unauthenticated', user: null }, routes } = {}) {
  const value = { signIn: vi.fn(), signOut: vi.fn(), ...auth };
  return {
    auth: value,
    ...render(
      <HelmetProvider>
        <ToastProvider>
          <AuthContext.Provider value={value}>
            <MemoryRouter initialEntries={[route]}>
              {routes ? <Routes>{routes}</Routes> : ui}
              <LocationProbe />
            </MemoryRouter>
          </AuthContext.Provider>
        </ToastProvider>
      </HelmetProvider>,
    ),
  };
}
export const asUser = (role, extra = {}) => ({ status: 'authenticated', user: { id: '1', name: 'Test Person', email: 't@example.com', role, ...extra } });
