import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './components/system/ToastContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { DashboardPage } from './pages/DashboardPage'
import { ProjectsPage } from './pages/ProjectsPage'
import { ProjectFormPage } from './pages/ProjectFormPage'
import { ProjectDetailPage } from './pages/ProjectDetailPage'
import { SiteFormPage } from './pages/SiteFormPage'
import { SiteDetailPage } from './pages/SiteDetailPage'
import { AlertsPage } from './pages/AlertsPage'
import { ActionsPage } from './pages/ActionsPage'
import { AuditLogPage } from './pages/AuditLogPage'
import { NotFoundPage } from './pages/NotFoundPage'

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/projects"
              element={
                <ProtectedRoute>
                  <ProjectsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects/new"
              element={
                <ProtectedRoute>
                  <ProjectFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects/:projectId/edit"
              element={
                <ProtectedRoute>
                  <ProjectFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/projects/:projectId"
              element={
                <ProtectedRoute>
                  <ProjectDetailPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/projects/:projectId/sites/new"
              element={
                <ProtectedRoute>
                  <SiteFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sites/:siteId/edit"
              element={
                <ProtectedRoute>
                  <SiteFormPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sites/:siteId"
              element={
                <ProtectedRoute>
                  <SiteDetailPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/alerts"
              element={
                <ProtectedRoute>
                  <AlertsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/actions"
              element={
                <ProtectedRoute>
                  <ActionsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/audit"
              element={
                <ProtectedRoute>
                  <AuditLogPage />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}
