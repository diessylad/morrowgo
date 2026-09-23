/*
 * HorizonX Waves — adapted from the user's unlocked waves.html asset.
 * Source: https://horizonx.so/shaders/waves
 * License: https://horizonx.so/terms (section 3), https://horizonx.so/pricing
 * Terms checked 2026-09-23. User confirms an active HorizonX membership
 * and authorizes integration into MORROWGO under its commercial license.
 * Copyright remains with HorizonX or its licensors; this is not an unrestricted asset.
 * Do not resell, redistribute, sublicense or publicly share raw asset files.
 * The accompanying copy prompt is personal/non-commercial by default unless
 * separately authorized. Its notice does not revoke a separate applicable license.
 * Preserve this attribution and docs/HORIZONX-WAVES-LICENSE.md with adaptations.
 */

// Original HorizonX shader. A softly warped neutral cloud preserves the
// reference topology with the HorizonX ink-to-white palette.
// Legacy state keys remain stable so saved presets continue to load.
const defaults = {
  plum: '#2B2B29', rose: '#DAD7D0', peach: '#ECE8DF', cream: '#F5F4EF',
  scale: 1.320, intensity: 0.490, warp: 0.006, detail: 1.728,
  contrast: 1.077, brightness: 0.070, saturation: 1.000, hue: 0,
  vignette: 0, blur: 0.0400, grain: 0.350, seed: 4984,
  rotate: 3.3685, offsetX: -0.130, offsetY: 0.050, drift: 0.400,
  speed: -0.670, animate: true
};
const controls = [
  { key: 'scale', label: 'Scale', min: 0.1, max: 4, step: 0.01 },
  { key: 'intensity', label: 'Wave intensity', min: 0, max: 1, step: 0.01 },
  { key: 'warp', label: 'Warp', min: 0, max: 1, step: 0.001 },
  { key: 'detail', label: 'Detail', min: 0.1, max: 5, step: 0.001 },
  { key: 'contrast', label: 'Contrast', min: 0, max: 2, step: 0.001 },
  { key: 'brightness', label: 'Brightness', min: -1, max: 1, step: 0.01 },
  { key: 'saturation', label: 'Saturation', min: 0, max: 2, step: 0.01 },
  { key: 'hue', label: 'Hue (radians)', min: -3.1416, max: 3.1416, step: 0.0001 },
  { key: 'vignette', label: 'Vignette', min: 0, max: 1, step: 0.01 },
  { key: 'blur', label: 'Softness', min: 0, max: 0.15, step: 0.001 },
  { key: 'grain', label: 'Grain', min: 0, max: 1, step: 0.01 },
  { key: 'seed', label: 'Seed', min: 0, max: 10000, step: 1 },
  { key: 'rotate', label: 'Rotation (radians)', min: -6.2832, max: 6.2832, step: 0.0001 },
  { key: 'offsetX', label: 'Horizontal offset', min: -2, max: 2, step: 0.01 },
  { key: 'offsetY', label: 'Vertical offset', min: -2, max: 2, step: 0.01 },
  { key: 'drift', label: 'Drift', min: 0, max: 1, step: 0.01 },
  { key: 'speed', label: 'Speed / direction', min: -2, max: 2, step: 0.01 }
];
const colourControls = [
  { key: 'plum', label: 'Ink' }, { key: 'rose', label: 'Graphite' },
  { key: 'peach', label: 'Silver' }, { key: 'cream', label: 'White' }
];
function resolveState(input = {}) {
  const state = { ...defaults };
  for (const control of controls) {
    const value = Number(input[control.key] ?? defaults[control.key]);
    state[control.key] = Number.isFinite(value)
      ? Math.min(control.max, Math.max(control.min, value)) : defaults[control.key];
  }
  for (const { key } of colourControls) {
    state[key] = /^#[0-9a-f]{6}$/i.test(input[key] ?? '') ? input[key] : defaults[key];
  }
  state.animate = typeof input.animate === 'boolean' ? input.animate : defaults.animate;
  return state;
}
const rgb = (hex) => [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255);
const vertexSource = `
attribute vec2 a_position;
void main() { gl_Position = vec4(a_position, 0.0, 1.0); }
`;
const fragmentSource = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec3 u_colors[8];
uniform vec4 u_scene;      // resolution.xy, time, colour count
uniform vec4 u_shape;      // scale, intensity, ribbon spacing, warp
uniform vec4 u_surface;    // detail, contrast, brightness, saturation
uniform vec4 u_finish;     // hue, vignette, softness, grain
uniform vec4 u_transform;  // seed, rotation, drift, reserved
uniform vec4 u_space;      // offset.xy, reserved
uniform vec4 u_cursor;     // reserved for the shared renderer contract

