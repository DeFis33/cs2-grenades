import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const maps = [
  { id: 'dust2', name: 'Dust 2' },
];

const languages = [
  { code: 'en', label: 'EN' },
  { code: 'ru', label: 'RU' },
  { code: 'es', label: 'ES' },
  { code: 'de', label: 'DE' },
  { code: 'fr', label: 'FR' },
  { code: 'pt', label: 'PT' },
  { code: 'zh', label: 'ZH' },
];

function Header({ editMode, guideOpen, setGuideOpen, onLogout, onLoginClick }) {
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

          {editMode && !isHome && (
            <div className="guide-container">
              <button
                className="guide-icon-btn"
                title={t('guide')}
                onClick={(e) => { e.stopPropagation(); setGuideOpen(!guideOpen); }}
              >
                <img src="/icons/help.png" alt="?" className="guide-icon-img" />
              </button>
              <div className="guide-dropdown" onClick={(e) => e.stopPropagation()}>
                <div className="guide-dropdown-inner">
                  <div className="guide-title">{t('guide')}</div>
                  <div className="guide-item"><kbd>LMB</kbd> - {t('guideClickMap')}</div>
                  <div className="guide-item"><kbd>LMB</kbd> - {t('guideClickMarker')}</div>
                  <div className="guide-item"><kbd>Ctrl</kbd> + <kbd>LMB</kbd> - {t('guideCtrl')}</div>
                  <div className="guide-item"><kbd>Shift</kbd> + <kbd>LMB</kbd> - {t('guideShiftMarker')}</div>
                  <div className="guide-item"><kbd>Shift</kbd> + <kbd>LMB</kbd> - {t('guideShiftMap')}</div>
                  <div className="guide-item"><kbd>RMB</kbd> - {t('guideRightClick')}</div>
                  <div className="guide-item"><kbd>LMB</kbd> - {t('guideGroupClick')}</div>
                  <div className="guide-item">{t('guideDrag')}</div>
                </div>
              </div>
            </div>
          )}
          {editMode ? (
            <button className="edit-icon-btn active" onClick={onLogout} title={t('exitEditor')}>
              <img src="/icons/edit-active.png" alt={t('editor')} className="edit-icon-img" />
            </button>
          ) : (
            <button className="edit-icon-btn" onClick={onLoginClick} title={t('editor')}>
              <img src="/icons/edit.png" alt={t('editor')} className="edit-icon-img" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;