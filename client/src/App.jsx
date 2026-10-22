import { Navigate, Route, Routes } from 'react-router-dom';
import { PublicOnly, RequireRole } from './routes/guards';
import SiteLayout from './layouts/SiteLayout';
import HomePage from './pages/home/HomePage';
import AboutPage from './pages/about/AboutPage';
import ExplorePage from './pages/explore/ExplorePage';
import ContactPage from './pages/contact/ContactPage';
import SearchPage from './pages/search/SearchPage';
import ComparePage from './pages/compare/ComparePage';
import BookingPage from './pages/booking/BookingPage';
import ProfileHome from './pages/account/ProfileHome';
import EditProfile from './pages/account/EditProfile';
import MyRides from './pages/account/MyRides';
import Favorites from './pages/account/Favorites';
import Notifications from './pages/account/Notifications';
import Referral from './pages/account/Referral';
import Safety from './pages/account/Safety';
import Settings from './pages/account/Settings';
import AdminUserDetail from './pages/admin/AdminUserDetail';
import UpcomingPage from './pages/upcoming/UpcomingPage';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import VerifyEmailPage from './pages/auth/VerifyEmailPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminLayout from './layouts/AdminLayout';
import AdminOverview from './pages/admin/AdminOverview';
import AdminSearches from './pages/admin/AdminSearches';
import AdminComparisons from './pages/admin/AdminComparisons';
import AdminUsers from './pages/admin/AdminUsers';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminSettings from './pages/admin/AdminSettings';
import NotFoundPage from './pages/common/NotFoundPage';
import OursPage from './pages/ours/OursPage';
import AdminContacts from './pages/admin/AdminContacts';
import AdminContactDetail from './pages/admin/AdminContactDetail';
import AdminProviders from './pages/admin/AdminProviders';

export default function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/upcoming" element={<UpcomingPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/ours" element={<OursPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/compare-rides" element={<Navigate to="/" replace />} />
        <Route element={<RequireRole role="USER" />}>
          <Route path="/profile" element={<ProfileHome />} />
          <Route path="/profile/edit" element={<EditProfile />} />
          <Route path="/profile/rides" element={<MyRides />} />
          <Route path="/profile/favorites" element={<Favorites />} />
          <Route path="/profile/notifications" element={<Notifications />} />
          <Route path="/profile/referral" element={<Referral />} />
          <Route path="/profile/safety" element={<Safety />} />
          <Route path="/profile/settings" element={<Settings />} />
          <Route path="/compare-rides/:id" element={<ComparePage />} />
          <Route path="/bookings/:id" element={<BookingPage />} />
        </Route>
      </Route>

      <Route element={<PublicOnly />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/our-control" element={<AdminLoginPage />} />
      </Route>

      <Route element={<RequireRole role="ADMIN" />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminOverview />} />
          <Route path="/admin/searches" element={<AdminSearches />} />
          <Route path="/admin/comparisons" element={<AdminComparisons />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/users/:id" element={<AdminUserDetail />} />
          <Route path="/admin/contacts" element={<AdminContacts />} />
          <Route path="/admin/contacts/:id" element={<AdminContactDetail />} />
          <Route path="/admin/providers" element={<AdminProviders />} />
          <Route path="/admin/analytics" element={<AdminAnalytics />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
          <Route path="/admin/drivers" element={<Navigate to="/admin/users" replace />} />
        </Route>
      </Route>

      <Route path="/driver/*" element={<Navigate to="/" replace />} />
      <Route path="/account/profile" element={<Navigate to="/profile" replace />} />
      <Route path="/account/*" element={<Navigate to="/" replace />} />
      <Route path="/app/*" element={<Navigate to="/" replace />} />
      <Route path="/rider/login" element={<Navigate to="/login" replace />} />
      <Route path="/rider/register" element={<Navigate to="/signup" replace />} />
      <Route path="/rider/*" element={<Navigate to="/" replace />} />
      <Route path="/home" element={<Navigate to="/" replace />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}