#define resolution u_scene.xy
#define time u_scene.z
#define scale u_shape.x
#define intensity u_shape.y
#define spacing u_shape.z
#define warp u_shape.w
#define detail u_surface.x
#define contrast u_surface.y
#define brightness u_surface.z
#define saturation u_surface.w
#define hue u_finish.x
#define vignette u_finish.y
#define softness u_finish.z
#define grain u_finish.w
#define seed mod(u_transform.x, 97.0)
#define rotation u_transform.y
#define drift u_transform.z
#define offset u_space.xy

float randomValue(vec2 point) {
  return fract(sin(dot(point, vec2(91.7, 263.5))) * 43758.17);
}

float smoothNoise(vec2 point) {
  vec2 cell = floor(point);
  vec2 local = fract(point);
  vec2 blend = local * local * (3.0 - 2.0 * local);
  float a = randomValue(cell + seed);
  float b = randomValue(cell + vec2(1.0, 0.0) + seed);
  float c = randomValue(cell + vec2(0.0, 1.0) + seed);
  float d = randomValue(cell + vec2(1.0, 1.0) + seed);
  return mix(mix(a, b, blend.x), mix(c, d, blend.x), blend.y);
}

float fbm(vec2 point) {
  float value = 0.0;
  float amplitude = 0.55;
  mat2 turn = mat2(0.78, -0.63, 0.63, 0.78);
  for (int octave = 0; octave < 5; octave++) {
    value += smoothNoise(point) * amplitude;
    point = turn * point * 2.02 + vec2(5.3, -3.7);
    amplitude *= 0.48;
  }
  return value;
}

vec3 palette(float value) {
  float scaled = clamp(value, 0.0, 1.0) * 3.0;
  vec3 first = mix(u_colors[0], u_colors[1], smoothstep(0.0, 1.0, scaled));
  vec3 second = mix(u_colors[1], u_colors[2], smoothstep(1.0, 2.0, scaled));
  vec3 third = mix(u_colors[2], u_colors[3], smoothstep(2.0, 3.0, scaled));
  return scaled < 1.0 ? first : (scaled < 2.0 ? second : third);
}

vec3 rotateHue(vec3 color, float angle) {
  vec3 axis = normalize(vec3(1.0));
  float cosine = cos(angle);
  float sine = sin(angle);
  return color * cosine + cross(axis, color) * sine
    + axis * dot(axis, color) * (1.0 - cosine);
}

