import { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { useLanguage } from '../context/LanguageContext';

function AuthModal({ onClose }) {
  const { t } = useLanguage();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const getErrorMessage = (code) => {
    switch (code) {
      case 'auth/email-already-in-use':
        return t('userExists');
      case 'auth/invalid-email':
        return t('invalidEmail');
      case 'auth/weak-password':
        return t('passwordLength');
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return t('wrongCredentials');
      default:
        return t('fillAllFields');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError(t('fillAllFields'));
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      onClose();
    } catch (err) {
      setError(getErrorMessage(err.code));
    }
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="login-modal" onClick={e => e.stopPropagation()}>
        <button className="login-close" onClick={onClose}>✕</button>
        <h2 className="login-title">{isLogin ? t('login') : t('register')}</h2>
        
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            className="login-input"
            placeholder="Email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(''); }}
            autoFocus
          />
          <input
            type="password"
            className="login-input"
            placeholder={t('password')}
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(''); }}
          />
          {error && <p className="login-error">{error}</p>}
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? '...' : (isLogin ? t('loginBtn') : t('registerBtn'))}
          </button>
        </form>

        <p className="auth-switch" onClick={() => { setIsLogin(!isLogin); setError(''); }}>
          {isLogin ? t('noAccount') : t('haveAccount')}
        </p>
      </div>
    </div>
  );
}

export default AuthModal;