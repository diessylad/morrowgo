'use client';
import {useEffect,useLayoutEffect,useId,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {usePathname} from 'next/navigation';
import Link from './ReturnAwareLink';
import {Text,useLanguage} from '../i18n/Provider';
import LanguageSelect from '../i18n/LanguageSelect';
import s from './mobileMenu.module.css';
import brand from '../customer/customer.module.css';

export default function MobileMenu({links,secondary=[],children,account=false}) {
 const [open,setOpen]=useState(false), [mounted,setMounted]=useState(false), [entered,setEntered]=useState(false);
 const trigger=useRef(null),dialog=useRef(null),id=useId(),path=usePathname();
 const {t}=useLanguage();
 const close=()=>setOpen(false);
 useEffect(()=>setMounted(true),[]);
 useEffect(()=>setOpen(false),[path]);
 useLayoutEffect(()=>{
  if(!open){setEntered(false);return;}
  const frame=requestAnimationFrame(()=>setEntered(true));
  const previous=document.activeElement;
  const body=document.body,html=document.documentElement;
  const old={bodyOverflow:body.style.overflow,htmlOverflow:html.style.overflow};
  body.style.overflow='hidden';html.style.overflow='hidden';
  const blockBackgroundTouch=e=>{if(!e.target.closest('[data-mobile-menu-root],[data-language-menu]'))e.preventDefault();};
  document.addEventListener('touchmove',blockBackgroundTouch,{passive:false});
  const background=[...body.children].filter(el=>!el.hasAttribute('data-mobile-menu-root')&&!el.hasAttribute('data-language-menu'));
  const inertStates=background.map(el=>[el,el.inert]);background.forEach(el=>el.inert=true);
  dialog.current?.querySelector('button')?.focus();
  const key=e=>{
   if(document.querySelector('[role="menu"]'))return;
   if(e.key==='Escape'){e.preventDefault();close();}
   if(e.key==='Tab'){
    const controls=[...dialog.current.querySelectorAll('a[href],button,input,select,[tabindex="0"]')].filter(el=>!el.disabled&&el.getClientRects().length);
    const first=controls[0],last=controls[controls.length-1];
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}
   }
  };
  const resize=()=>{if(window.innerWidth>(account?700:1023))setOpen(false);};
  document.addEventListener('keydown',key);window.addEventListener('resize',resize);
  return ()=>{cancelAnimationFrame(frame);body.style.overflow=old.bodyOverflow;html.style.overflow=old.htmlOverflow;document.removeEventListener('touchmove',blockBackgroundTouch);inertStates.forEach(([el,state])=>el.inert=state);document.removeEventListener('keydown',key);window.removeEventListener('resize',resize);if(previous?.isConnected)previous.focus({preventScroll:true});};
 },[open,account]);
 const burger=(isOpen)=><span className={s.burger} data-open={isOpen} aria-hidden="true"><i/><i/><i/></span>;
 return <><button ref={trigger} className={`${s.trigger} ${account?s.account:''}`} type="button" aria-label={t('Open menu')} aria-expanded={open} aria-controls={open?id:undefined} onClick={()=>setOpen(true)}>{burger(false)}</button>
 {mounted&&open&&createPortal(<div data-mobile-menu-root className={s.overlay} ref={dialog} role="dialog" aria-modal="true" aria-label={t(account?'Account navigation':'Navigation')} id={id}>
 <div className={s.header}><Link href="/" className={`${brand.brand} ${s.brand}`} onClick={()=>setOpen(false)}><span className={brand.mark} aria-hidden="true"><i/><i/><i/><i/></span>MORROWGO</Link><button type="button" className={s.close} aria-label={t('Close menu')} onClick={close}>{burger(entered)}</button></div>
 <nav className={s.links} aria-label={t(account?'Account navigation':'Navigation')}>{links.map(({href,label,Icon,active},i)=><Link key={href} href={href} aria-current={active?'page':undefined} style={{'--index':i}} onClick={()=>setOpen(false)}>{Icon&&<Icon size={22}/>}<Text>{label}</Text></Link>)}</nav>
 <div className={s.secondary}>{secondary.map(({href,label})=><Link key={href} href={href} onClick={()=>setOpen(false)}><Text>{label}</Text></Link>)}<div className={s.language}><Text>Language</Text><LanguageSelect/></div>{children}</div>
 {!account&&<Link className={s.cta} href="/destinations" onClick={()=>setOpen(false)}><Text>Find your eSIM</Text><span aria-hidden="true">→</span></Link>}
 </div>,document.body)}</>;
}