void main() {
  vec2 screenUv = gl_FragCoord.xy / resolution;
  vec2 point = (gl_FragCoord.xy - 0.5 * resolution) / min(resolution.x, resolution.y);
  point *= scale * 2.0;

  float cosine = cos(rotation);
  float sine = sin(rotation);
  point = mat2(cosine, -sine, sine, cosine) * point;
  point += offset;
  point += drift * vec2(sin(time * 0.23), cos(time * 0.19));

  vec2 noisePoint = point * max(detail, 0.1);
  vec2 distortion = vec2(
    fbm(noisePoint * 0.72 + vec2(time * 0.035, seed * 0.013)),
    fbm(noisePoint * 0.69 + vec2(seed * 0.017, -time * 0.028))
  ) - 0.5;
  point += distortion * (0.55 + warp * 2.2);
  float cloud = fbm(point * 0.88 + vec2(time * 0.025, -time * 0.018));
  float fineCloud = fbm(point * 1.82 - vec2(time * 0.014, time * 0.019));
  float vertical = screenUv.y;
  float tone = clamp(vertical * 0.92 + (cloud - 0.5) * (0.42 + intensity * 0.65)
    + (fineCloud - 0.5) * 0.16, 0.0, 1.0);
  vec3 color = palette(tone);
  float haze = smoothstep(0.48, 0.88, cloud) * intensity;
  color = mix(color, u_colors[3], haze * 0.16);

  color = (color - 0.5) * contrast + 0.5;
  float luma = dot(color, vec3(0.299, 0.587, 0.114));
  color = mix(vec3(luma), color, saturation);
  color = rotateHue(color, hue);
  color += brightness;

  float edge = smoothstep(0.32, 0.82, length(screenUv - 0.5));
  color *= 1.0 - edge * vignette;
  float texture = randomValue(gl_FragCoord.xy + vec2(seed * 13.0, time * 59.0)) - 0.5;
  color += texture * grain * 0.22;
  // MORROWGO: restrained sage tint, leaving the original wave topology intact.
  color = mix(color, vec3(0.4353, 0.6196, 0.4706), haze * 0.025);
  gl_FragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`;

export function mountWaves(canvas, initial = {}, onError = () => {}) {
  let state = resolveState(initial);
  let gl, program, buffer, shaders = [], uniforms = {};
  let frame = 0, last = 0, time = 0, visible = true, destroyed = false, lost = false;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function release() {
    if (gl) {
      shaders.forEach((shader) => gl.deleteShader(shader));
      if (buffer) gl.deleteBuffer(buffer);
      if (program) gl.deleteProgram(program);
    }
    shaders = []; program = null; buffer = null;
  }
  function initialize() {
    gl = canvas.getContext('webgl', { alpha: false, antialias: false, powerPreference: 'low-power' });
    if (!gl) throw new Error('WebGL is unavailable in this browser.');
    const compile = (type, source) => {
      const shader = gl.createShader(type);
      shaders.push(shader);
      gl.shaderSource(shader, source); gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error('The shader could not be compiled.');
      return shader;
    };
    program = gl.createProgram();
    gl.attachShader(program, compile(gl.VERTEX_SHADER, vertexSource));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragmentSource));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('The shader could not be initialized.');
    gl.useProgram(program);
    buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    for (const key of ['u_colors[0]', 'u_scene', 'u_shape', 'u_surface', 'u_finish', 'u_transform', 'u_space', 'u_cursor']) {
      uniforms[key] = gl.getUniformLocation(program, key);
    }
    onError('');
  }
  function draw() {
    if (destroyed || lost || !program) return;
    const box = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rawWidth = Math.max(1, Math.round(box.width * dpr));
    const rawHeight = Math.max(1, Math.round(box.height * dpr));
    const pixelScale = Math.min(1, Math.sqrt(2_000_000 / (rawWidth * rawHeight)));
    const width = Math.max(1, Math.round(rawWidth * pixelScale));
    const height = Math.max(1, Math.round(rawHeight * pixelScale));
    if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
    gl.viewport(0, 0, width, height); gl.useProgram(program);
    const colors = colourControls.map(({ key }) => rgb(state[key]));
    while (colors.length < 8) colors.push(colors[3]);
    gl.uniform3fv(uniforms['u_colors[0]'], new Float32Array(colors.flat()));
    gl.uniform4f(uniforms.u_scene, width, height, time, 4);
    gl.uniform4f(uniforms.u_shape, state.scale, state.intensity, 0.840, state.warp);
    gl.uniform4f(uniforms.u_surface, state.detail, state.contrast, state.brightness, state.saturation);
    gl.uniform4f(uniforms.u_finish, state.hue, state.vignette, state.blur, state.grain);
    gl.uniform4f(uniforms.u_transform, state.seed, state.rotate, state.drift, 0);
    gl.uniform4f(uniforms.u_space, state.offsetX, state.offsetY, 0, 0);
    gl.uniform4f(uniforms.u_cursor, 0, 0, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
  function tick(now) {
    frame = 0;
    if (last) time += Math.min((now - last) / 1000, 0.1) * state.speed;
    last = now; draw(); schedule();
  }
  function schedule() {
    if (!frame && !destroyed && !lost && program && visible && !document.hidden && state.animate && Math.abs(state.speed) > 0.0001 && !motion.matches) {
      frame = requestAnimationFrame(tick);
    }
  }
  function refresh() {
    cancelAnimationFrame(frame); frame = 0; last = 0;
    if (motion.matches) time = 0;
    draw(); schedule();
  }
  function contextLost(event) {
    event.preventDefault(); lost = true; cancelAnimationFrame(frame); frame = 0;
    onError('The graphics context was interrupted. Waiting to reconnect…');
  }
  function contextRestored() {
    lost = false; shaders = []; program = null; buffer = null;
    try { initialize(); refresh(); } catch (error) { release(); onError(error.message); }
  }
  try { initialize(); } catch (error) { release(); onError(error.message); }
  const resize = new ResizeObserver(refresh); resize.observe(canvas);
  const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; refresh(); });
  intersection.observe(canvas);
  motion.addEventListener('change', refresh);
  document.addEventListener('visibilitychange', refresh);
  canvas.addEventListener('webglcontextlost', contextLost);
  canvas.addEventListener('webglcontextrestored', contextRestored);
  refresh();
  return {
    // Read back immediately after this draw; keep the live preview's clock intact.
    renderFrame(seconds) {
      const previous = time;
      time = state.animate ? seconds * state.speed : previous;
      try { draw(); } finally { time = previous; }
    },
    update(next) { state = resolveState(next); refresh(); },
    reset() { time = 0; refresh(); },
    destroy() {
      destroyed = true; cancelAnimationFrame(frame); resize.disconnect(); intersection.disconnect();
      motion.removeEventListener('change', refresh); document.removeEventListener('visibilitychange', refresh);
      canvas.removeEventListener('webglcontextlost', contextLost); canvas.removeEventListener('webglcontextrestored', contextRestored);
      release();
    }
  };
}

