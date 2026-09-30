'use client';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import SearchingOrb from './SearchingOrb';
import s from './searchingOrb.module.css';
export default function DestinationLoading({ loading, error, children }) {
 const [visible, setVisible] = useState(false);
 const reduced = useReducedMotion();
 useEffect(() => {
  if (!loading) { setVisible(false); return; }
  const timer = setTimeout(() => setVisible(true), 180);
  return () => clearTimeout(timer);
 }, [loading]);
 const transition = { duration: reduced ? 0 : .28 };
 return <div aria-busy={loading}>
  <AnimatePresence mode="wait" initial={false}>
   {loading ? visible && <motion.div key="loading" role="status" className={s.loading}
    initial={{ opacity: 0, scale: reduced ? 1 : .97 }} animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: reduced ? 1 : .98 }} transition={transition}>
    <SearchingOrb /><p>Searching destinations…</p>
   </motion.div> : <motion.div key={error ? 'error' : 'results'} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={transition}>{children}</motion.div>}
  </AnimatePresence>
 </div>;
}
