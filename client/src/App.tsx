import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { RedirectIfAuthenticated, RequireAuth } from './auth/guards';
import { Layout } from './components/layout/Layout';
import { AccountPage } from './pages/AccountPage';
import { CatalogPage } from './pages/CatalogPage';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { MovieDetailPage } from './pages/MovieDetailPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { RegisterPage } from './pages/RegisterPage';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminMoviesPage } from './pages/admin/AdminMoviesPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { DashboardPage } from './pages/admin/DashboardPage';
import { MovieFormPage } from './pages/admin/MovieFormPage';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="catalogo" element={<CatalogPage />} />
          <Route path="pelicula/:slug" element={<MovieDetailPage />} />

          <Route
            path="login"
            element={
              <RedirectIfAuthenticated>
                <LoginPage />
              </RedirectIfAuthenticated>
            }
          />
          <Route
            path="registro"
            element={
              <RedirectIfAuthenticated>
                <RegisterPage />
              </RedirectIfAuthenticated>
            }
          />

          <Route
            path="cuenta"
            element={
              <RequireAuth>
                <AccountPage />
              </RequireAuth>
            }
          />

          <Route
            path="admin"
            element={
              <RequireAuth>
                <AdminLayout />
              </RequireAuth>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route
              path="peliculas"
              element={
                <RequireAuth permission="movies:write">
                  <AdminMoviesPage />
                </RequireAuth>
              }
            />
            <Route
              path="peliculas/nueva"
              element={
                <RequireAuth permission="movies:write">
                  <MovieFormPage />
                </RequireAuth>
              }
            />
            <Route
              path="peliculas/:slug/editar"
              element={
                <RequireAuth permission="movies:write">
                  <MovieFormPage />
                </RequireAuth>
              }
            />
            <Route
              path="usuarios"
              element={
                <RequireAuth permission="users:read">
                  <AdminUsersPage />
                </RequireAuth>
              }
            />
          </Route>

          <Route path="404" element={<NotFoundPage />} />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
