'use client';
import {useEffect,useState} from 'react';
import {useRouter} from 'next/navigation';
export default function PendingEsims(){const router=useRouter();const[paused,setPaused]=useState(false);useEffect(()=>{let ticks=0;const timer=setInterval(()=>{if(document.hidden)return;router.refresh();if(++ticks>=12){clearInterval(timer);setPaused(true);}},5000);return()=>clearInterval(timer);},[router]);return <p role="status">Preparing your eSIM… {paused&&<button onClick={()=>router.refresh()}>Refresh status</button>}</p>;}
