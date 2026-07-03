import { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

function Header({ isAdmin = false, guideOpen, setGuideOpen }) {
  const { lang, setLang, t } = useLanguage();
  const [showMaps, setShowMaps] = useState(false);
  const [showLang, setShowLang] = useState(false);

  return (
    <header className="header">
      <div className="header-inner">
        <div className="header-logo">
          <img src="/logo.png" alt="CSLINEUPS" className="header-logo-img" />
        </div>

        <div className="header-right">
          <div className="dropdown-container">
            <button
              className="dropdown-btn"
              onClick={() => setShowMaps(!showMaps)}
              onBlur={() => setTimeout(() => setShowMaps(false), 200)}
            >
              {t('maps')} <span className={`dropdown-arrow ${showMaps ? 'open' : ''}`}>▼</span>
            </button>
            {showMaps && (
              <div className="dropdown">
                <div className="dropdown-inner">
                  <div className="dropdown-item"><a href="/map/dust2">Dust 2</a></div>
                  <div className="dropdown-item"><a href="/map/mirage">Mirage</a></div>
                  <div className="dropdown-item"><a href="/map/inferno">Inferno</a></div>
                  <div className="dropdown-item"><a href="/map/nuke">Nuke</a></div>
                  <div className="dropdown-item"><a href="/map/overpass">Overpass</a></div>
                  <div className="dropdown-item"><a href="/map/ancient">Ancient</a></div>
                  <div className="dropdown-item"><a href="/map/anubis">Anubis</a></div>
                </div>
              </div>
            )}
          </div>

          {setGuideOpen && (
            <div className="guide-container active">
              <button
                className="guide-icon-btn"
                onClick={() => setGuideOpen(!guideOpen)}
              >
                <img src="/icons/guide.png" alt="Guide" className="guide-icon-img" />
              </button>
              <div className="guide-dropdown" style={{ display: guideOpen ? 'block' : 'none' }}>
                <div className="guide-dropdown-inner">
                  <div className="guide-title">{t('guide')}</div>
                  <div className="guide-item guide-desktop">🖱️ {t('guideClickMap')}</div>
                  <div className="guide-item guide-desktop">🖱️ {t('guideClickMarker')}</div>
                  <div className="guide-item guide-desktop"><kbd>Ctrl</kbd> + 🖱️ {t('guideCtrl')}</div>
                  <div className="guide-item guide-desktop"><kbd>Shift</kbd> + {t('guideShiftMarker')}</div>
                  <div className="guide-item guide-desktop"><kbd>Shift</kbd> + {t('guideShiftMap')}</div>
                  <div className="guide-item guide-desktop">🖱️ {t('guideRightClick')}</div>
                  <div className="guide-item guide-desktop">🖱️ {t('guideGroupClick')}</div>
                  <div className="guide-item guide-desktop">🖱️ {t('guideDrag')}</div>
                  <div className="guide-item guide-mobile">👆 {t('guideClickMap')}</div>
                  <div className="guide-item guide-mobile">👆 {t('guideClickMarker')}</div>
                  <div className="guide-item guide-mobile">👆 {t('guideMobileGroupDrag')}</div>
                  <div className="guide-item guide-mobile">👆 {t('guideMobileTrajectory')}</div>
                </div>
              </div>
            </div>
          )}

          {isAdmin && (
            <div className="edit-icon-btn active" title={t('editor')}>
              <img src="/icons/edit.png" alt="Editor" className="edit-icon-img" />
            </div>
          )}

          <div className="lang-container">
            <button
              className="lang-btn"
              onClick={() => setShowLang(!showLang)}
              onBlur={() => setTimeout(() => setShowLang(false), 200)}
            >
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
  );
}

export default Header;