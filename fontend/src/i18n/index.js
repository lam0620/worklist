import { createInstance } from 'i18next';
import resourcesToBackend from 'i18next-resources-to-backend';
import { initReactI18next } from 'react-i18next/initReactI18next';
import { getOptions} from './setting';


const initI18next = (lng, ns) => {
  const i18nInstance = createInstance();
  i18nInstance
    .use(initReactI18next)
    .use(resourcesToBackend((language, namespace) => import(`./locales/${language}/${namespace}.json`)))
    .init(getOptions(lng, ns));
  return i18nInstance;
};

export  function useTranslation(ns, options = {}) {
  const lg = localStorage.getItem('language') || 'en';
  const i18nextInstance = initI18next(lg, ns);
  return {
    t: i18nextInstance.getFixedT(lg, Array.isArray(ns) ? ns[0] : ns, options.keyPrefix),
    i18n: i18nextInstance,
  };
}
