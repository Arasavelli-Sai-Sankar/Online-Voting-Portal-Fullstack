import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, adminOnly = false }) => {
  const { user, isAdmin } = useAuth();

  if (adminOnly && !isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  if (!adminOnly && !user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};