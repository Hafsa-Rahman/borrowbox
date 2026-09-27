import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="brand">
          <span className="brand-badge">B</span> BorrowBox
        </Link>
        <nav className="nav-links">
          <Link to="/">Browse</Link>
          {user && <Link to="/dashboard">Dashboard</Link>}
          {user?.role === 'admin' && <Link to="/admin">Admin</Link>}
        </nav>
        <div className="nav-actions">
          {user ? (
            <>
              <Link to={`/profile/${user.id}`} className="nav-user">
                {user.name}
              </Link>
              <button className="btn btn-ghost" onClick={handleLogout}>
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost">
                Login
              </Link>
              <Link to="/register" className="btn btn-primary">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
