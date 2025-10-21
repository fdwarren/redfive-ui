import React from 'react';

const Navbar: React.FC = () => {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark" style={{ flexShrink: 0, padding: '0px' }}>
      <div className="container-fluid">
        <a className="navbar-brand fw-bold" href="#" style={{ 
          color: '#aa0000', 
          fontSize: '18pt',
          textShadow: '0.5px 0.5px 0 white, -0.5px -0.5px 0 white, 0.5px -0.5px 0 white, -0.5px 0.5px 0 white'
        }}>
          <span>red</span><span style={{ fontStyle: 'italic', opacity: 0.9 }}>five</span>
        </a>
        <div className="navbar-nav ms-auto">
          <a className="nav-link" href="#"><i className="bi bi-gear me-1"></i>Settings</a>
          <a className="nav-link" href="#"><i className="bi bi-person-circle me-1"></i>Profile</a>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
