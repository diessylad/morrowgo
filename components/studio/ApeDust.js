"use client";
import { useEffect, useRef } from 'react';

const source = '/brand/editorial-ape-right.png';

export default function ApeDust() {
  const canvas = useRef(null);
  useEffect(() => {
    const element = canvas.current;
    const parent = element.parentElement;
    const original = parent.querySelector('img');
    const preference = matchMedia('(prefers-reduced-motion: reduce)');
    let cancelled = false;
    let stop = () => {};

    async function start() {
      if (preference.matches) return;
      let renderer, texture, planeGeometry, planeMaterial, geometry, material, resize, visibility;
      let frame = 0;
      let visible = true;
      let last = 0;
      let started = null;
      const restore = () => { if (original) original.style.removeProperty('opacity'); element.style.opacity = '0'; delete element.dataset.dustReady; };
      stop = () => {
        cancelAnimationFrame(frame);
        resize?.disconnect(); visibility?.disconnect();
        element.removeEventListener('webglcontextlost', lost);
        document.removeEventListener('visibilitychange', wake);
        restore();
        renderer?.dispose(); texture?.dispose(); planeGeometry?.dispose(); planeMaterial?.dispose(); geometry?.dispose(); material?.dispose();
        restore();
      };
      function lost(event) { event.preventDefault(); stop(); }
      function wake() { if (!document.hidden && visible && !cancelled && !preference.matches) { cancelAnimationFrame(frame); frame = requestAnimationFrame(draw); } }
      let scene, camera, uniforms;
      function draw(now) {
        if (preference.matches) { stop(); return; }
        if (cancelled || document.hidden || !visible) return;
        frame = requestAnimationFrame(draw);
        // Start only after the GPU is ready and the artwork is on screen.
        started ??= now;
        const elapsed = (now - started) / 1000;
        // Full intro rate, then quiet 24fps ambient grain; no offscreen rendering.
        if (elapsed > 2 && now - last < 1000 / 24) return;
        last = now;
        uniforms.uTime.value = elapsed;
        uniforms.uScroll.value = Math.min(window.scrollY / Math.max(innerHeight, 1), 1);
        try { renderer.render(scene, camera); } catch { stop(); return; }
        element.dataset.dustReady = 'true';
        element.dataset.dustTime = elapsed.toFixed(2);
        element.style.opacity = '1';
        if (original) original.style.opacity = '0';
      }
      try {
        const THREE = await import('three');
        if (cancelled || preference.matches) return;
        const img = new window.Image(); img.src = source; await img.decode();
        if (cancelled || preference.matches) return;
        const sampling = document.createElement('canvas'); sampling.width = 224; sampling.height = 280;
        const context = sampling.getContext('2d', { willReadFrequently: true });
        context.drawImage(img, 0, 0, 224, 280);
        const pixels = context.getImageData(0, 0, 224, 280).data;
        const mobile = innerWidth < 768;
        const count = mobile ? 900 : 2600;
        const positions = [], seeds = [], tones = [];
        let seed = 113;
        const random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
        for (let attempts = 0; positions.length < count * 3 && attempts < count * 100; attempts++) {
          const x = Math.floor(random() * 224), y = Math.floor(random() * 280);
          const offset = (y * 224 + x) * 4;
          const alpha = pixels[offset + 3] / 255;
          // The rear half and soft alpha edge only: never emit from the face.
          if (alpha < .08 || !(x < 130 || (y < 105 && x < 175))) continue;
          positions.push(x / 224, 1 - y / 280, 0);
          seeds.push(random()); tones.push(.12 + pixels[offset] / 255 * .36);
        }
        renderer = new THREE.WebGLRenderer({ canvas: element, alpha: true, antialias: false, powerPreference: 'low-power' });
        renderer.setClearColor(0x000000, 0);
        renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.25 : 1.75));
        renderer.debug.onShaderError = () => { throw new Error('Dust shader unavailable'); };
        scene = new THREE.Scene(); camera = new THREE.OrthographicCamera(0, 1, 1, 0, .1, 10); camera.position.z = 2;
        texture = new THREE.Texture(img); texture.needsUpdate = true;
        uniforms = { uTime: { value: 0 }, uScroll: { value: 0 }, uMap: { value: texture }, uMobile: { value: mobile ? .65 : 1 } };
        planeGeometry = new THREE.PlaneGeometry(1, 1);
        planeMaterial = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms,
          vertexShader: 'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
          fragmentShader: `uniform sampler2D uMap; uniform float uTime; uniform float uScroll; varying vec2 vUv;
          float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
          void main(){vec4 col=texture2D(uMap,vUv); float rear=max(1.-smoothstep(.35,.63,vUv.x), smoothstep(.60,.82,vUv.y)*(1.-smoothstep(.64,.80,vUv.x)));
          float pulse=smoothstep(.25,.75,uTime)*(1.-smoothstep(1.05,1.8,uTime));
          float grain=hash(floor(vUv*vec2(1122.,1402.)));
          float removed=rear*(pulse*.82+uScroll*.07)*smoothstep(.15,.65,grain);
          gl_FragColor=vec4(col.rgb,col.a*(1.-removed));}` });
        const ape = new THREE.Mesh(planeGeometry, planeMaterial); ape.position.set(.5,.5,0); scene.add(ape);
        geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions,3)); geometry.setAttribute('aSeed',new THREE.Float32BufferAttribute(seeds,1)); geometry.setAttribute('aTone',new THREE.Float32BufferAttribute(tones,1));
        material = new THREE.ShaderMaterial({ transparent:true, depthWrite:false, uniforms,
          vertexShader:`uniform float uTime;uniform float uScroll;uniform float uMobile;attribute float aSeed;attribute float aTone;varying float vAlpha;varying float vTone;
          void main(){float pulse=smoothstep(.25,.8,uTime)*(1.-smoothstep(1.1,1.85,uTime));
          float drift=(pulse*.16+uScroll*.04+.004*sin(uTime*.3+aSeed*6.28))*uMobile;
          vec3 p=position;p.x-=drift*(.3+aSeed);p.y+=drift*(.3+aSeed*.65);
          gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);gl_PointSize=1.5+aSeed*2.;
          vAlpha=(pulse*.78+.025+uScroll*.055)*smoothstep(.2,.5,uTime);vTone=aTone;}`,
          fragmentShader:`varying float vAlpha;varying float vTone;void main(){float d=length(gl_PointCoord-.5);float alpha=(1.-smoothstep(.1,.5,d))*vAlpha;gl_FragColor=vec4(vec3(vTone),alpha);}` });
        const dust = new THREE.Points(geometry,material); dust.position.z=.01; scene.add(dust);
        const size = () => renderer.setSize(parent.clientWidth, parent.clientHeight, false);
        size(); resize = new ResizeObserver(size); resize.observe(parent);
        element.addEventListener('webglcontextlost', lost);
        document.addEventListener('visibilitychange', wake);
        visibility = new IntersectionObserver(([entry]) => { visible=entry.isIntersecting; if(visible)wake();else cancelAnimationFrame(frame); }); visibility.observe(parent);
        renderer.render(scene,camera); // Only replace the fallback after a successful GPU frame.
        frame=requestAnimationFrame(draw);
      } catch { stop(); }
    }
    const change = () => { if(preference.matches){stop();}else start(); };
    preference.addEventListener('change',change);
    start();
    return () => { cancelled=true;stop();preference.removeEventListener('change',change); };
  }, []);
  return <canvas ref={canvas} aria-hidden="true" style={{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none',opacity:0}}/>;
}
