import React, { ReactNode } from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { ShieldAlert, RefreshCw, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { UserRole } from '../types.js';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { user, token, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-4">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mb-3" />
        <p className="text-xs text-slate-400 font-medium">Validating fleet session credentials...</p>
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If role is restricted
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If a driver attempts to open root / (Dashboard), seamlessly redirect to their trips
    if (user.role === 'driver' && location.pathname === '/') {
      return <Navigate to="/trips" replace />;
    }

    return (
      <div className="max-w-md mx-auto my-16 bg-white p-6 rounded-2xl border border-rose-200 shadow-md text-center">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h3 className="font-bold text-base text-slate-900">Access Restricted</h3>
        <p className="text-xs text-slate-600 mt-2 leading-relaxed">
          Your current account role (
          <strong className="text-rose-700 capitalize font-bold">{user.role}</strong>
          ) is not authorized to access this module.
        </p>
        <div className="mt-5">
          <Link
            to={user.role === 'driver' ? '/trips' : '/'}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Allowed Area</span>
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
