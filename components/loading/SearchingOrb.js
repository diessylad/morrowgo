'use client';
import { useEffect, useRef } from 'react';
import { mountSearchingOrb } from './searchingOrbCanvas';
import s from './searchingOrb.module.css';
export default function SearchingOrb() {
 const canvas = useRef(null);
 useEffect(() => mountSearchingOrb(canvas.current), []);
 return <canvas ref={canvas} className={s.canvas} aria-hidden="true" />;
}
