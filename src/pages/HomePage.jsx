import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Header from '../components/Header';
import { useLanguage } from '../context/LanguageContext';

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;

const mapsList = [
  { id: 'dust2', name: 'Dust 2', image: 'dust2.png', available: true },
  { id: 'mirage', name: 'Mirage', image: null, available: false },
  { id: 'inferno', name: 'Inferno', image: null, available: false },
  { id: 'nuke', name: 'Nuke', image: null, available: false },
  { id: 'overpass', name: 'Overpass', image: null, available: false },
  { id: 'ancient', name: 'Ancient', image: null, available: false },
  { id: 'anubis', name: 'Anubis', image: null, available: false },
];

function HomePage({ editMode, onLogout }) {
  const { lang, t } = useLanguage();
  const [showLogin, setShowLogin] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(false);

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      localStorage.setItem('cs2_editor_auth', password); // Сохраняем сам пароль
      setShowLogin(false);
      setPassword('');
      setLoginError(false);
      window.location.reload();
    } else {
      setLoginError(true);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleLogin();
  };

  useEffect(() => {
    document.title = t('homeTitle');
  }, [lang]);

  return (
    <>
      <Helmet>
        <title>{t('homeTitle')}</title>
      </Helmet>
      <Header
        editMode={editMode}
        onLogout={onLogout}
        onLoginClick={() => setShowLogin(true)}
      />

      {showLogin && (
        <div className="modal-overlay" onClick={() => { setShowLogin(false); setLoginError(false); setPassword(''); }}>
          <div className="login-modal" onClick={e => e.stopPropagation()}>
            <button className="login-close" onClick={() => { setShowLogin(false); setLoginError(false); setPassword(''); }}>✕</button>
            <h2 className="login-title">{t('login')}</h2>
            <input type="password" className="login-input" placeholder={t('password')} value={password} onChange={(e) => { setPassword(e.target.value); setLoginError(false); }} onKeyDown={handleKeyDown} autoFocus />
            {loginError && <p className="login-error">{t('wrongPassword')}</p>}
            <button className="login-btn" onClick={handleLogin}>{t('loginBtn')}</button>
          </div>
        </div>
      )}

      <div className="home-page">
        <div className="maps-grid">
          {mapsList.map(map => (
            <Link
              key={map.id}
              to={map.available ? `/map/${map.id}` : '#'}
              className={`map-card ${map.available ? 'available' : 'locked'}`}
              onClick={e => !map.available && e.preventDefault()}
            >
              <div className="map-card-preview">
                {map.available ? (
                  <img src={`/previews/${map.image}`} alt={map.name} className="map-card-img" />
                ) : (
                  <div className="map-card-placeholder">
                    <span>{t('soon')}</span>
                  </div>
                )}
              </div>
              <div className="map-card-name">{map.name}</div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}

export default HomePage;