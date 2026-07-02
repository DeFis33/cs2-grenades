import { createContext, useContext, useState } from 'react';

const translations = {
  ru: {
    maps: 'Карты',
    editor: 'Редактор',
    exitEditor: 'Выйти',
    login: 'Вход',
    register: 'Регистрация',
    password: 'Пароль',
    wrongPassword: 'Неверный пароль',
    loginBtn: 'Войти',
    registerBtn: 'Зарегистрироваться',
    noAccount: 'Нет аккаунта? Зарегистрироваться',
    haveAccount: 'Уже есть аккаунт? Войти',
    fillAllFields: 'Заполните все поля',
    invalidEmail: 'Некорректный email',
    passwordLength: 'Пароль должен быть не менее 6 символов',
    userExists: 'Пользователь с таким email уже существует',
    wrongCredentials: 'Неверный email или пароль',
    profile: 'Профиль',
    selectMap: 'Выберите карту',
    soon: 'Скоро',
    loading: 'Загрузка...',
    shiftHint: 'Shift+клик по карте - поставить конечную точку',
    throwType: 'Тип броска:',
    side: 'Сторона:',
    notSelected: 'Не выбрано',
    deleteTrajectory: 'Удалить траекторию',
    deleteVideo: 'Удалить видео',
    noVideo: 'Видео не добавлено',
    videoPlaceholder: 'Ссылка на видео',
    imagePlaceholder: 'Ссылка на изображение',
    groupGrenades: 'гранат',
    collapse: 'Свернуть',
    guide: 'Управление',
    guideClickMap: 'по карте - создать',
    guideClickMarker: 'по метке - редактировать',
    guideCtrl: 'в группу',
    guideShiftMarker: 'по метке - траектория',
    guideShiftMap: 'по карте - конец',
    guideRightClick: 'удалить',
    guideGroupClick: 'по группе - развернуть',
    guideDrag: 'Перетащить метку на другую - в группу',
    homeTitle: 'CSLINEUPS - Выберите карту',
    mapTitle: 'CSLINEUPS',
    guideMobileGroupDrag: 'Зажать группу - переместить',
    guideMobileTrajectory: 'Кнопка траектория и удалить при нажатии',
    all: 'Все',
    images: 'Изображения:',
    fullSize: 'Полный размер',
    screenshot: 'Скриншот',
    sideAny: 'Любая',
    grenadeName: 'Название гранаты:',
    grenadeNamePlaceholder: 'Введите название',
  },
  en: {
    maps: 'Maps',
    editor: 'Editor',
    exitEditor: 'Logout',
    login: 'Login',
    register: 'Register',
    password: 'Password',
    wrongPassword: 'Wrong password',
    loginBtn: 'Login',
    registerBtn: 'Register',
    noAccount: 'No account? Register',
    haveAccount: 'Already have an account? Login',
    fillAllFields: 'Fill all fields',
    invalidEmail: 'Invalid email',
    passwordLength: 'Password must be at least 6 characters',
    userExists: 'User with this email already exists',
    wrongCredentials: 'Wrong email or password',
    profile: 'Profile',
    selectMap: 'Select map',
    soon: 'Soon',
    loading: 'Loading...',
    shiftHint: 'Shift+click on map - set endpoint',
    throwType: 'Throw type:',
    side: 'Side:',
    notSelected: 'Not selected',
    deleteTrajectory: 'Delete trajectory',
    deleteVideo: 'Delete video',
    noVideo: 'No video added',
    videoPlaceholder: 'Video URL',
    imagePlaceholder: 'Image URL',
    groupGrenades: 'grenades',
    collapse: 'Collapse',
    guide: 'Controls',
    guideClickMap: 'on map - create',
    guideClickMarker: 'on marker - edit',
    guideCtrl: 'add to group',
    guideShiftMarker: 'on marker - trajectory',
    guideShiftMap: 'on map - endpoint',
    guideRightClick: 'delete',
    guideGroupClick: 'on group - expand',
    guideDrag: 'Drag marker onto another - group',
    homeTitle: 'CSLINEUPS - Select map',
    mapTitle: 'CSLINEUPS',
    guideMobileGroupDrag: 'Hold group - move',
    guideMobileTrajectory: 'Trajectory and delete buttons on tap',
    all: 'All',
    images: 'Images:',
    fullSize: 'Full size',
    screenshot: 'Screenshot',
    sideAny: 'Any',
    grenadeName: 'Grenade name:',
    grenadeNamePlaceholder: 'Enter name',
  },
};

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'en');

  const changeLang = (newLang) => {
    setLang(newLang);
    localStorage.setItem('lang', newLang);
  };

  const t = (key) => translations[lang]?.[key] || translations['en']?.[key] || key;

  return (
    <LanguageContext.Provider value={{ lang, setLang: changeLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}