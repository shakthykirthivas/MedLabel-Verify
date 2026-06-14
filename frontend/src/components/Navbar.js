import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const LINKS = [
  { label: 'Home', path: '/' },
  { label: 'Standards', path: '/regulations' },
  { label: 'Documentation', path: '/help' }
];

export default function Navbar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <nav className="masthead sticky-nav">
      <div className="swiss-grid py-6 items-center">
        <div className="col-span-3 flex items-center gap-2 logo-group" onClick={() => navigate('/')}>
          <div className="wordmark-box">M</div>
          <span className="wordmark-text">
            MEDLABEL<span className="wordmark-light">VERIFY</span>
          </span>
        </div>
        <div className="col-span-6 flex justify-center gap-10 nav-links">
          {LINKS.map((link) => (
            <span
              key={link.path}
              onClick={() => navigate(link.path)}
              className={`nav-item cursor-pointer${pathname === link.path ? ' active' : ''}`}
            >
              {link.label}
            </span>
          ))}
        </div>
        <div className="col-span-3 flex justify-end">
          <button className="btn-accent" onClick={() => navigate('/help')}>
            Request Technical Audit
          </button>
        </div>
      </div>
    </nav>
  );
}
