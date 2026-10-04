'use client';
import { useEffect, useRef } from 'react';

// Adapted from the supplied Skiper39/Open Peeps canvas. The same 15x7
// sprite slicing, depth ordering and bidirectional walking use one native RAF
// instead of adding GSAP solely for this decoration. Attribution in docs.
export default function CrowdCanvas({ playing = true }) {
  const canvas = useRef(null);
  const play = useRef(playing);
  const controller = useRef(null);
  useEffect(() => { play.current = playing; controller.current?.(); }, [playing]);
  useEffect(() => {
    const node = canvas.current, ctx = node.getContext('2d');
    if (!ctx) return;
    const image = new window.Image();
    let frame = 0, disposed = false, visible = true, loaded = false, previous = 0;
    let width = 0, height = 0, ratio = 1, crowd = [];
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const reset = peep => {
      peep.direction = Math.random() > .5 ? 1 : -1;
      peep.x = peep.direction > 0 ? -peep.width : width + peep.width;
      peep.y = height - peep.height + 36 - 100 * Math.random() ** 2;
      peep.speed = (width + peep.width) / (12 + Math.random() * 12);
      peep.phase = Math.random() * Math.PI * 2;
      return peep;
    };
    const resize = () => {
      if (!loaded || disposed) return;
      ({width, height} = node.getBoundingClientRect());
      ratio = Math.min(devicePixelRatio || 1, 2);
      node.width = Math.round(width * ratio); node.height = Math.round(height * ratio);
      const tileWidth = image.naturalWidth / 15, tileHeight = image.naturalHeight / 7;
      const scale = Math.min(height / tileHeight * .7, width < 450 ? .44 : .62);
      crowd = Array.from({length:width < 450 ? 20 : 40}, () => {
        const tile = Math.floor(Math.random() * 105);
        const peep = reset({tile, width:tileWidth * scale, height:tileHeight * scale});
        peep.x = Math.random() * width;
        return peep;
      });
      draw();
    };
    const draw = () => {
      ctx.setTransform(ratio,0,0,ratio,0,0); ctx.clearRect(0,0,width,height);
      crowd.sort((a,b) => a.y - b.y).forEach(peep => {
        ctx.save(); ctx.translate(peep.x, peep.y + Math.sin(peep.phase) * 3);
        ctx.scale(peep.direction,1);
        ctx.drawImage(image,(peep.tile % 15) * image.naturalWidth / 15,
          Math.floor(peep.tile / 15) * image.naturalHeight / 7,
          image.naturalWidth / 15,image.naturalHeight / 7,0,0,peep.width,peep.height);
        ctx.restore();
      });
    };
    const tick = time => {
      frame = 0;
      const dt = Math.min((time - previous) / 1000 || 0,.04); previous = time;
      if (loaded && visible && !document.hidden && play.current && !reduced.matches) {
        crowd.forEach(peep => { peep.x += peep.direction * peep.speed * dt; peep.phase += dt * 8;
          if (peep.direction > 0 ? peep.x > width + peep.width : peep.x < -peep.width) reset(peep);
        }); draw();
      }
      if (!disposed && visible && !document.hidden && !reduced.matches && play.current) frame = requestAnimationFrame(tick);
    };
    const start = () => { if (!frame && loaded && visible && !document.hidden && !reduced.matches && play.current) { previous = 0; frame = requestAnimationFrame(tick); } };
    const update = () => { cancelAnimationFrame(frame); frame = 0; draw(); start(); };
    controller.current = update;
    const observer = new ResizeObserver(resize); observer.observe(node);
    const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update(); }); intersection.observe(node);
    document.addEventListener('visibilitychange',update); reduced.addEventListener('change',update);
    image.onload = () => { if (disposed) return; loaded = true; resize(); start(); };
    image.src = '/brand/open-peeps-sprite.png';
    return () => { disposed = true; controller.current = null; image.onload = null; cancelAnimationFrame(frame); observer.disconnect(); intersection.disconnect(); document.removeEventListener('visibilitychange',update); reduced.removeEventListener('change',update); };
  }, []);
  return <canvas ref={canvas} aria-hidden="true" style={{width:'100%',height:'100%',display:'block'}}/>;
}
