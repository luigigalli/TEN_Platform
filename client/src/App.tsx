import { Switch, Route, Router } from "wouter";
import { AuthProvider } from "./contexts/AuthContext";
import Navigation from "./components/Navigation";
import { LoginPage } from "./pages/auth/LoginPage";
import { RegisterPage } from "./pages/auth/RegisterPage";
import { VerifyEmailPage } from "./pages/auth/VerifyEmailPage";
import { ResetPasswordPage } from "./pages/auth/ResetPasswordPage";
import HomePage from "./pages/HomePage";
import TripPlanner from "./pages/TripPlanner";
import ServicesPage from "./pages/ServicesPage";
import BookingsPage from "./pages/BookingsPage";
import Profile from "./pages/Profile";
import { AdminLayout } from "./components/AdminLayout";
import DashboardPage from "./pages/admin/DashboardPage";
import UsersPage from "./pages/admin/UsersPage";
import RolesPage from "./pages/admin/RolesPage";
import RoleDetailsPage from "./pages/admin/RoleDetailsPage";
import PermissionsPage from "./pages/admin/PermissionsPage";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { UserRole } from "@/types/auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Create a client
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-background">
            <Switch>
              {/* Public Routes */}
              <Route path="/login" component={LoginPage} />
              <Route path="/register" component={RegisterPage} />
              <Route path="/verify-email" component={VerifyEmailPage} />
              <Route path="/reset-password" component={ResetPasswordPage} />

              {/* Admin Routes */}
              <Route path="/admin">
                <ProtectedRoute requiredRole={UserRole.SUPER_ADMIN}>
                  <AdminLayout>
                    <Switch>
                      <Route path="/admin" component={DashboardPage} />
                      <Route
                        path="/admin/users"
                        element={
                          <AdminLayout>
                            <UsersPage />
                          </AdminLayout>
                        }
                      />
                      <Route path="/admin/roles" component={RolesPage} />
                      <Route path="/admin/roles/new" component={RoleDetailsPage} />
                      <Route path="/admin/roles/:id" component={RoleDetailsPage} />
                      <Route path="/admin/permissions" component={PermissionsPage} />
                      <Route>404 - Not Found</Route>
                    </Switch>
                  </AdminLayout>
                </ProtectedRoute>
              </Route>

              {/* Protected Routes */}
              <Route path="/">
                <ProtectedRoute>
                  <Navigation />
                  <main className="container mx-auto px-4 py-8">
                    <Switch>
                      <Route path="/" component={HomePage} />
                      <Route path="/trips">
                        <ProtectedRoute>
                          <TripPlanner />
                        </ProtectedRoute>
                      </Route>
                      <Route path="/services">
                        <ProtectedRoute>
                          <ServicesPage />
                        </ProtectedRoute>
                      </Route>
                      <Route path="/bookings">
                        <ProtectedRoute>
                          <BookingsPage />
                        </ProtectedRoute>
                      </Route>
                      <Route path="/profile">
                        <ProtectedRoute>
                          <Profile />
                        </ProtectedRoute>
                      </Route>
                      <Route path="/profile/:id">
                        {(params) => (
                          <ProtectedRoute>
                            <Profile userId={parseInt(params.id)} />
                          </ProtectedRoute>
                        )}
                      </Route>
                      <Route>
                        {/* 404 Page */}
                        <div className="text-center">
                          <h1 className="text-2xl font-bold">Page Not Found</h1>
                          <p className="text-muted-foreground mt-2">The page you're looking for doesn't exist.</p>
                        </div>
                      </Route>
                    </Switch>
                  </main>
                </ProtectedRoute>
              </Route>
            </Switch>
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;