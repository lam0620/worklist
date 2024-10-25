export const fallbackLng = 'en-US';
export const languages = ['en-US', 'ja-JP', 'vi'];
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