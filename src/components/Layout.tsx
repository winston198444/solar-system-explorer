import { NavLink, Outlet } from 'react-router-dom';
import {
  SUPPORTED_LANGS,
  useI18n,
  type Lang,
} from '../i18n';

const NAV = [
  { to: '/', labelKey: 'nav.dashboard' },
  { to: '/catalog', labelKey: 'nav.catalog' },
  { to: '/positions', labelKey: 'nav.positions' },
] as const;

export default function Layout() {
  const { lang, setLang, t } = useI18n();

  return (
    <div className="app">
      <a className="skip-link" href="#main-content">
        {t('layout.skip')}
      </a>
      <header className="app-header">
        <div className="app-header-inner">
          <NavLink to="/" className="brand">
            <span className="brand-icon" aria-hidden="true">🪐</span>
            <span>
              <strong>Solar System Explorer</strong>
              <small>{t('layout.tagline')}</small>
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
                {t(item.labelKey)}
              </NavLink>
            ))}
          </nav>
          <label className="lang-switch">
            <span className="sr-only">{t('lang.label')}</span>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value as Lang)}
              aria-label={t('lang.label')}
            >
              {SUPPORTED_LANGS.map(({ code, label }) => (
                <option key={code} value={code}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>
      <main className="app-main" id="main-content">
        <Outlet />
      </main>
      <footer className="app-footer">
        <p className="footer-note">
          {t('footer.dataFrom')}{' '}
          <a
            href="https://api.le-systeme-solaire.net"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('footer.apiName')}
          </a>{' '}
          {t('footer.apiDomain')}
        </p>
      </footer>
    </div>
  );
}
