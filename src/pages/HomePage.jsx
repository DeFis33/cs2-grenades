import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Header from '../components/Header';
import { useLanguage } from '../context/LanguageContext';

const mapsList = [
  { id: 'dust2', name: 'Dust 2', image: 'dust2.png', available: true },
  { id: 'mirage', name: 'Mirage', image: null, available: false },
  { id: 'inferno', name: 'Inferno', image: null, available: false },
  { id: 'nuke', name: 'Nuke', image: null, available: false },
  { id: 'overpass', name: 'Overpass', image: null, available: false },
  { id: 'ancient', name: 'Ancient', image: null, available: false },
  { id: 'anubis', name: 'Anubis', image: null, available: false },
];

function HomePage({ isAdmin, onAdminLogin, onAdminLogout }) {
  const { lang, t } = useLanguage();

  useEffect(() => {
    document.title = t('homeTitle');
  }, [lang]);

  return (
    <>
      <Helmet>
        <title>{t('homeTitle')}</title>
      </Helmet>
      <Header 
        isAdmin={isAdmin}
        onAdminLogin={onAdminLogin}
        onAdminLogout={onAdminLogout}
      />

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