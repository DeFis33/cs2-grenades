import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Header from '../components/Header';
import { useLanguage } from '../context/LanguageContext';

const FEATURES_GIST_ID = 'f572a18057668e868c81905b7e412be2';
const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN;
const FEATURES_URL = `https://api.github.com/gists/${FEATURES_GIST_ID}`;

const featuresData = {
  mirage: { name: 'Mirage' },
};

function FeaturesMapPage({ isAdmin, onAdminLogin, onAdminLogout }) {
  const { featureId } = useParams();
  const { lang, t } = useLanguage();
  const feature = featuresData[featureId];

  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [videoUrl, setVideoUrl] = useState('');
  const [nameRu, setNameRu] = useState('');
  const [nameEn, setNameEn] = useState('');

  useEffect(() => {
    document.title = `${t('featuresPageTitle')} - ${feature?.name || ''}`;
  }, [lang, t, feature]);

  useEffect(() => {
    fetch(FEATURES_URL)
      .then(res => res.json())
      .then(data => {
        const content = data.files['features.json']?.content;
        if (!content) {
          setFeatures([]);
          return;
        }
        const parsed = JSON.parse(content);
        setFeatures(parsed[featureId] || []);
      })
      .catch(() => setFeatures([]))
      .finally(() => setLoading(false));
  }, [featureId]);

  const saveToFile = useCallback(async (data) => {
    try {
      const res = await fetch(FEATURES_URL);
      const json = await res.json();
      const content = json.files['features.json']?.content;
      const allData = content ? JSON.parse(content) : {};

      allData[featureId] = data;

      await fetch(FEATURES_URL, {
        method: 'PATCH',
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          files: {
            'features.json': {
              content: JSON.stringify(allData, null, 2)
            }
          }
        })
      });
    } catch (err) {
      console.error('Ошибка сохранения:', err);
    }
  }, [featureId]);

  const updateFeatures = (newFeatures) => {
    setFeatures(newFeatures);
    saveToFile(newFeatures);
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (!nameRu && !nameEn) return;
    const newFeatures = [
      ...features,
      {
        id: Date.now(),
        videoUrl,
        name: { ru: nameRu, en: nameEn },
      },
    ];
    updateFeatures(newFeatures);
    setVideoUrl('');
    setNameRu('');
    setNameEn('');
    setShowForm(false);
  };

  const handleDelete = (id) => {
    const newFeatures = features.filter(f => f.id !== id);
    updateFeatures(newFeatures);
  };

  const getText = (obj) => {
    if (!obj) return '';
    if (typeof obj === 'string') return obj;
    return obj[lang] || obj.ru || obj.en || '';
  };

  if (!feature) {
    return (
      <>
        <Header
          isAdmin={isAdmin}
          setGuideOpen={() => {}}
          onAdminLogin={onAdminLogin}
          onAdminLogout={onAdminLogout}
        />
        <div className="home-page">
          <p style={{ color: '#a0aec0' }}>Not found</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{`${t('featuresPageTitle')} - ${feature.name}`}</title>
      </Helmet>
      <Header
        isAdmin={isAdmin}
        setGuideOpen={() => {}}
        onAdminLogin={onAdminLogin}
        onAdminLogout={onAdminLogout}
      />

      <div className="home-page">
        <h1 className="page-section-title">{feature.name}</h1>

        {isAdmin && (
          <button
            className="add-feature-btn"
            onClick={() => setShowForm(true)}
          >
            + {t('addFeature')}
          </button>
        )}

        {showForm && (
          <div className="modal-overlay" onClick={() => setShowForm(false)}>
            <div className="feature-form-modal" onClick={e => e.stopPropagation()}>
              <button className="login-close" onClick={() => setShowForm(false)}>✕</button>
              <h2 className="login-title">{t('addFeature')}</h2>
              <form onSubmit={handleAdd}>
                <input
                  type="text"
                  className="video-url-input"
                  placeholder={t('featurePlaceholderVideo')}
                  value={videoUrl}
                  onChange={e => setVideoUrl(e.target.value)}
                />
                <input
                  type="text"
                  className="video-url-input"
                  placeholder={t('featurePlaceholderNameRu')}
                  value={nameRu}
                  onChange={e => setNameRu(e.target.value)}
                  autoFocus
                />
                <input
                  type="text"
                  className="video-url-input"
                  placeholder={t('featurePlaceholderNameEn')}
                  value={nameEn}
                  onChange={e => setNameEn(e.target.value)}
                />
                <div className="feature-form-actions">
                  <button type="button" className="delete-line-btn" onClick={() => setShowForm(false)}>
                    {t('cancel')}
                  </button>
                  <button type="submit" className="login-btn">
                    {t('save')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {loading ? (
          <p style={{ color: '#a0aec0' }}>{t('loading')}</p>
        ) : (
          <div className="features-cards">
            {[...features].reverse().map((f, i) => (
              <div key={f.id} className="feature-card">
                <div className="feature-card-header">
                  <span className="feature-card-number">
                    {t('featureNumber')} #{features.length - i}
                  </span>
                  {isAdmin && (
                    <button
                      className="feature-card-delete"
                      onClick={() => handleDelete(f.id)}
                      title={t('deleteFeature')}
                    >✕</button>
                  )}
                </div>
                {f.videoUrl && (
                  <video src={f.videoUrl} controls className="feature-card-video" />
                )}
                {f.name && <div className="feature-card-name">{getText(f.name)}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default FeaturesMapPage;