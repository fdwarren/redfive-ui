import React from 'react';

const Navbar: React.FC = () => {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark" style={{ flexShrink: 0, padding: '0px', backgroundColor: '#495057' }}>
      <div className="container-fluid">
        <a className="navbar-brand fw-bold" href="#" style={{ 
          color: '#aa0000', 
          fontSize: '21pt',
          lineHeight: '1',
          padding: '0',
          margin: '0',
          textShadow: '1px 1px 2px rgba(255, 255, 255, 0.3)'
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
