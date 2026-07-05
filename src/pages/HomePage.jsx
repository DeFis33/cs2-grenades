import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Header from '../components/Header';
import { useLanguage } from '../context/LanguageContext';

const mapsList = [
  { id: 'ancient', name: 'Ancient', preview: 'Ancient.png' },
  { id: 'anubis', name: 'Anubis', preview: 'Anubis.png' },
  { id: 'cache', name: 'Cache', preview: 'Cache.png' },
  { id: 'dust2', name: 'Dust 2', preview: 'Dust.png' },
  { id: 'inferno', name: 'Inferno', preview: 'Inferno.png' },
  { id: 'mirage', name: 'Mirage', preview: 'Mirage.png' },
  { id: 'nuke', name: 'Nuke', preview: 'Nuke.png' },
  { id: 'overpass', name: 'Overpass', preview: 'Overpass.png' },
  { id: 'train', name: 'Train', preview: 'Train.png' },
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
        setGuideOpen={() => {}}
        onAdminLogin={onAdminLogin}
        onAdminLogout={onAdminLogout}
      />

      <div className="home-page">
        <div className="maps-grid">
          {mapsList.map(map => (
            <Link
              key={map.id}
              to={`/map/${map.id}`}
              className="map-card available"
            >
              <div className="map-card-preview">
                <img 
                  src={`/previews/${map.preview}`} 
                  alt={map.name} 
                  className="map-card-img"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = '<div class="map-card-placeholder"><span>No image</span></div>';
                  }}
                />
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