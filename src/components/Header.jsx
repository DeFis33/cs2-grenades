import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

function Header({ isAdmin = false, guideOpen, setGuideOpen, onAdminLogin, onAdminLogout }) {
  const { lang, setLang, t } = useLanguage();
  const [showMaps, setShowMaps] = useState(false);
  const [showLang, setShowLang] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123';

    if (password === adminPassword) {
      setShowPasswordModal(false);
      setPassword('');
      setPasswordError('');
      if (onAdminLogin) onAdminLogin();
    } else {
      setPasswordError(t('wrongPassword'));
      setPassword('');
    }
  };

  const handleEditorClick = () => {
    if (isAdmin) {
      if (onAdminLogout) onAdminLogout();
    } else {
      setShowPasswordModal(true);
    }
  };

  return (
    <>
      <header className="header">
        <div className="header-inner">
          <Link to="/" className="header-logo">
            <img src="/logo.png" alt="CSLINEUPS" className="header-logo-img" />
          </Link>

          <div className="header-right">
            <div
              className="dropdown-container"
              onMouseEnter={() => setShowMaps(true)}
              onMouseLeave={() => setShowMaps(false)}
            >
              <button className="dropdown-btn">
                {t('maps')} <span className={`dropdown-arrow ${showMaps ? 'open' : ''}`}>▼</span>
              </button>
              {showMaps && (
                <div className="dropdown">
                  <div className="dropdown-inner">
                    <div className="dropdown-item"><Link to="/map/dust2">Dust 2</Link></div>
                    <div className="dropdown-item"><Link to="/map/mirage">Mirage</Link></div>
                    <div className="dropdown-item"><Link to="/map/inferno">Inferno</Link></div>
                    <div className="dropdown-item"><Link to="/map/nuke">Nuke</Link></div>
                    <div className="dropdown-item"><Link to="/map/overpass">Overpass</Link></div>
                    <div className="dropdown-item"><Link to="/map/ancient">Ancient</Link></div>
                    <div className="dropdown-item"><Link to="/map/anubis">Anubis</Link></div>
                  </div>
                </div>
              )}
            </div>

            {isAdmin && setGuideOpen && (
              <div className={`guide-container ${guideOpen ? 'active' : ''}`}>
                <button
                  className="guide-icon-btn"
                  onClick={() => setGuideOpen(!guideOpen)}
                >
                  <img src="/icons/guide.png" alt="Guide" className="guide-icon-img" />
                </button>
                <div className="guide-dropdown" style={{ display: guideOpen ? 'block' : 'none' }}>
                  <div className="guide-dropdown-inner">
                    <div className="guide-title">{t('guide')}</div>
                    <div className="guide-item guide-desktop">{t('guideClickMap')}</div>
                    <div className="guide-item guide-desktop">{t('guideClickMarker')}</div>
                    <div className="guide-item guide-desktop"><kbd>Ctrl</kbd> + {t('guideCtrl')}</div>
                    <div className="guide-item guide-desktop"><kbd>Shift</kbd> + {t('guideShiftMarker')}</div>
                    <div className="guide-item guide-desktop"><kbd>Shift</kbd> + {t('guideShiftMap')}</div>
                    <div className="guide-item guide-desktop">{t('guideRightClick')}</div>
                    <div className="guide-item guide-desktop">{t('guideGroupClick')}</div>
                    <div className="guide-item guide-desktop">{t('guideDrag')}</div>
                    <div className="guide-item guide-mobile">{t('guideClickMap')}</div>
                    <div className="guide-item guide-mobile">{t('guideClickMarker')}</div>
                    <div className="guide-item guide-mobile">{t('guideMobileGroupDrag')}</div>
                    <div className="guide-item guide-mobile">{t('guideMobileTrajectory')}</div>
                  </div>
                </div>
              </div>
            )}

            <button
              className={`edit-icon-btn ${isAdmin ? 'active' : ''}`}
              onClick={handleEditorClick}
              title={isAdmin ? t('exitEditor') : t('editor')}
            >
              <img src="/icons/edit.png" alt="Editor" className="edit-icon-img" />
            </button>

            <div
              className="lang-container"
              onMouseEnter={() => setShowLang(true)}
              onMouseLeave={() => setShowLang(false)}
            >
              <button className="lang-btn">
                {lang.toUpperCase()}
              </button>
              {showLang && (
                <div className="lang-dropdown">
                  <div className="lang-dropdown-inner">
                    <div className={`lang-item ${lang === 'en' ? 'active' : ''}`} onClick={() => setLang('en')}>EN</div>
                    <div className={`lang-item ${lang === 'ru' ? 'active' : ''}`} onClick={() => setLang('ru')}>RU</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="login-modal" onClick={e => e.stopPropagation()}>
            <button className="login-close" onClick={() => setShowPasswordModal(false)}>✕</button>
            <h2 className="login-title">{t('editor')}</h2>

            <form onSubmit={handlePasswordSubmit}>
              <input
                type="password"
                className="login-input"
                placeholder={t('password')}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError('');
                }}
                autoFocus
              />

              {passwordError && <p className="login-error">{passwordError}</p>}

              <button type="submit" className="login-btn">
                {t('enterEditor')}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default Header;