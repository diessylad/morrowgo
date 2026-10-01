 'use client';
import {useEffect,useRef,useState} from 'react';
import {useReducedMotion} from 'motion/react';
import {createPortal} from 'react-dom';
import {Confetti} from './confetti';
import s from './purchaseConfetti.module.css';
const options={spread:100,decay:.91,gravity:1,ticks:180,disableForReducedMotion:true,colors:['#0a0a0a','#4c6050','#7f8b79','#deded8','#fefefc']};
export default function PurchaseConfetti({active,celebrationKey}){
 const reduced=useReducedMotion(),canvas=useRef(null),fired=useRef(false);
 const [mounted,setMounted]=useState(false),[finished,setFinished]=useState(false);
 useEffect(()=>setMounted(true),[]);
 useEffect(()=>{
  if(!mounted||!active||!celebrationKey||reduced!==false||fired.current)return;
  const storageKey=`morrowgo:purchase-celebrated:${celebrationKey}`;
  try{if(sessionStorage.getItem(storageKey)){setFinished(true);return;}}catch{}
  let removal;
  const start=setTimeout(()=>{
   if(!canvas.current)return;
   fired.current=true;
   try{sessionStorage.setItem(storageKey,'1');}catch{}
   const mobile=window.matchMedia('(max-width:700px)').matches;
   canvas.current.fire({particleCount:mobile?55:90,startVelocity:mobile?30:40,scalar:mobile?.8:1,origin:{x:.5,y:.45}});
   removal=setTimeout(()=>setFinished(true),3500);
  },150);
  return()=>{clearTimeout(start);clearTimeout(removal);canvas.current?.reset();};
 },[mounted,active,celebrationKey,reduced]);
 return mounted&&active&&reduced===false&&!finished?createPortal(<Confetti ref={canvas} options={options} className={s.layer} aria-hidden="true"/>,document.body):null;
}
