import { lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import PublicLayout from './layouts/PublicLayout.jsx';
import AdminLayout from './layouts/AdminLayout.jsx';
import Home from './pages/Home.jsx';
import NotFound from './pages/NotFound.jsx';
import { useAuth } from './context/AuthContext.jsx';

// Code splitting: inner public pages and the whole admin area load on demand
const Services = lazy(() => import('./pages/Services.jsx'));
const Fleet = lazy(() => import('./pages/Fleet.jsx'));
const AirportTransfers = lazy(() => import('./pages/AirportTransfers.jsx'));
const Corporate = lazy(() => import('./pages/Corporate.jsx'));
const About = lazy(() => import('./pages/About.jsx'));
const Booking = lazy(() => import('./pages/Booking.jsx'));
const Contact = lazy(() => import('./pages/Contact.jsx'));
const Privacy = lazy(() => import('./pages/Legal.jsx').then((m) => ({ default: m.Privacy })));
const Terms = lazy(() => import('./pages/Legal.jsx').then((m) => ({ default: m.Terms })));

const Login = lazy(() => import('./pages/admin/Login.jsx'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard.jsx'));
const Bookings = lazy(() => import('./pages/admin/Bookings.jsx'));
const Customers = lazy(() => import('./pages/admin/Customers.jsx'));
const Messages = lazy(() => import('./pages/admin/Messages.jsx'));
const WhatsAppLogs = lazy(() => import('./pages/admin/WhatsAppLogs.jsx'));
const Reports = lazy(() => import('./pages/admin/Reports.jsx'));
const Settings = lazy(() => import('./pages/admin/Settings.jsx'));
const pick = (name) => lazy(() => import('./pages/admin/Resources.jsx').then((m) => ({ default: m[name] })));
const Drivers = pick('Drivers');
const Vehicles = pick('Vehicles');
const ServicesAdmin = pick('ServicesAdmin');
const PricingAdmin = pick('PricingAdmin');
const TestimonialsAdmin = pick('TestimonialsAdmin');
const UsersAdmin = pick('UsersAdmin');

function AdminOnly({ children }) {
  const { isAdmin } = useAuth();
  return isAdmin ? children : <Navigate to="/admin" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<Home />} />
        <Route path="services" element={<Services />} />
        <Route path="fleet" element={<Fleet />} />
        <Route path="airport-transfers" element={<AirportTransfers />} />
        <Route path="corporate" element={<Corporate />} />
        <Route path="about" element={<About />} />
        <Route path="booking" element={<Booking />} />
        <Route path="contact" element={<Contact />} />
        <Route path="privacy" element={<Privacy />} />
        <Route path="terms" element={<Terms />} />
      </Route>

      <Route path="admin/login" element={<Login />} />
      <Route path="admin" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="bookings" element={<Bookings />} />
        <Route path="customers" element={<Customers />} />
        <Route path="drivers" element={<Drivers />} />
        <Route path="vehicles" element={<AdminOnly><Vehicles /></AdminOnly>} />
        <Route path="services" element={<AdminOnly><ServicesAdmin /></AdminOnly>} />
        <Route path="pricing" element={<AdminOnly><PricingAdmin /></AdminOnly>} />
        <Route path="testimonials" element={<AdminOnly><TestimonialsAdmin /></AdminOnly>} />
        <Route path="messages" element={<Messages />} />
        <Route path="whatsapp" element={<WhatsAppLogs />} />
        <Route path="reports" element={<Reports />} />
        <Route path="users" element={<AdminOnly><UsersAdmin /></AdminOnly>} />
        <Route path="settings" element={<AdminOnly><Settings /></AdminOnly>} />
      </Route>

      <Route element={<PublicLayout />}><Route path="*" element={<NotFound />} /></Route>
    </Routes>
  );
}
