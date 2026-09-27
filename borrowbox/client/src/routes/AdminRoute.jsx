import { Navigate, Outlet } from 'react-router-dom';

export default function AdminRoute({ user }) {
  const token = localStorage.getItem('token');
  const storedUser = user || JSON.parse(localStorage.getItem('user') || '{}');

  if (!token || storedUser.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}