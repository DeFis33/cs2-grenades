import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { LanguageProvider } from './context/LanguageContext';
import HomePage from './pages/HomePage';
import MapPage from './pages/MapPage';
import './App.css';

const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;

function App() {
  const [editMode, setEditMode] = useState(() => {
    const savedPassword = localStorage.getItem('cs2_editor_auth');
    return savedPassword === ADMIN_PASSWORD;
  });

  const handleLogout = () => {
    setEditMode(false);
    localStorage.removeItem('cs2_editor_auth');
  };

  const handleLoginSuccess = () => {
    setEditMode(true);
    localStorage.setItem('cs2_editor_auth', ADMIN_PASSWORD);
  };

  return (
    <HelmetProvider>
      <LanguageProvider>
        <Router>
          <div className="app">
            <Routes>
              <Route path="/" element={<HomePage editMode={editMode} onLogout={handleLogout} />} />
              <Route path="/map/:mapId" element={<MapPage editMode={editMode} onLoginSuccess={handleLoginSuccess} onLogout={handleLogout} />} />
            </Routes>
          </div>
        </Router>
      </LanguageProvider>
    </HelmetProvider>
  );
}

export default App;