export const languages = ['en', 'de', 'es', 'ru', 'fr'];
export const languageNames = { en: 'English', de: 'Deutsch', es: 'Español', ru: 'Русский', fr: 'Français' };
export function resolveLanguage(saved, browser = []) {
  if (languages.includes(saved)) return saved;
  for (const candidate of browser) {
    const base = String(candidate).toLowerCase().split('-')[0];
    if (languages.includes(base)) return base;
  }
  return 'en';
}
