import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const Navbar: React.FC = () => {
  const { user, isAuthenticated, isLoading, login, logout } = useAuth();

  const handleLogin = () => {
    login();
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark" style={{ flexShrink: 0, padding: '0px', backgroundColor: '#aa0000' }}>
      <div className="container-fluid">
        <a className="navbar-brand fw-bold" href="#" style={{ 
          color: 'white', 
          fontSize: '21pt',
          lineHeight: '1',
          padding: '0',
          margin: '0'
        }}>
          <span>red</span><span style={{ fontStyle: 'italic', opacity: 0.9 }}>five</span>
        </a>
        <div className="navbar-nav ms-auto">
          {isLoading ? (
            <div className="nav-link">
              <i className="bi bi-hourglass-split me-1"></i>Loading...
            </div>
          ) : isAuthenticated && user ? (
            <>
              <div className="nav-link d-flex align-items-center">
                {user.picture && (
                  <img 
                    src={user.picture} 
                    alt={user.name}
                    className="rounded-circle me-2"
                    style={{ width: '24px', height: '24px' }}
                  />
                )}
                <span className="me-3">{user.name}</span>
              </div>
              <a className="nav-link" href="#"><i className="bi bi-gear me-1"></i>Settings</a>
              <button 
                className="nav-link btn btn-link text-light text-decoration-none" 
                onClick={handleLogout}
                style={{ border: 'none', background: 'none' }}
              >
                <i className="bi bi-box-arrow-right me-1"></i>Logout
              </button>
            </>
          ) : (
            <button 
              className="nav-link btn btn-link text-light text-decoration-none" 
              onClick={handleLogin}
              style={{ border: 'none', background: 'none' }}
            >
              <i className="bi bi-google me-1"></i>Login with Google
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
