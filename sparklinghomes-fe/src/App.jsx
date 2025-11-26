import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Header from './components/Header'
import Footer from './components/Footer'
import ProtectedRoute from './components/ProtectedRoute'


// Pages
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import MoverRegister from './pages/MoverRegister'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Dashboard from './pages/Dashboard'
import Profile from './pages/Profile'
import CreateBooking from './pages/CreateCleaningBooking'
import BookingDetails from './pages/BookingDetails'
import GuestBookingDetails from './pages/GuestBookingDetails'
import BookingConfirmation from './pages/BookingConfirmation'
import MoverDashboard from './pages/MoverDashboard'
import MoverProfile from './pages/MoverProfile'
import MoverSubscription from './pages/MoverSubscription'
import MoverJobs from './pages/MoverJobs'
import Terms from './pages/Terms'
import Privacy from './pages/Privacy'

// Admin Pages
import AdminLogin from './pages/AdminLogin'
import AdminDashboard from './pages/AdminDashboard'
import AdminMovers from './pages/AdminMovers'
import AdminUsers from './pages/AdminUsers'
import AdminAdmins from './pages/AdminAdmins'
import AdminBookings from './pages/AdminBookings'
import AdminAnalytics from './pages/AdminAnalytics'
import AdminSettings from './pages/AdminSettings'
import AdminPayments from './pages/AdminPayments'
import MoverOnboarding from './pages/MoverOnboarding'
import MoverPayment from './pages/MoverPayment'

// Component to conditionally render header/footer
const Layout = ({ children }) => {
  const location = useLocation();
  const hideHeaderFooter = ['/login', '/register', '/forgot-password', '/reset-password', '/terms', '/privacy', '/admin/login'].includes(location.pathname) || location.pathname.startsWith('/reset-password/');
  const isAdminRoute = location.pathname.startsWith('/admin');
  
  return (
    <div className="min-h-screen">
      {!hideHeaderFooter && !isAdminRoute && <Header />}
      <main className={hideHeaderFooter || isAdminRoute ? '' : ''}>
        {children}
      </main>
      {!hideHeaderFooter && !isAdminRoute && <Footer />}
      
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route 
              path="/login" 
              element={
                <ProtectedRoute requireAuth={false}>
                  <Login />
                </ProtectedRoute>
              } 
            />
            {/* <Route 
              path="/register" 
              element={
                <ProtectedRoute requireAuth={false}>
                  <Register />
                </ProtectedRoute>
              } 
            /> */}
            <Route
              path="/mover/register"
              element={
                <ProtectedRoute requireAuth={false}>
                  <MoverRegister />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cleaner/register"
              element={
                <ProtectedRoute requireAuth={false}>
                  <MoverRegister />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/forgot-password" 
              element={
                <ProtectedRoute requireAuth={false}>
                  <ForgotPassword />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/reset-password/:token" 
              element={
                <ProtectedRoute requireAuth={false}>
                  <ResetPassword />
                </ProtectedRoute>
              } 
            />

            {/* Protected Customer Routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute allowedUserTypes={['customer']}>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />

            {/* Protected Mover Routes */}
            <Route 
              path="/mover/dashboard" 
              element={
                <ProtectedRoute allowedUserTypes={['mover']}>
                  <MoverDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/mover/profile" 
              element={
                <ProtectedRoute allowedUserTypes={['mover']}>
                  <MoverProfile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/mover/subscription" 
              element={
                <ProtectedRoute allowedUserTypes={['mover']}>
                  <MoverSubscription />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/mover/jobs" 
              element={
                <ProtectedRoute allowedUserTypes={['mover']}>
                  <MoverJobs />
                </ProtectedRoute>
              } 
            />

            {/* Booking Routes */}
            <Route path="/book" element={<CreateBooking />} />
            <Route path="/booking-confirmation/:bookingId" element={<BookingConfirmation />} />
            <Route path="/booking/:bookingId/guest/confirmation" element={<BookingConfirmation />} />
            <Route path="/bookings/:id" element={<GuestBookingDetails />} />
            <Route 
              path="/my-bookings/:id" 
              element={
                <ProtectedRoute>
                  <BookingDetails />
                </ProtectedRoute>
              }
            />

            {/* Terms and Privacy Routes */}
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />

            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route 
              path="/admin/dashboard" 
              element={
                <ProtectedRoute allowedUserTypes={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />

            {/* Mover Onboarding Routes */}
            <Route path="/mover/onboard" element={<MoverOnboarding />} />
            <Route path="/mover/payment" element={<MoverPayment />} />
            <Route 
              path="/admin/movers" 
              element={
                <ProtectedRoute allowedUserTypes={['admin']}>
                  <AdminMovers />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/users" 
              element={
                <ProtectedRoute allowedUserTypes={['admin']}>
                  <AdminUsers />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/admins" 
              element={
                <ProtectedRoute allowedUserTypes={['admin']}>
                  <AdminAdmins />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/bookings" 
              element={
                <ProtectedRoute allowedUserTypes={['admin']}>
                  <AdminBookings />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/analytics" 
              element={
                <ProtectedRoute allowedUserTypes={['admin']}>
                  <AdminAnalytics />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/settings" 
              element={
                <ProtectedRoute allowedUserTypes={['admin']}>
                  <AdminSettings />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/payments" 
              element={
                <ProtectedRoute allowedUserTypes={['admin']}>
                  <AdminPayments />
                </ProtectedRoute>
              } 
            />

            {/* Catch all route */}
            <Route 
              path="*" 
              element={
                <div className="min-h-screen flex items-center justify-center">
                  <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
                    <p className="text-gray-600">Page not found</p>
                  </div>
                </div>
              } 
            />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  )
}

export default App
