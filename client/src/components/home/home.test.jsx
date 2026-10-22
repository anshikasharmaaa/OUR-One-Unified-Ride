import { Route } from 'react-router-dom';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchPanel from './SearchPanel';
import SiteNavbar from './SiteNavbar';
import SiteFooter from './SiteFooter';
import Faq, { FAQS } from './Faq';
import Contact from './Contact';
import HomePage from '../../pages/home/HomePage';
import { renderWithProviders, asUser } from '../../test/utils';
import { searchService } from '../../services/searchService';

vi.mock('../../services/searchService', () => ({ searchService: { create: vi.fn() } }));
beforeEach(() => vi.clearAllMocks());
const apiError = (status, data) => Object.assign(new Error('x'), { response: { status, data } });

describe('SearchPanel', () => {
  const setup = (props = {}) => {
    const onSubmitted = vi.fn();
    renderWithProviders(<SearchPanel onSubmitted={onSubmitted} {...props} />);
    return { onSubmitted, user: userEvent.setup() };
  };

  test('validates required fields and never calls the API with invalid input', async () => {
    const { user, onSubmitted } = setup();
    await user.click(screen.getByRole('button', { name: 'Compare rides' }));
    expect(await screen.findByText('Enter a pickup location.')).toBeInTheDocument();
    expect(screen.getByText('Enter a drop-off location.')).toBeInTheDocument();
    await user.type(screen.getByLabelText('Pickup'), 'ab');
    await user.type(screen.getByLabelText('Drop-off'), 'Airport');
    await user.click(screen.getByRole('button', { name: 'Compare rides' }));
    expect(await screen.findByText('Enter at least 3 characters.')).toBeInTheDocument();
    expect(searchService.create).not.toHaveBeenCalled();
    expect(onSubmitted).not.toHaveBeenCalled();
  });

  test('rejects identical pickup and drop-off', async () => {
    const { user } = setup();
    await user.type(screen.getByLabelText('Pickup'), 'Vijay Nagar');
    await user.type(screen.getByLabelText('Drop-off'), 'vijay nagar');
    await user.click(screen.getByRole('button', { name: 'Compare rides' }));
    expect(await screen.findByText('Pickup and drop-off must be different.')).toBeInTheDocument();
    expect(searchService.create).not.toHaveBeenCalled();
  });

  test('swap button exchanges the two locations', async () => {
    const { user } = setup();
    await user.type(screen.getByLabelText('Pickup'), 'Palasia');
    await user.type(screen.getByLabelText('Drop-off'), 'Rajwada');
    await user.click(screen.getByRole('button', { name: /swap pickup and drop-off/i }));
    expect(screen.getByLabelText('Pickup')).toHaveValue('Rajwada');
    expect(screen.getByLabelText('Drop-off')).toHaveValue('Palasia');
  });

  test('submits to the real search API and reports the server result (no fares invented)', async () => {
    searchService.create.mockResolvedValue({ data: { id: 'abc123', status: 'RECEIVED', comparisonAvailable: false } });
    const { user, onSubmitted } = setup({ showVehicle: true });
    await user.type(screen.getByLabelText('Pickup'), 'Vijay Nagar, Indore');
    await user.type(screen.getByLabelText('Drop-off'), 'Indore Airport');
    await user.click(screen.getByLabelText('Auto'));
    await user.click(screen.getByRole('button', { name: 'Compare rides' }));
    await waitFor(() => expect(onSubmitted).toHaveBeenCalledTimes(1));
    expect(searchService.create).toHaveBeenCalledWith({ pickup: 'Vijay Nagar, Indore', dropoff: 'Indore Airport', vehicleType: 'AUTO' });
    expect(onSubmitted.mock.calls[0][0]).toEqual({ id: 'abc123', status: 'RECEIVED', comparisonAvailable: false });
  });

  test('shows network and server field errors instead of pretending success', async () => {
    searchService.create.mockRejectedValueOnce(Object.assign(new Error('Network Error'), { request: {} }));
    const { user, onSubmitted } = setup();
    await user.type(screen.getByLabelText('Pickup'), 'Palasia');
    await user.type(screen.getByLabelText('Drop-off'), 'Rajwada');
    await user.click(screen.getByRole('button', { name: 'Compare rides' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/can't reach the server/i);
    searchService.create.mockRejectedValueOnce(apiError(400, { message: 'bad', errors: [{ field: 'dropoff', message: 'Server says no.' }] }));
    await user.click(screen.getByRole('button', { name: 'Compare rides' }));
    expect(await screen.findByText('Server says no.')).toBeInTheDocument();
    expect(onSubmitted).not.toHaveBeenCalled();
  });
});

describe('SiteNavbar', () => {
  const NAMES = ['Home', 'About', 'Search Rides', 'Explore', 'Help/FAQs', 'Ride', 'Drive', 'Contact'];
  const renderNav = (auth) => renderWithProviders(<SiteNavbar />, { route: '/', auth });

  test('has every required link, the Compare Rides CTA and a Log in option for visitors', () => {
    renderNav();
    const primary = within(screen.getByRole('navigation', { name: 'Primary' }));
    NAMES.forEach((n) => expect(primary.getByRole('link', { name: n })).toBeInTheDocument());
    expect(primary.getByRole('link', { name: 'Search Rides' })).toHaveAttribute('href', '/search');
    expect(primary.getByRole('link', { name: 'Contact' })).toHaveAttribute('href', '/#contact');
    expect(screen.getAllByRole('link', { name: 'Compare Rides' })[0]).toHaveAttribute('href', '/search');
    expect(screen.getByRole('link', { name: /log in/i })).toHaveAttribute('href', '/login');
    expect(screen.getByRole('img', { name: /OUR — One Unified Ride/ })).toHaveAttribute('src', '/assets/logo.png');
  });

  test('signed-in people see their own destination instead of Log in', () => {
    renderNav(asUser('ADMIN'));
    expect(screen.getByRole('link', { name: /dashboard/i })).toHaveAttribute('href', '/admin');
    expect(screen.queryByRole('link', { name: /log in/i })).not.toBeInTheDocument();
  });

  test('a signed-in rider sees a link to their own account and a Log out button, not Log in', async () => {
    const user = userEvent.setup();
    const { auth } = renderNav(asUser('USER', { name: 'Anshika Sharma' }));
    expect(screen.getByRole('link', { name: /my account/i })).toHaveAttribute('href', '/account');
    expect(screen.queryByRole('link', { name: /log in/i })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /log out/i }));
    expect(auth.signOut).toHaveBeenCalledTimes(1);
  });

  test('hamburger opens and closes the mobile menu (button and Escape), updating aria-expanded', async () => {
    const user = userEvent.setup();
    renderNav();
    const burger = screen.getByRole('button', { name: 'Open menu' });
    expect(burger).toHaveAttribute('aria-expanded', 'false');
    await user.click(burger);
    expect(screen.getByRole('navigation', { name: 'Mobile' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close menu' })).toHaveAttribute('aria-expanded', 'true');
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('navigation', { name: 'Mobile' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open menu' })).toHaveFocus();
  });
});

describe('Faq accordion', () => {
  test('is keyboard-operable and exposes expanded state', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Faq />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(FAQS.length);
    expect(buttons[0]).toHaveAttribute('aria-expanded', 'true');
    expect(buttons[1]).toHaveAttribute('aria-expanded', 'false');
    buttons[1].focus();
    await user.keyboard('{Enter}');
    expect(buttons[1]).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('region', { name: FAQS[1].q })).toBeVisible();
    await user.keyboard(' ');
    expect(buttons[1]).toHaveAttribute('aria-expanded', 'false');
  });

  test('answers make no invented claims about providers or live fares', () => {
    renderWithProviders(<Faq />);
    const all = FAQS.map((f) => f.a).join(' ');
    expect(all).toMatch(/not listing any yet|still in development/i);
    expect(all).not.toMatch(/₹\s?\d|Ola|Uber|Rapido|million|\d+%/);
  });
});

describe('Contact and footer', () => {
  test('without a configured contact address it shows an honest notice and no dead form', () => {
    renderWithProviders(<Contact />);
    expect(screen.getByText(/contact details coming soon/i)).toBeInTheDocument();
    expect(screen.queryByRole('form', { name: /contact/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /send message/i })).not.toBeInTheDocument();
  });

  test('footer shows the current year, the logo, and only links that exist', () => {
    renderWithProviders(<SiteFooter />);
    expect(screen.getByText(new RegExp(`© ${new Date().getFullYear()} OUR`))).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /OUR — One Unified Ride/ })).toBeInTheDocument();
    const hrefs = screen.getAllByRole('link').map((a) => a.getAttribute('href'));
    ['/search', '/login', '/signup', '/driver/login', '/driver/register'].forEach((h) => expect(hrefs).toContain(h));
    expect(screen.queryByText(/terms|privacy/i)).not.toBeInTheDocument();
    expect(hrefs.every((h) => h && h !== '#')).toBe(true);
  });
});

describe('HomePage', () => {
  test('renders every section anchor, one h1, and no fake app-store links or statistics', () => {
    const { container } = renderWithProviders(null, { routes: <Route path="/" element={<HomePage />} /> });
    ['explore', 'why', 'how', 'about', 'ride', 'drive', 'faq', 'app', 'contact'].forEach((id) => expect(container.querySelector(`#${id}`)).not.toBeNull());
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Every Ride\.\s*Every Option\.\s*One Search\./);
    expect(screen.getAllByText(/coming soon/i).length).toBeGreaterThan(0);
    expect(container.querySelector('a[href*="play.google"], a[href*="apps.apple"]')).toBeNull();
    expect(container.textContent).not.toMatch(/\d+\s?\+|\d+\s?(million|k)\b|trusted by/i);
    ['Bike', 'Auto', 'Economy Cab', 'Premium Cab'].forEach((n) => expect(screen.getByRole('heading', { name: n })).toBeInTheDocument());
  });

  test('ride-type cards link into the real search flow with the type preselected', () => {
    renderWithProviders(null, { routes: <Route path="/" element={<HomePage />} /> });
    expect(screen.getByRole('link', { name: /compare bikes/i })).toHaveAttribute('href', '/search?vehicle=BIKE');
    expect(screen.getByRole('link', { name: /compare premium cab/i })).toHaveAttribute('href', '/search?vehicle=PREMIUM_CAB');
  });
});
