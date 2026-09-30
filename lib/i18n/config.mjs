export const languages = ['en', 'de', 'es', 'ru', 'fr'];
export const languageNames = { en: 'English', de: 'Deutsch', es: 'Español', ru: 'Русский', fr: 'Français' };
export const defaultLanguage = 'en';
export function resolveLanguage(saved) {
  return languages.includes(saved) ? saved : defaultLanguage;
}
