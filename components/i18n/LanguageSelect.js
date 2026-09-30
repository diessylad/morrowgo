'use client';
import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Check, ChevronDown } from 'lucide-react';
import { useLanguage } from './Provider';
import { languages, languageNames } from '../../lib/i18n/config.mjs';
import s from './controls.module.css';

export default function LanguageSelect() {
  const { language, setLanguage } = useLanguage();
  const reduced = useReducedMotion();
  const id = useId();
  const trigger = useRef(null);
  const menu = useRef(null);
  const items = useRef([]);
  const [position, setPosition] = useState(null);
  const open = Boolean(position);
  function close(restore = false) {
    setPosition(null);
    if (restore) trigger.current?.focus();
  }
  function show() {
    const box = trigger.current.getBoundingClientRect();
    const width = Math.min(204, window.innerWidth - 24);
    const height = Math.min(236, window.innerHeight - 24);
    setPosition({ left: Math.max(12, Math.min(box.right - width, window.innerWidth - width - 12)), top: Math.max(12, box.bottom + 8 + height <= window.innerHeight - 12 ? box.bottom + 8 : box.top - height - 8), width, maxHeight: height });
  }
  useEffect(() => {
    if (!open) return;
    items.current[languages.indexOf(language)]?.focus();
    const outside = event => { if (!menu.current?.contains(event.target) && !trigger.current?.contains(event.target)) close(); };
    const escape = event => { if (event.key === 'Escape') { event.preventDefault(); close(true); } };
    const reposition = () => close();
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, { passive: true });
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); window.removeEventListener('resize', reposition); window.removeEventListener('scroll', reposition); };
  }, [open, language]);
  function navigate(event, index) {
    let next;
    if (event.key === 'ArrowDown') next = (index + 1) % languages.length;
    if (event.key === 'ArrowUp') next = (index + languages.length - 1) % languages.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = languages.length - 1;
    if (next !== undefined) { event.preventDefault(); items.current[next]?.focus(); }
    if (event.key === 'Tab') { close(); trigger.current?.focus(); }
  }
  return <div className={s.language}>
    <button ref={trigger} type="button" className={s.trigger} aria-label={`Language: ${languageNames[language]}`} aria-haspopup="menu" aria-expanded={open} aria-controls={open ? id : undefined} onClick={() => open ? close(true) : show()} onKeyDown={event => { if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); show(); } }}>
      <span>{language.toUpperCase()}</span><ChevronDown size={12} aria-hidden="true"/>
    </button>
    {typeof document !== 'undefined' && createPortal(<AnimatePresence>{open && <motion.div ref={menu} id={id} role="menu" aria-label="Language" className={s.menu} style={position} initial={reduced ? false : { opacity: 0, y: -6, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: reduced ? 0 : -4, scale: reduced ? 1 : .98 }} transition={{ duration: reduced ? 0 : .16, ease: [.16, 1, .3, 1] }}>
      {languages.map((code, index) => <button key={code} ref={node => { items.current[index] = node; }} type="button" role="menuitemradio" aria-checked={language === code} tabIndex={-1} lang={code} className={s.item} onKeyDown={event => navigate(event, index)} onClick={() => { setLanguage(code); close(true); }}><span className={s.check}>{language === code && <Check size={15} aria-hidden="true"/>}</span><span>{languageNames[code]}</span><small>{code.toUpperCase()}</small></button>)}
    </motion.div>}</AnimatePresence>, document.body)}
  </div>;
}
