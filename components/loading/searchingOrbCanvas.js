// Globe renderer extracted from the supplied HorizonX Searching Orb.
// Ported from Thinking Orbs by Jakub Antalik under the MIT License.
const DEFAULTS={"surface":"ink","scale":0.72,"speed":1,"playback":"play"};

const ORB_BASE_OPTS={"globe":{"latRings":17,"lonDensity":44,"rBase":0.6,"rDepth":1.7,"rBoost":1,"inkFar":0.62,"inkSpan":0.54,"rsPow":0.6,"rMin":0.3}};

const ORB_ANCHORS={"globe":{"small":{"speed":2.665,"count":0.105,"size":1.75,"extra":{"scanMul":4.335,"dimBase":0.45}},"large":{"speed":2.015,"count":0.42,"size":1.15,"extra":{"scanMul":4.08,"dimBase":0.45}}}};

const COUNT_PAIRS=[["latRings","lonDensity"],["rings","lonDensity"],["lanes","segs"]];

const COUNT_KEYS=["orbitN","ghostN","nodeN","strandN","signals"];

const DENSITY_KEYS=["iconD"];

const RADIUS_KEYS=["rBase","rDepth","rActive","rDot","ghostR","partR","partRDepth","nodeR","nodeRDepth"];

const lerp=function lerp(a, b, t) {
	return a + (b - a) * t;
};
const clamp01=function clamp01(v) {
	return v < 0 ? 0 : v > 1 ? 1 : v;
};
const angleDelta=function angleDelta(a, b) {
	return Math.atan2(Math.sin(a - b), Math.cos(a - b));
};
const makeProjector=function makeProjector(yaw, pitch, cx, cy, scale) {
	const sp = Math.sin(pitch);
	const cp = Math.cos(pitch);
	const sy = Math.sin(yaw);
	const cyw = Math.cos(yaw);
	return (x, y, z) => {
		const px = x * cyw + z * sy;
		const pz = -x * sy + z * cyw;
		const gy = y * cp - pz * sp;
		const gz = y * sp + pz * cp;
		return [
			cx + px * scale,
			cy - gy * scale,
			gz
		];
	};
};
const radiusScale=function radiusScale(size, power) {
	return (size / 300) ** power;
};
const paintDots=function paintDots(ctx, dots, dark) {
	for (const dot of dots) {
		// Slightly stronger graphite contrast; geometry and scan timing are unchanged.
		const alpha = Math.min(1, (dot.a ?? 1) * 1.3);
		const ink = Math.min(1, Math.max(0, dot.white));
		const value = Math.round((dark ? 1 - ink : ink) * 255);
		ctx.fillStyle = `rgba(${value},${value},${value},${alpha})`;
		ctx.beginPath();
		ctx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2);
		ctx.fill();
	}
};
const collectOrb=function collectOrb(dots, lines, rMin = .3) {
	const kept = [];
	for (const dot of dots) {
		if ((dot.a ?? 1) < .02) continue;
		dot.r = Math.max(rMin, dot.r);
		kept.push(dot);
	}
	kept.sort((a, b) => a.z - b.z);
	return {
		dots: kept,
		lines: lines.filter((line) => (line.a ?? 1) >= .02)
	};
};
const drawGlobe=function drawGlobe(size, time, opts) {
	const cx = size / 2;
	const cy = size / 2;
	const radius = size / 2 * .82;
	const pitch = .4 + .06 * Math.sin(time * .35);
	const project = makeProjector(time * .5, pitch, cx, cy, radius);
	const scan = time * (.5 + 1.2 * (opts.scanMul ?? 1));
	const rScale = radiusScale(size, opts.rsPow ?? .6);
	const dim = opts.dimBase ?? 1;
	const dots = [];
	const latRings = opts.latRings ?? 17;
	const lonDensity = opts.lonDensity ?? 44;
	for (let a = 0; a <= latRings; a++) {
		const lat = -Math.PI / 2 + a / latRings * Math.PI;
		const cl = Math.cos(lat);
		const sl = Math.sin(lat);
		const steps = Math.max(1, Math.round(Math.abs(cl) * lonDensity));
		for (let b = 0; b < steps; b++) {
			const lon = b / steps * 2 * Math.PI;
			const [x, y, z] = project(cl * Math.cos(lon), sl, cl * Math.sin(lon));
			const depth = (z + 1) / 2;
			const delta = angleDelta(lon + time * .5, scan);
			const glow = Math.exp(-(delta * delta) / .18) * Math.max(0, z);
			dots.push({
				x,
				y,
				z,
				r: ((opts.rBase ?? .6) + (opts.rDepth ?? 1.7) * depth + (opts.rBoost ?? 1) * glow) * rScale,
				white: (opts.inkFar ?? .62) - (opts.inkSpan ?? .54) * depth,
				a: dim + (1 - dim) * Math.min(1, glow)
			});
		}
	}
	return collectOrb(dots, [], opts.rMin);
};
const scaleCounts=function scaleCounts(opts, factor) {
	const next = { ...opts };
	const used = /* @__PURE__ */ new Set();
	const root = Math.sqrt(factor);
	for (const [a, b] of COUNT_PAIRS) {
		if (next[a] == null || next[b] == null || used.has(a) || used.has(b)) continue;
		next[a] = Math.max(2, Math.round(next[a] * root));
		next[b] = Math.max(2, Math.round(next[b] * root));
		used.add(a);
		used.add(b);
	}
	for (const key of COUNT_KEYS) {
		if (next[key] == null || next[key] === 0 || used.has(key)) continue;
		next[key] = Math.max(1, Math.round(next[key] * factor));
	}
	for (const key of DENSITY_KEYS) {
		if (next[key] == null) continue;
		next[key] = Math.max(.02, next[key] * factor);
	}
	return next;
};
const scaleRadii=function scaleRadii(opts, factor) {
	const next = { ...opts };
	for (const key of RADIUS_KEYS) {
		if (next[key] == null) continue;
		next[key] = next[key] * factor;
	}
	return next;
};
const presetFor=function presetFor(mode, px) {
	const anchors = ORB_ANCHORS[mode];
	const t = clamp01((px - 20) / 44);
	const count = lerp(anchors.small.count, anchors.large.count, t);
	const size = lerp(anchors.small.size, anchors.large.size, t);
	let opts = { ...ORB_BASE_OPTS[mode] };
	if (count !== 1) opts = scaleCounts(opts, count);
	if (size !== 1) opts = scaleRadii(opts, size);
	if (anchors.small.extra) {
		const extra = {};
		for (const key of Object.keys(anchors.small.extra)) extra[key] = lerp(anchors.small.extra[key], anchors.large.extra[key], t);
		opts = {
			...opts,
			...extra
		};
	}
	return {
		speed: lerp(anchors.small.speed, anchors.large.speed, t),
		opts
	};
};
const setupOrbCanvas=function setupOrbCanvas(canvas, width, height) {
	const dpr = Math.min(2, typeof devicePixelRatio !== "undefined" && devicePixelRatio || 1);
	const w = Math.max(1, Math.round(width));
	const h = Math.max(1, Math.round(height));
	if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
		canvas.width = Math.round(w * dpr);
		canvas.height = Math.round(h * dpr);
	}
	const ctx = canvas.getContext("2d");
	ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
	return {
		ctx,
		w,
		h
	};
};

