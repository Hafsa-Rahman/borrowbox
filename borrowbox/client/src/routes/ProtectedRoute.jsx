import { Navigate, Outlet } from 'react-router-dom';

export default function ProtectedRoute({ user }) {
  const token = localStorage.getItem('token');
  
  // Checks both state and localStorage token
  if (!user && !token) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}