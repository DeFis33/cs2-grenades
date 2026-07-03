import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { LanguageProvider } from './context/LanguageContext';
import HomePage from './pages/HomePage';
import MapPage from './pages/MapPage';
import './App.css';

function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);

  const handleAdminLogin = () => setIsAdmin(true);
  const handleAdminLogout = () => {
    setIsAdmin(false);
    setGuideOpen(false);
  };

  return (
    <HelmetProvider>
      <LanguageProvider>
        <Router>
          <div className="app">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/map/:mapId" element={
                <MapPage 
                  isAdmin={isAdmin} 
                  guideOpen={guideOpen} 
                  setGuideOpen={setGuideOpen}
                  onAdminLogin={handleAdminLogin}
                  onAdminLogout={handleAdminLogout}
                />
              } />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </Router>
      </LanguageProvider>
    </HelmetProvider>
  );
}

export default App;