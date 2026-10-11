import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Header from '../components/Header';
import { useLanguage } from '../context/LanguageContext';

const featuresList = [
  { id: 'mirage', name: 'Mirage', logo: '/icons/mirage-logo.png' },
];

function FeaturesPage({ isAdmin, onAdminLogin, onAdminLogout }) {
  const { lang, t } = useLanguage();

  useEffect(() => {
    document.title = t('featuresPageTitle');
  }, [lang, t]);

  return (
    <>
      <Helmet>
        <title>{t('featuresPageTitle')}</title>
      </Helmet>
      <Header
        isAdmin={isAdmin}
        setGuideOpen={() => {}}
        onAdminLogin={onAdminLogin}
        onAdminLogout={onAdminLogout}
      />

      <div className="home-page">
        <h1 className="page-section-title">{t('featuresTitle')}</h1>

        <div className="features-list">
          {featuresList.map(f => (
            <Link
              key={f.id}
              to={`/features/${f.id}`}
              className="feature-btn"
            >
              <img
                src={f.logo}
                alt={f.name}
                className="feature-btn-logo"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <span className="feature-btn-name">{f.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}

export default FeaturesPage;