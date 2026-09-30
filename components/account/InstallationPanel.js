'use client';
import {useEffect,useRef,useState,useId} from 'react';
import {AnimatePresence,motion,useReducedMotion} from 'motion/react';
import {createPortal} from 'react-dom';
import s from './installationPanel.module.css';
export default function InstallationPanel({esim,name,initiallyOpen=false}) {
 const [open,setOpen]=useState(initiallyOpen),[failed,setFailed]=useState(false),[copied,setCopied]=useState('');
 const [mounted,setMounted]=useState(false);
 useEffect(()=>setMounted(true),[]);
 const reduced=useReducedMotion(),dialog=useRef(null),trigger=useRef(null),title=useId();
 const fields=[['SM-DP+ address',esim.installDetails?.smdpAddress],['Activation code',esim.installDetails?.activationCode],['Confirmation code',esim.installDetails?.confirmationCode]].filter(([,value])=>value);
 useEffect(()=>{if(!open||!mounted)return;const previous=document.activeElement;const overflow=document.body.style.overflow;document.body.style.overflow='hidden';dialog.current?.focus();
 const key=e=>{if(e.key==='Escape')setOpen(false);if(e.key==='Tab'){const nodes=dialog.current?.querySelectorAll('button,a[href]');if(!nodes?.length)return;const first=nodes[0],last=nodes[nodes.length-1];if(e.shiftKey&&(document.activeElement===first||document.activeElement===dialog.current)){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}};
 document.addEventListener('keydown',key);return()=>{document.body.style.overflow=overflow;document.removeEventListener('keydown',key);(trigger.current||previous)?.focus();};},[open,mounted]);
 return <><motion.button ref={trigger} type="button" className={s.open} whileHover={reduced?undefined:{y:-1}} whileTap={reduced?undefined:{scale:.98}} onClick={()=>{setFailed(false);setOpen(true);}}>Show QR code</motion.button>
 {mounted&&createPortal(<AnimatePresence>{open&&<motion.div className={s.overlay} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:reduced?0:.2}} onClick={e=>{if(e.target===e.currentTarget)setOpen(false);}}>
 <motion.section ref={dialog} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={title} className={s.panel} initial={{scale:reduced?1:.98,y:reduced?0:8}} animate={{scale:1,y:0}} exit={{scale:reduced?1:.98}}>
 <button className={s.close} aria-label="Close installation details" onClick={()=>setOpen(false)}>×</button><h2 id={title}>{name}</h2>
 <p>Scan this QR code in your phone’s eSIM settings.</p>
 {failed?<p role="status">QR code is temporarily unavailable. Use the manual details below or try again.</p>:<img className={s.qr} src={`/api/account/esims/${esim.id}/qr`} width="256" height="256" alt="eSIM installation QR code" onError={()=>setFailed(true)}/>}
 {fields.map(([label,value])=><div className={s.field} key={label}><span>{label}</span><code>{value}</code></div>)}
 {fields.length>0&&<button className={s.open} onClick={async()=>{try{await navigator.clipboard.writeText(fields.map(([k,v])=>`${k}: ${v}`).join('\n'));setCopied('Copied.');}catch{setCopied('Could not copy. Select the details manually.');}}}>Copy activation details</button>}
 <p role="status">{copied}</p><button className={s.open} onClick={()=>setOpen(false)}>Close</button>
 </motion.section></motion.div>}</AnimatePresence>,document.body)}</>;
}
