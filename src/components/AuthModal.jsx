import { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { auth } from '../firebase';
import { useLanguage } from '../context/LanguageContext';

const disposableDomains = [
  'mailinator.com',
  'tempmail.com',
  'tempmail.org',
  '10minutemail.com',
  '10minutemail.org',
  'guerrillamail.com',
  'guerrillamail.org',
  'sharklasers.com',
  'yopmail.com',
  'yopmail.fr',
  'throwaway.email',
  'trashmail.com',
  'trashmail.org',
  'fakeinbox.com',
  'tempinbox.com',
  'emailondeck.com',
  'spam4.me',
  'spamgourmet.com',
  'jetable.org',
  'dispostable.com',
  'getairmail.com',
  'mailnesia.com',
  'spambox.us',
  'spamspot.com',
  'tempsky.com',
  'tmpmail.org',
  'moakt.com',
  'dropmail.me',
];

function AuthModal({ onClose }) {
  const { t } = useLanguage();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const isDisposableEmail = (email) => {
    const domain = email.split('@')[1]?.toLowerCase();
    return disposableDomains.includes(domain);
  };

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
      case 'auth/too-many-requests':
        return t('tooManyRequests');
      default:
        return t('fillAllFields');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    if (!email || !password) {
      setError(t('fillAllFields'));
      setLoading(false);
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      setError(t('invalidEmail'));
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError(t('passwordLength'));
      setLoading(false);
      return;
    }

    if (isDisposableEmail(email)) {
      setError(t('disposableEmail'));
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        if (!userCredential.user.emailVerified) {
          setError(t('emailNotVerified'));
          setLoading(false);
          return;
        }
        onClose();
      } else {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(result.user);
        setSuccessMessage(t('verifyEmail'));
        setIsLogin(true);
      }
    } catch (err) {
      setError(getErrorMessage(err.code));
    }
    setLoading(false);
  };

  const handleResendVerification = async () => {
    if (!email) {
      setError(t('fillAllFields'));
      return;
    }
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(userCredential.user);
      setSuccessMessage(t('verifyEmail'));
      setError('');
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
            onChange={(e) => { setEmail(e.target.value); setError(''); setSuccessMessage(''); }}
            autoFocus
          />
          <input
            type="password"
            className="login-input"
            placeholder={t('password')}
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(''); setSuccessMessage(''); }}
          />
          {error && <p className="login-error">{error}</p>}
          {successMessage && <p className="login-success">{successMessage}</p>}
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? '...' : (isLogin ? t('loginBtn') : t('registerBtn'))}
          </button>
        </form>

        {isLogin && (
          <p className="auth-switch" onClick={handleResendVerification}>
            {t('resendVerification')}
          </p>
        )}

        <p className="auth-switch" onClick={() => { setIsLogin(!isLogin); setError(''); setSuccessMessage(''); }}>
          {isLogin ? t('noAccount') : t('haveAccount')}
        </p>
      </div>
    </div>
  );
}

export default AuthModal;