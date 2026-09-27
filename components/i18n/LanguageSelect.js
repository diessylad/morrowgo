'use client';
import { useLanguage } from './Provider';
import { languages, languageNames } from '../../lib/i18n/config.mjs';
import s from './controls.module.css';
export default function LanguageSelect() {
  const { language, setLanguage } = useLanguage();
  return <div className={s.language}><span aria-hidden="true">{language.toUpperCase()} ▾</span><select aria-label="Language / Sprache / Idioma / Язык / Langue" value={language} onChange={e => setLanguage(e.target.value)}>{languages.map(code => <option key={code} value={code} lang={code}>{languageNames[code]}</option>)}</select></div>;
}
