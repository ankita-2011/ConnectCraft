import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/user/ProtectedRoute';
import PublicRoute from './components/user/PublicRoute';
import AdminRoute from './components/admin/AdminRoute';
import UserLayout from './layouts/user/UserLayout';
import NetworkStatusBanner from './components/shared/NetworkStatusBanner';

// User Application Pages
const Landing = lazy(() => import('./pages/user/Landing'));
const Login = lazy(() => import('./pages/user/Login'));
const Register = lazy(() => import('./pages/user/Register'));
const OtpVerification = lazy(() => import('./pages/user/OtpVerification'));
const ForgotPassword = lazy(() => import('./pages/user/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/user/ResetPassword'));
const Onboarding = lazy(() => import('./pages/user/Onboarding'));
const PublicProfile = lazy(() => import('./pages/user/PublicProfile'));
const EditProfile = lazy(() => import('./pages/user/EditProfile'));
const Dashboard = lazy(() => import('./pages/user/Dashboard'));
const Discover = lazy(() => import('./pages/user/Discover'));
const Communities = lazy(() => import('./pages/user/Communities'));
const Connections = lazy(() => import('./pages/user/Connections'));
const CreateCommunity = lazy(() => import('./pages/user/CreateCommunity'));
const CommunityDetails = lazy(() => import('./pages/user/CommunityDetails'));
const Projects = lazy(() => import('./pages/user/Projects'));
const CreateProject = lazy(() => import('./pages/user/CreateProject'));
const EditProject = lazy(() => import('./pages/user/EditProject'));
const ProjectDetails = lazy(() => import('./pages/user/ProjectDetails'));
const Resources = lazy(() => import('./pages/user/Resources'));
const CreateResource = lazy(() => import('./pages/user/CreateResource'));
const EditResource = lazy(() => import('./pages/user/EditResource'));
const ResourceDetails = lazy(() => import('./pages/user/ResourceDetails'));
const Bookmarks = lazy(() => import('./pages/user/Bookmarks'));
const Messages = lazy(() => import('./pages/user/Messages'));
const Notifications = lazy(() => import('./pages/user/Notifications'));
const Workshops = lazy(() => import('./pages/user/Workshops'));
const MyWorkshops = lazy(() => import('./pages/user/MyWorkshops'));
const CreateWorkshop = lazy(() => import('./pages/user/CreateWorkshop'));
const EditWorkshop = lazy(() => import('./pages/user/EditWorkshop'));
const WorkshopDetails = lazy(() => import('./pages/user/WorkshopDetails'));
const ImpactProfile = lazy(() => import('./pages/user/ImpactProfile'));
const Analytics = lazy(() => import('./pages/user/Analytics'));
const Settings = lazy(() => import('./pages/user/Settings'));
const NotFound = lazy(() => import('./pages/user/NotFound'));

// Admin Application Pages
const AdminBootstrap = lazy(() => import('./pages/admin/AdminBootstrap'));
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const AdminRegister = lazy(() => import('./pages/admin/AdminRegister'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <ToastProvider>
          <NetworkStatusBanner />
          <Router>
            <Suspense fallback={<main className="page-loading" aria-live="polite">Loading…</main>}>
              <Routes>
                {/* Guest Landing Route */}
                <Route path="/" element={<Landing />} />

                {/* Standalone Admin Portal Routes */}
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin/register" element={<AdminRegister />} />
                <Route path="/admin/bootstrap" element={<AdminBootstrap />} />
                <Route
                  path="/admin/dashboard"
                  element={
                    <AdminRoute>
                      <AdminDashboard />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <AdminRoute>
                      <AdminDashboard />
                    </AdminRoute>
                  }
                />

                {/* Authenticated-only Blocked Routes for Normal Users */}
                <Route
                  path="/login"
                  element={
                    <PublicRoute>
                      <Login />
                    </PublicRoute>
                  }
                />
                <Route
                  path="/register"
                  element={
                    <PublicRoute>
                      <Register />
                    </PublicRoute>
                  }
                />
                <Route
                  path="/forgot-password"
                  element={
                    <PublicRoute>
                      <ForgotPassword />
                    </PublicRoute>
                  }
                />
                <Route
                  path="/verify-otp"
                  element={
                    <PublicRoute>
                      <OtpVerification />
                    </PublicRoute>
                  }
                />
                <Route
                  path="/reset-password"
                  element={
                    <PublicRoute>
                      <ResetPassword />
                    </PublicRoute>
                  }
                />

                {/* Onboarding Wizard (Full-screen flow, no shared shell) */}
                <Route
                  path="/onboarding"
                  element={
                    <ProtectedRoute>
                      <Onboarding />
                    </ProtectedRoute>
                  }
                />

                {/* Protected Routes for Normal Users using UserLayout Shell */}
                <Route
                  element={
                    <ProtectedRoute>
                      <UserLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/discover" element={<Discover />} />
                  <Route path="/connections" element={<Connections />} />
                  <Route path="/communities" element={<Communities />} />
                  <Route path="/communities/create" element={<CreateCommunity />} />
                  <Route path="/communities/:slug" element={<CommunityDetails />} />
                  <Route path="/projects" element={<Projects />} />
                  <Route path="/projects/create" element={<CreateProject />} />
                  <Route path="/projects/:id" element={<ProjectDetails />} />
                  <Route path="/projects/:id/edit" element={<EditProject />} />

                  <Route path="/resources" element={<Resources />} />
                  <Route path="/resources/create" element={<CreateResource />} />
                  <Route path="/resources/:id" element={<ResourceDetails />} />
                  <Route path="/resources/:id/edit" element={<EditResource />} />
                  <Route path="/bookmarks" element={<Bookmarks />} />
                  <Route path="/messages" element={<Messages />} />
                  <Route path="/notifications" element={<Notifications />} />
                  <Route path="/workshops" element={<Workshops />} />
                  <Route path="/workshops/my" element={<MyWorkshops />} />
                  <Route path="/workshops/create" element={<CreateWorkshop />} />
                  <Route path="/workshops/:id" element={<WorkshopDetails />} />
                  <Route path="/workshops/:id/edit" element={<EditWorkshop />} />
                  <Route path="/impact" element={<ImpactProfile />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/profile/edit" element={<EditProfile />} />
                  <Route path="/edit-profile" element={<EditProfile />} />
                </Route>

                {/* Public Profiles */}
                <Route path="/profile/:username" element={<PublicProfile />} />

                {/* Catch-all 404 Route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </Router>
        </ToastProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
