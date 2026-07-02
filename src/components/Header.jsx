import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const maps = [
  { id: 'dust2', name: 'Dust 2' },
];

const languages = [
  { code: 'en', label: 'EN' },
  { code: 'ru', label: 'RU' },
];

function Header({ user, guideOpen, setGuideOpen, onLogout, onUserClick }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === '/';
  const { lang, setLang, t } = useLanguage();

  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="header-logo">
          <img src="/logo-header.png" alt="Logo" className="header-logo-img" />
        </Link>

        <div
          className="dropdown-container"
          onMouseEnter={() => setDropdownOpen(true)}
          onMouseLeave={() => setDropdownOpen(false)}
        >
          <button className="dropdown-btn">
            {t('maps')}
            <span className={`dropdown-arrow ${dropdownOpen ? 'open' : ''}`}>▾</span>
          </button>
          {dropdownOpen && (
            <ul className="dropdown">
              <div className="dropdown-inner">
                {maps.map(map => (
                  <li key={map.id} className="dropdown-item">
                    <Link to={`/map/${map.id}`} onClick={() => setDropdownOpen(false)}>{map.name}</Link>
                  </li>
                ))}
              </div>
            </ul>
          )}
        </div>

        <div className="header-right">
          <div
            className="lang-container"
            onMouseEnter={() => setLangOpen(true)}
            onMouseLeave={() => setLangOpen(false)}
          >
            <button className="lang-btn">
              {lang.toUpperCase()}
            </button>
            {langOpen && (
              <ul className="lang-dropdown">
                <div className="lang-dropdown-inner">
                  {languages.map(l => (
                    <li
                      key={l.code}
                      className={`lang-item ${lang === l.code ? 'active' : ''}`}
                      onClick={() => { setLang(l.code); setLangOpen(false); }}
                    >
                      {l.label}
                    </li>
                  ))}
                </div>
              </ul>
            )}
          </div>

          {user && !isHome && (
            <div className={`guide-container ${guideOpen ? 'active' : ''}`}>
              <button
                className="guide-icon-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setGuideOpen(!guideOpen);
                }}
              >
                <img src="/icons/help.png" alt="?" className="guide-icon-img" />
              </button>
              <div className="guide-dropdown" onClick={(e) => e.stopPropagation()}>
                <div className="guide-dropdown-inner">
                  <div className="guide-title">{t('guide')}</div>
                  <div className="guide-desktop">
                    <div className="guide-item"><kbd>LMB</kbd> - {t('guideClickMap')}</div>
                    <div className="guide-item"><kbd>LMB</kbd> - {t('guideClickMarker')}</div>
                    <div className="guide-item"><kbd>Ctrl</kbd> + <kbd>LMB</kbd> - {t('guideCtrl')}</div>
                    <div className="guide-item"><kbd>Shift</kbd> + <kbd>LMB</kbd> - {t('guideShiftMarker')}</div>
                    <div className="guide-item"><kbd>Shift</kbd> + <kbd>LMB</kbd> - {t('guideShiftMap')}</div>
                    <div className="guide-item"><kbd>RMB</kbd> - {t('guideRightClick')}</div>
                    <div className="guide-item"><kbd>LMB</kbd> - {t('guideGroupClick')}</div>
                    <div className="guide-item">{t('guideDrag')}</div>
                  </div>
                  <div className="guide-mobile">
                    <div className="guide-item">{t('guideClickMap')}</div>
                    <div className="guide-item">{t('guideClickMarker')}</div>
                    <div className="guide-item">{t('guideDrag')}</div>
                    <div className="guide-item">{t('guideMobileGroupDrag')}</div>
                    <div className="guide-item">{t('guideMobileTrajectory')}</div>
                    <div className="guide-item">{t('guideGroupClick')}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {user ? (
            <button className="edit-icon-btn active" onClick={onLogout} title={user.email}>
              <img src="/icons/user.png" alt={t('profile')} className="edit-icon-img" />
            </button>
          ) : (
            <button className="edit-icon-btn" onClick={onUserClick} title={t('login')}>
              <img src="/icons/user.png" alt={t('login')} className="edit-icon-img" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;