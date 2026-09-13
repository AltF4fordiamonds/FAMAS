import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.js';
import { ProtectedRoute } from './components/ProtectedRoute.js';
import { DashboardLayout } from './layouts/DashboardLayout.js';

// Pages
import { LoginPage } from './pages/LoginPage.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { VehiclesPage } from './pages/VehiclesPage.js';
import { VehicleDetailsPage } from './pages/VehicleDetailsPage.js';
import { DriversPage } from './pages/DriversPage.js';
import { TripsPage } from './pages/TripsPage.js';
import { NotificationsPage } from './pages/NotificationsPage.js';
import { UsersPage } from './pages/UsersPage.js';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication Route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Application Area */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            {/* Operational Dashboard: Admin and Dispatcher */}
            <Route
              index
              element={
                <ProtectedRoute allowedRoles={['admin', 'dispatcher']}>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />

            {/* Vehicles Module */}
            <Route path="vehicles" element={<VehiclesPage />} />
            <Route path="vehicles/:id" element={<VehicleDetailsPage />} />

            {/* Drivers Module: Admin and Dispatcher */}
            <Route
              path="drivers"
              element={
                <ProtectedRoute allowedRoles={['admin', 'dispatcher']}>
                  <DriversPage />
                </ProtectedRoute>
              }
            />

            {/* Trips Module: All roles (Drivers see assigned trips) */}
            <Route path="trips" element={<TripsPage />} />

            {/* Notifications & Expiration Compliance Center */}
            <Route path="notifications" element={<NotificationsPage />} />

            {/* User & Role Management: Admin only */}
            <Route
              path="users"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <UsersPage />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Catch-all Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
