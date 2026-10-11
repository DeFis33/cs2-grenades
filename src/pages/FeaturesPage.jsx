import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import Header from '../components/Header';
import { useLanguage } from '../context/LanguageContext';

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
        <div className="features-page-inner">
          <h1 className="page-section-title">{t('featuresTitle')}</h1>
          {/* здесь будет контент страницы фишек */}
        </div>
      </div>
    </>
  );
}

export default FeaturesPage;