'use client';
import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
export default function useHeroStories(enabled) {
  const hero = useRef(null);
  const reduced = useReducedMotion();
  const remaining = useRef(8000);
  const lastIndex = useRef(0);
  const [index,setIndex] = useState(0);
  const [stopped,setStopped] = useState(false);
  const [focus,setFocus] = useState(false);
  const [visible,setVisible] = useState(true);
  const [documentVisible,setDocumentVisible] = useState(true);
  const paused = !enabled || reduced || stopped || focus || !visible || !documentVisible;
  useEffect(() => {
    if (!enabled || !hero.current) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting),{threshold:.15});
    observer.observe(hero.current);
    const update = () => setDocumentVisible(!document.hidden); update();
    document.addEventListener('visibilitychange',update);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange',update); };
  },[enabled]);
  useEffect(() => {
    if (lastIndex.current !== index) { lastIndex.current = index; remaining.current = 8000; }
    if (paused) return;
    const start = performance.now();
    const timer = setTimeout(() => setIndex(value => (value + 1) % 2),remaining.current);
    return () => { clearTimeout(timer); remaining.current = Math.max(0,remaining.current - (performance.now() - start)); };
  },[index,paused]);
  return {hero,index,setIndex,paused,stopped,setStopped,setFocus,reduced};
}
