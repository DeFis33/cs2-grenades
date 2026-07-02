import { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { useLanguage } from '../context/LanguageContext';

const disposableDomains = [
  'mailinator.com', 'tempmail.com', 'tempmail.org', '10minutemail.com',
  '10minutemail.org', 'guerrillamail.com', 'guerrillamail.org',
  'sharklasers.com', 'yopmail.com', 'yopmail.fr', 'throwaway.email',
  'trashmail.com', 'trashmail.org', 'fakeinbox.com', 'tempinbox.com',
  'emailondeck.com', 'spam4.me', 'spamgourmet.com', 'jetable.org',
  'dispostable.com', 'getairmail.com', 'mailnesia.com', 'spambox.us',
  'spamspot.com', 'tempsky.com', 'tmpmail.org', 'moakt.com', 'dropmail.me',
];

function AuthModal({ onClose }) {
  const { t } = useLanguage();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

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
      case 'auth/network-request-failed':
        return 'Ошибка сети. Проверьте подключение к интернету.';
      default:
        console.error('Firebase auth error:', code); // Логируем реальную ошибку
        return t('fillAllFields');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Валидация
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
        // 🔹 ВХОД
        await signInWithEmailAndPassword(auth, email, password);
        onClose();
      } else {
        // 🔹 РЕГИСТРАЦИЯ
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // 🔥 ОТПРАВКА ПИСЬМА - обернуто в отдельный try-catch
        try {
          await userCredential.user.sendEmailVerification();
          console.log('✅ Письмо отправлено на:', email);
          setSuccess(t('verifyEmail'));
          
          // Закрываем модалку через 3 секунды после показа сообщения
          setTimeout(() => {
            onClose();
          }, 3000);
          
        } catch (verifyError) {
          console.error('❌ Ошибка отправки письма:', verifyError.code, verifyError.message);
          // Аккаунт создан, но письмо не ушло
          setSuccess('Аккаунт создан! Но письмо не отправлено. Попробуйте позже.');
          
          // Логируем детали ошибки для отладки
          console.log('Детали ошибки верификации:', {
            code: verifyError.code,
            message: verifyError.message,
            email: email
          });
        }
      }
    } catch (err) {
      console.error('Ошибка аутентификации:', err.code, err.message);
      setError(getErrorMessage(err.code));
    }
    setLoading(false);
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setSuccess('');
    setEmail('');
    setPassword('');
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
            onChange={(e) => { setEmail(e.target.value); setError(''); setSuccess(''); }}
            autoFocus
          />
          <input
            type="password"
            className="login-input"
            placeholder={t('password')}
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(''); setSuccess(''); }}
          />
          
          {error && <p className="login-error">{error}</p>}
          {success && <p className="login-success">{success}</p>}
          
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? '...' : (isLogin ? t('loginBtn') : t('registerBtn'))}
          </button>
        </form>

        <p className="auth-switch" onClick={toggleMode}>
          {isLogin ? t('noAccount') : t('haveAccount')}
        </p>
      </div>
    </div>
  );
}

export default AuthModal;