export function mountSearchingOrb(canvas) {
 const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
 let frame = 0, destroyed = false, visible = true, lastPaint = 0;
 let width = canvas.clientWidth, height = canvas.clientHeight;
 const shouldAnimate = () => !destroyed && visible && !document.hidden && !motionQuery.matches;
 const paint = (timestamp = 0) => {
  frame = 0;
  if (destroyed) return;
  if (!lastPaint || timestamp - lastPaint >= 1000 / 30) {
   const { ctx, w, h } = setupOrbCanvas(canvas, width, height);
   ctx.clearRect(0, 0, w, h);
   const px = Math.max(8, Math.min(w, h) * DEFAULTS.scale);
   const { speed, opts } = presetFor('globe', px);
   const elapsed = shouldAnimate() ? timestamp * .001 * DEFAULTS.speed : .6;
   ctx.save(); ctx.translate((w - px) / 2, (h - px) / 2);
   // The source's paper surface keeps the supplied dots dark on MORROWGO's paper.
   paintDots(ctx, drawGlobe(px, elapsed * speed, opts).dots, false);
   ctx.restore(); lastPaint = timestamp;
  }
  if (shouldAnimate()) frame = requestAnimationFrame(paint);
 };
 const render = () => {
  if (frame) cancelAnimationFrame(frame);
  frame = 0; lastPaint = 0; paint(performance.now());
 };
 const resize = new ResizeObserver(() => {
  width = canvas.clientWidth; height = canvas.clientHeight; render();
 });
 const intersection = new IntersectionObserver(([entry]) => {
  visible = entry?.isIntersecting !== false; render();
 }, { rootMargin: '100px', threshold: .01 });
 resize.observe(canvas); intersection.observe(canvas);
 document.addEventListener('visibilitychange', render);
 motionQuery.addEventListener('change', render);
 render();
 return () => {
  destroyed = true; cancelAnimationFrame(frame);
  resize.disconnect(); intersection.disconnect();
  document.removeEventListener('visibilitychange', render);
  motionQuery.removeEventListener('change', render);
 };
}
