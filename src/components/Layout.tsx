import { NavLink, Outlet } from 'react-router-dom';

const NAV = [
  { to: '/', label: 'Dashboard' },
  { to: '/catalog', label: 'Catalog' },
  { to: '/positions', label: 'Sky positions' },
];

export default function Layout() {
  return (
    <div className="app">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <header className="app-header">
        <div className="app-header-inner">
          <NavLink to="/" className="brand">
            <span className="brand-icon" aria-hidden="true">🪐</span>
            <span>
              <strong>Solar System Explorer</strong>
              <small>Powered by Solar System openData API</small>
            </span>
          </NavLink>
          <nav className="main-nav" aria-label="Main">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `nav-link${isActive ? ' nav-link-active' : ''}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="app-main" id="main-content">
        <Outlet />
      </main>
      <footer className="app-footer">
        <p className="footer-note">
          Data from the{' '}
          <a
            href="https://api.le-systeme-solaire.net"
            target="_blank"
            rel="noopener noreferrer"
          >
            Solar System openData API
          </a>{' '}
          (api.le-systeme-solaire.net)
        </p>
      </footer>
    </div>
  );
}
