'use client';
import { createContext, useContext, useEffect, useState, useRef, useMemo, forwardRef, Fragment } from 'react';
import { resolveLanguage } from '../../lib/i18n/config.mjs';
import { translateText } from '../../lib/i18n/translate.mjs';
import dictionaries from '../../locales/dictionaries.json';
const Context = createContext({ language: 'en', setLanguage: () => {} });
export default function LanguageProvider({ children }) {
  const [language, update] = useState('en');
  useEffect(() => {
    let saved;
    try { saved = localStorage.getItem('morrowgo-language'); } catch {}
    update(resolveLanguage(saved, navigator.languages || [navigator.language]));
    const changed = event => { if (event.key === 'morrowgo-language') update(resolveLanguage(event.newValue, navigator.languages)); };
    window.addEventListener('storage', changed);
    return () => window.removeEventListener('storage', changed);
  }, []);
  useEffect(() => { document.documentElement.lang = language; }, [language]);
  const value = useMemo(() => ({ language, setLanguage: next => {
    const selected = resolveLanguage(next);
    update(selected);
    try { localStorage.setItem('morrowgo-language', selected); } catch {}
  } }), [language]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useLanguage() {
  const state = useContext(Context);
  return { ...state, t: text => translate(text, state.language) };
}
export function translate(text, language) { return translateText(text, language, dictionaries); }
export function Message({ message, values = {}, lines = false, localize = [] }) {
  const { t } = useLanguage();
  const text = t(message).replace(/\{(\w+)\}/g, (token, key) => (localize.includes(key) ? t(values[key]) : values[key]) ?? token);
  return lines ? text.split("\n").map((line, index) => <Fragment key={index}>{index > 0 && <br/>}{line}</Fragment>) : text;
}
export function Text({ children }) {
  const { t } = useLanguage();
  return Array.isArray(children) ? children.map((child, i) => typeof child === 'string' ? t(child) : child) : t(children);
}
export const Localized = forwardRef(function Localized({ as: Tag, children, ...props }, ref) {
  const { t } = useLanguage();
  for (const key of ['placeholder', 'title', 'aria-label', 'alt']) if (typeof props[key] === 'string') props[key] = t(props[key]);
  return <Tag {...props} ref={ref}>{children}</Tag>;
});

// Browser validation follows the selected website language, not the OS language.
export function AuthInput(props) {
  const { t, language } = useLanguage();
  const ref = useRef(null);
  useEffect(() => { ref.current?.setCustomValidity(''); }, [language]);
  return <Localized as="input" {...props} ref={ref} onInput={event => { event.currentTarget.setCustomValidity(''); props.onInput?.(event); }} onInvalid={event => {
    const input = event.currentTarget; input.setCustomValidity('');
    const validity = input.validity;
    const message = validity.valueMissing ? t('Please complete this field.') : validity.typeMismatch ? t('Please enter a valid email address.') : validity.tooShort ? t('Please use at least {min} characters.').replace('{min}', input.minLength) : '';
    input.setCustomValidity(message);
  }}/>;
}
