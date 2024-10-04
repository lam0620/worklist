export const fallbackLng = 'en';
export const languages = ['en', 'jp', 'vi'];
export const defaultNS = 'translation';
export const cookieName = 'i18next';

export function getOptions(lng , ns = defaultNS) {
  return {
    supportedLngs: languages,
    //fallbackLng,
    lng,
    //fallbackNS: defaultNS,
    defaultNS,
    ns,
  };
}