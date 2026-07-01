import { createContext, useContext, useState } from 'react';

const translations = {
  ru: {
    maps: 'Карты',
    editor: 'Редактор',
    exitEditor: 'Выйти из редактора',
    login: 'Вход в редактор',
    password: 'Введите пароль',
    wrongPassword: 'Неверный пароль',
    loginBtn: 'Войти',
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
    videoPlaceholder: 'Ссылка на видео (YouTube / Cloudinary)',
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
    homeTitle: 'CS Lineups - Выберите карту',
    mapTitle: 'CS Lineups',
  },
  en: {
    maps: 'Maps',
    editor: 'Editor',
    exitEditor: 'Exit Editor',
    login: 'Editor Login',
    password: 'Enter password',
    wrongPassword: 'Wrong password',
    loginBtn: 'Login',
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
    videoPlaceholder: 'Video URL (YouTube / Cloudinary)',
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
    homeTitle: 'CS Lineups - Select map',
    mapTitle: 'CS Lineups',
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