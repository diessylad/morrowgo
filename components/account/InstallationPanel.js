'use client';
import {useEffect,useRef,useState,useId} from 'react';
import {AnimatePresence,motion,useReducedMotion} from 'motion/react';
import {createPortal} from 'react-dom';
import s from './installationPanel.module.css';
import { Copy, QrCode, X } from 'lucide-react';
import { Text } from '../i18n/Provider';
import { ExperienceCard, SandboxNote } from './ExperienceUI';
export default function InstallationPanel({esim,name,initiallyOpen=false}) {
 const [open,setOpen]=useState(initiallyOpen),[failed,setFailed]=useState(false),[copied,setCopied]=useState('');
 const [mounted,setMounted]=useState(false);
 useEffect(()=>setMounted(true),[]);
 const reduced=useReducedMotion(),dialog=useRef(null),trigger=useRef(null),title=useId(),description=useId();
 const fields=[['SM-DP+ address',esim.installDetails?.smdpAddress],['Activation code',esim.installDetails?.activationCode],['Confirmation code',esim.installDetails?.confirmationCode]].filter(([,value])=>value);
 useEffect(()=>{if(!open||!mounted)return;const previous=document.activeElement;const overflow=document.body.style.overflow;document.body.style.overflow='hidden';dialog.current?.focus();
 const key=e=>{if(e.key==='Escape')setOpen(false);if(e.key==='Tab'){const nodes=dialog.current?.querySelectorAll('button,a[href]');if(!nodes?.length)return;const first=nodes[0],last=nodes[nodes.length-1];if(e.shiftKey&&(document.activeElement===first||document.activeElement===dialog.current)){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}};
 document.addEventListener('keydown',key);return()=>{document.body.style.overflow=overflow;document.removeEventListener('keydown',key);(trigger.current||previous)?.focus();};},[open,mounted]);
 return <><motion.button ref={trigger} type="button" className={s.open} whileHover={reduced?undefined:{y:-1}} whileTap={reduced?undefined:{scale:.98}} onClick={()=>{setFailed(false);setOpen(true);}}><QrCode size={17} aria-hidden="true"/><Text>Show QR code</Text></motion.button>
 {mounted&&createPortal(<AnimatePresence>{open&&<motion.div className={s.overlay} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:reduced?0:.2}} onClick={e=>{if(e.target===e.currentTarget)setOpen(false);}}>
 <motion.section ref={dialog} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={title} aria-describedby={description} className={s.panel} initial={{scale:reduced?1:.98,y:reduced?0:8}} animate={{scale:1,y:0}} exit={{scale:reduced?1:.98}}>
 <button className={s.close} aria-label="Close installation details" onClick={()=>setOpen(false)}><X size={21}/></button><span className={s.eyebrow}><Text>Your connection / Installation</Text></span><h2 id={title}>{name}</h2>
 <p id={description} className={s.intro}><Text>Scan this QR code in your phone’s eSIM settings.</Text></p>
 {failed?<div className={s.qrError}><p role="status"><Text>QR code is temporarily unavailable. Use the manual details below.</Text></p><button className={s.secondary} onClick={()=>setFailed(false)}><Text>Try QR again</Text></button></div>:<img className={s.qr} src={`/api/account/esims/${esim.id}/qr`} width="256" height="256" alt="eSIM installation QR code" onError={()=>setFailed(true)}/>}
 {(esim.sandbox || esim.planName?.endsWith(' · Sandbox')) && <><SandboxNote/><p className={s.sandboxHelp}><Text>Test eSIMs cannot be installed on a phone.</Text></p></>}<div className={s.help}><p><strong>iPhone</strong> <Text>Settings → Cellular → Add eSIM</Text></p><p><strong>Android</strong> <Text>Settings → SIM Manager → Add eSIM</Text></p><p><Text>Menu names may vary by phone. Keep an internet connection while installing.</Text></p><a href="/help#contact"><Text>Get installation help</Text></a></div>
 {fields.length>0&&<ExperienceCard className={s.manual}><h3><Text>Manual installation</Text></h3>{fields.map(([label,value])=><div className={s.field} key={label}><div><span><Text>{label}</Text></span><code>{value}</code></div><button className={s.copy} aria-label={`Copy ${label}`} onClick={async()=>{try{await navigator.clipboard.writeText(String(value));setCopied(`${label} copied.`);}catch{setCopied('Could not copy. Select the details manually.');}}}><Copy size={16} aria-hidden="true"/><Text>Copy</Text></button></div>)}</ExperienceCard>}
 <div className={s.actions}>{fields.length>0&&<button className={s.secondary} onClick={async()=>{try{await navigator.clipboard.writeText(fields.map(([k,v])=>`${k}: ${v}`).join('\n'));setCopied('Copied.');}catch{setCopied('Could not copy. Select the details manually.');}}}><Copy size={16} aria-hidden="true"/><Text>Copy all details</Text></button>}
 <button className={s.open} onClick={()=>setOpen(false)}><Text>Done</Text></button></div><p className={s.feedback} role="status" aria-live="polite">{copied}</p>
 </motion.section></motion.div>}</AnimatePresence>,document.body)}</>;
}
