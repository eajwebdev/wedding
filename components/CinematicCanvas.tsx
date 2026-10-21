"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { scenicImages } from "@/lib/wedding";

/** Shared, mutable state the page writes and the render loop reads (no React re-renders). */
export type SceneState = {
  progress: number;          // 0–1 page scroll
  heroFade: number;          // 0 at the top of the page → 1 once the hero has scrolled away
  opened: boolean;           // the guest tapped "Open invitation"
  openedAt: number;          // performance.now() of that tap
  pointer: { x: number; y: number }; // −1…1 from mouse or device tilt
  covered: boolean;          // another full-screen 3D stage hides this one, so skip drawing
};

/* ---------- Backdrop: original photos with depth parallax and a silk dissolve ---------- */
const photoVertex = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;

const photoFragment = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uImageA;
  uniform sampler2D uImageB;
  uniform vec2 uSizeA;
  uniform vec2 uSizeB;
  uniform vec2 uResolution;
  uniform vec2 uPointer;
  uniform float uMix;
  uniform float uTime;
  uniform float uSegment;
  uniform float uDim;

  vec2 cover(vec2 uv, vec2 size) {
    float viewport = uResolution.x / max(uResolution.y, 1.0);
    float imageAspect = size.x / max(size.y, 1.0);
    vec2 ratio = vec2(1.0);
    if (viewport > imageAspect) ratio.y = imageAspect / viewport;
    else ratio.x = viewport / imageAspect;
    return (uv - 0.5) * ratio + 0.5;
  }

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
  float noise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0; float a = 0.5;
    for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }
    return v;
  }

  vec3 samplePhoto(sampler2D tex, vec2 size, vec2 uv, float zoom) {
    // Fake depth: the foreground and the couple move more than the distant sky.
    float foreground = 1.0 - smoothstep(0.1, 0.9, uv.y);
    float subject = exp(-pow((uv.x - 0.5) * 2.6, 2.0) - pow((uv.y - 0.45) * 2.6, 2.0));
    float depth = 0.15 + 0.5 * foreground + 0.35 * subject;
    vec2 p = (uv - 0.5) / zoom + 0.5 + uPointer * 0.022 * depth;
    p.x += sin(uv.y * 8.0 + uTime * 0.35) * 0.0012 * foreground;
    return texture2D(tex, clamp(cover(p, size), 0.001, 0.999)).rgb;
  }

  void main() {
    vec2 uv = vUv;
    // Slow Ken Burns push on each photograph; the incoming one starts slightly wider.
    float zoomA = 1.06 + uMix * 0.05;
    float zoomB = 1.12 - uMix * 0.06;
    vec3 a = samplePhoto(uImageA, uSizeA, uv, zoomA);
    vec3 b = samplePhoto(uImageB, uSizeB, uv, zoomB);

    // Silk dissolve: an organic noise front sweeps across with a thin champagne edge.
    float n = fbm(uv * 3.2 + uSegment * 7.13 + uTime * 0.03);
    float front = uMix * 1.3 - 0.15;
    float m = smoothstep(front - 0.12, front + 0.12, n * 0.85 + uv.y * 0.15);
    m = 1.0 - m;
    float edge = smoothstep(0.0, 0.5, m) * smoothstep(1.0, 0.5, m) * step(0.001, uMix) * step(uMix, 0.999);
    vec3 color = mix(a, b, m);
    color += vec3(1.0, 0.82, 0.5) * edge * 0.22;

    // Cinematic grade: soft teal shadows, warm highlights, gentle desaturation.
    float luma = dot(color, vec3(0.299, 0.587, 0.114));
    color = mix(color, vec3(luma), 0.08);
    color = mix(color * vec3(0.92, 1.0, 1.04), color * vec3(1.06, 1.0, 0.92), smoothstep(0.25, 0.85, luma));

    // Drifting warm light leak.
    vec2 leakPos = vec2(0.85 + sin(uTime * 0.07) * 0.08, 0.92);
    float leak = exp(-distance(uv * vec2(uResolution.x / uResolution.y, 1.0), leakPos * vec2(uResolution.x / uResolution.y, 1.0)) * 2.4);
    color += vec3(1.0, 0.62, 0.32) * leak * 0.16;

    // Vignette + readable lower third + hero dimming.
    float vig = smoothstep(1.15, 0.35, length((uv - 0.5) * vec2(1.0, 1.15)));
    color *= mix(0.55, 1.0, vig);
    color *= mix(0.42, 1.0, smoothstep(0.0, 0.42, uv.y));
    color *= mix(1.0, 0.05, uDim);

    float grain = hash(uv * uResolution + floor(uTime * 12.0)) - 0.5;
    color += grain * 0.022;
    gl_FragColor = vec4(color, 1.0);
    #include <colorspace_fragment>
  }
`;

/* ---------- Gold dust: soft additive points with bokeh-sized stragglers ---------- */
const dustVertex = /* glsl */ `
  attribute float aScale;
  attribute float aSeed;
  uniform float uTime;
  uniform float uScroll;
  uniform float uPixelRatio;
  uniform float uSize;
  varying float vAlpha;
  varying float vBokeh;
  void main() {
    vec3 p = position;
    float rise = uTime * (0.06 + aSeed * 0.1) + uScroll * (2.0 + aSeed * 4.0);
    p.y = mod(p.y + rise + 6.0, 12.0) - 6.0;
    p.x += sin(uTime * 0.25 + aSeed * 6.2831) * 0.25;
    p.z += cos(uTime * 0.2 + aSeed * 12.0) * 0.2;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = min(uSize * aScale * uPixelRatio / -mv.z, 90.0 * uPixelRatio);
    float twinkle = 0.55 + 0.45 * sin(uTime * (0.8 + aSeed * 2.4) + aSeed * 40.0);
    vBokeh = step(2.0, aScale);
    vAlpha = twinkle * smoothstep(12.0, 6.0, -mv.z) * smoothstep(0.6, 2.2, -mv.z) * mix(1.0, 0.18, vBokeh);
  }
`;

const dustFragment = /* glsl */ `
  precision highp float;
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vAlpha;
  varying float vBokeh;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float core = pow(smoothstep(0.5, 0.0, d), 1.8);
    float disc = smoothstep(0.5, 0.42, d) * (0.55 + 0.45 * smoothstep(0.2, 0.48, d)); // bokeh rim
    float a = mix(core, disc, vBokeh) * vAlpha * uOpacity;
    if (a < 0.003) discard;
    gl_FragColor = vec4(uColor * (1.0 + core * 0.6), a);
  }
`;

/** Turns the transparent monogram into a gold colour map and a soft relief map (alpha → height). */
function buildEmblemMaps(image: HTMLImageElement) {
  const size = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(image, 0, 0, size, size);

  const relief = document.createElement("canvas");
  relief.width = relief.height = size;
  const rctx = relief.getContext("2d")!;
  const data = ctx.getImageData(0, 0, size, size);
  const px = data.data;
  for (let i = 0; i < px.length; i += 4) {
    const a = px[i + 3];
    px[i] = px[i + 1] = px[i + 2] = a;
    px[i + 3] = 255;
  }
  rctx.putImageData(data, 0, 0);
  rctx.filter = "blur(3px)"; // rounded, cast-metal edges
  rctx.drawImage(relief, 0, 0);

  const color = new THREE.CanvasTexture(canvas);
  color.colorSpace = THREE.SRGBColorSpace;
  const height = new THREE.CanvasTexture(relief);
  [color, height].forEach((t) => { t.anisotropy = 8; t.needsUpdate = true; });
  return { color, height };
}

function buildHaloTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, "rgba(255,214,150,0.32)");
  g.addColorStop(0.4, "rgba(240,190,110,0.1)");
  g.addColorStop(1, "rgba(240,190,110,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

type Props = { state: React.RefObject<SceneState>; onReady?: () => void };

export default function CinematicCanvas({ state, onReady }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const readyRef = useRef(onReady);
  readyRef.current = onReady;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isPhone = window.matchMedia("(max-width: 760px), (pointer: coarse)").matches;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: false, antialias: !isPhone, powerPreference: "high-performance" });
    } catch {
      readyRef.current?.();
      return; // the CSS photo and <img> monogram stay visible without WebGL
    }
    const pixelRatio = Math.min(window.devicePixelRatio || 1, isPhone ? 1.6 : 1.75);
    renderer.setPixelRatio(pixelRatio);
    renderer.setClearColor(0x05090d, 1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 40);
    camera.position.set(0, 0, 5);
    camera.lookAt(0, 0, 0);
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTexture;

    const manager = new THREE.LoadingManager();
    let readyFired = false;
    const fireReady = () => { if (!readyFired) { readyFired = true; readyRef.current?.(); } };
    manager.onLoad = fireReady;
    const readyTimeout = window.setTimeout(fireReady, 6000);

    /* Backdrop */
    const loader = new THREE.TextureLoader(manager);
    const textures = scenicImages.map(({ src }) => {
      const tex = loader.load(src);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.minFilter = THREE.LinearFilter;
      tex.generateMipmaps = false;
      return tex;
    });
    const photoUniforms = {
      uImageA: { value: textures[0] }, uImageB: { value: textures[1] },
      uSizeA: { value: new THREE.Vector2(scenicImages[0].width, scenicImages[0].height) },
      uSizeB: { value: new THREE.Vector2(scenicImages[1].width, scenicImages[1].height) },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uPointer: { value: new THREE.Vector2() },
      uMix: { value: 0 }, uTime: { value: 0 }, uSegment: { value: 0 }, uDim: { value: 1 },
    };
    const photoMaterial = new THREE.ShaderMaterial({
      uniforms: photoUniforms, vertexShader: photoVertex, fragmentShader: photoFragment,
      depthWrite: false, toneMapped: false,
    });
    const photoGeometry = new THREE.PlaneGeometry(1, 1);
    const photo = new THREE.Mesh(photoGeometry, photoMaterial);
    photo.position.z = -6;
    photo.renderOrder = -1;
    scene.add(photo);

    /* Gold dust */
    const count = isPhone ? 900 : 1800;
    const positions = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 11;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 2] = -5 + Math.random() * 8;
      scales[i] = Math.random() < 0.04 ? 2.5 + Math.random() * 3 : 0.35 + Math.random() * 0.9;
      seeds[i] = Math.random();
    }
    const dustGeometry = new THREE.BufferGeometry();
    dustGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    dustGeometry.setAttribute("aScale", new THREE.BufferAttribute(scales, 1));
    dustGeometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    const dustUniforms = {
      uTime: { value: 0 }, uScroll: { value: 0 }, uPixelRatio: { value: pixelRatio },
      uSize: { value: isPhone ? 46 : 58 }, uColor: { value: new THREE.Color("#f3d79b") }, uOpacity: { value: 0.9 },
    };
    const dustMaterial = new THREE.ShaderMaterial({
      uniforms: dustUniforms, vertexShader: dustVertex, fragmentShader: dustFragment,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false,
    });
    const dust = new THREE.Points(dustGeometry, dustMaterial);
    scene.add(dust);

    /* Emblem: the logo as a free-standing piece of gold — no background disc. The faces show the logo artwork
       exactly as drawn (unlit, so it never looks different from the PNG); stacked alpha-cut metal layers behind
       give it real thickness, so its edges catch light as it turns. */
    const medallion = new THREE.Group();
    const faceMaterial = new THREE.MeshBasicMaterial({ alphaTest: 0.32, side: THREE.DoubleSide, toneMapped: false });
    const edgeMaterial = new THREE.MeshStandardMaterial({
      color: "#9a7231", metalness: 1, roughness: 0.38, alphaTest: 0.32, side: THREE.DoubleSide,
    });
    const layerGeometry = new THREE.PlaneGeometry(2, 2);
    const layers = isPhone ? 9 : 14;
    const depth = 0.1;
    for (let i = 0; i < layers; i++) {
      const outer = i === 0 || i === layers - 1;
      const layer = new THREE.Mesh(layerGeometry, outer ? faceMaterial : edgeMaterial);
      layer.position.z = depth / 2 - (i / (layers - 1)) * depth;
      medallion.add(layer);
    }
    const haloTexture = buildHaloTexture();
    const haloMaterial = new THREE.MeshBasicMaterial({ map: haloTexture, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
    const halo = new THREE.Mesh(layerGeometry, haloMaterial);
    halo.renderOrder = 1;
    scene.add(halo);
    medallion.visible = false;
    scene.add(medallion);

    const monogram = new Image();
    monogram.decoding = "async";
    manager.itemStart("monogram");
    monogram.onload = () => {
      const { color, height } = buildEmblemMaps(monogram);
      faceMaterial.map = color;
      edgeMaterial.alphaMap = height;
      faceMaterial.needsUpdate = edgeMaterial.needsUpdate = true;
      manager.itemEnd("monogram");
    };
    monogram.onerror = () => manager.itemError("monogram");
    monogram.src = "/images/ej-logo.png";

    const key = new THREE.DirectionalLight("#fff1d6", 2.2);
    key.position.set(2.5, 3, 4);
    scene.add(key);
    const glint = new THREE.PointLight("#ffd79a", 6, 6, 1.6);
    scene.add(glint);

    /* Layout */
    let width = 1, height = 1;
    const worldAt = (distance: number) => {
      const h = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * distance;
      return { h, w: h * camera.aspect };
    };
    const resize = () => {
      const w = Math.max(mount.clientWidth, 1);
      const h = Math.max(mount.clientHeight, 1);
      if (w === width && Math.abs(h - height) < 2) return;
      width = w; height = h;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      const back = worldAt(camera.position.z - photo.position.z);
      photo.scale.set(back.w * 1.1, back.h * 1.1, 1);
      photoUniforms.uResolution.value.set(w, h);
    };
    resize();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);

    /** Places the 3D medallion exactly over an HTML placeholder so it lives in the page layout. */
    const target = new THREE.Vector3();
    let targetScale = 1;
    let placed = false;
    const anchor = () => {
      const selector = state.current?.opened ? "[data-medallion='hero']" : "[data-medallion='gate']";
      const el = document.querySelector<HTMLElement>(selector);
      if (!el) return false;
      const r = el.getBoundingClientRect();
      if (r.width === 0) return false;
      const world = worldAt(camera.position.z);
      const perPx = world.h / height;
      target.set((r.left + r.width / 2 - width / 2) * perPx, -(r.top + r.height / 2 - height / 2) * perPx, 0);
      targetScale = (r.width / 2) * perPx;
      return r.bottom > -40 && r.top < height + 40;
    };

    const motion = { x: 0, y: 0 };
    let frame = 0;
    let lastSegment = -1;
    let firstFrame = true;
    let visibleDoc = !document.hidden;
    const onVisibility = () => {
      visibleDoc = !document.hidden;
      if (visibleDoc && !frame) frame = requestAnimationFrame(loop);
    };
    document.addEventListener("visibilitychange", onVisibility);
    const clock = new THREE.Clock();

    function loop() {
      frame = 0;
      if (!visibleDoc) return;
      const s = state.current!;
      if (s.covered && !firstFrame) { frame = requestAnimationFrame(loop); return; }
      const t = reduced ? 0 : clock.getElapsedTime();
      const progress = Math.max(0, Math.min(0.999999, s.progress));

      // Photos crossfade across the scroll; each holds, then dissolves over the last ~40% of its scene.
      const weighted = progress * (scenicImages.length - 1);
      const segment = Math.min(scenicImages.length - 2, Math.floor(weighted));
      const mix = THREE.MathUtils.smoothstep(weighted - segment, 0.55, 0.98);
      if (segment !== lastSegment) {
        photoUniforms.uImageA.value = textures[segment];
        photoUniforms.uImageB.value = textures[segment + 1];
        photoUniforms.uSizeA.value.set(scenicImages[segment].width, scenicImages[segment].height);
        photoUniforms.uSizeB.value.set(scenicImages[segment + 1].width, scenicImages[segment + 1].height);
        photoUniforms.uSegment.value = segment;
        lastSegment = segment;
      }
      photoUniforms.uMix.value = mix;
      photoUniforms.uTime.value = t;
      const dimTarget = s.opened ? 0.64 + 0.24 * (1 - s.heroFade) : 0.9;
      photoUniforms.uDim.value = THREE.MathUtils.lerp(photoUniforms.uDim.value, dimTarget, 0.06);

      const ease = reduced ? 1 : 0.045;
      motion.x += (s.pointer.x - motion.x) * ease;
      motion.y += (s.pointer.y - motion.y) * ease;
      photoUniforms.uPointer.value.set(motion.x, motion.y);

      dustUniforms.uTime.value = t;
      dustUniforms.uScroll.value = progress;
      dust.rotation.y = motion.x * 0.12;
      dust.rotation.x = -motion.y * 0.08;

      // Medallion follows its placeholder, with an inertial glide between gate and hero.
      const onScreen = anchor();
      if (!placed && targetScale > 0 && onScreen) { medallion.position.copy(target); medallion.scale.setScalar(targetScale); placed = true; }
      const glide = reduced ? 1 : 0.12;
      medallion.position.lerp(target, glide);
      const sc = THREE.MathUtils.lerp(medallion.scale.x, targetScale, glide);
      medallion.scale.setScalar(sc);
      const sinceOpen = s.opened ? (performance.now() - s.openedAt) / 2200 : 0;
      const spin = s.opened && !reduced ? (1 - Math.pow(1 - Math.min(sinceOpen, 1), 4)) * Math.PI * 2 : 0;
      // Turns in place around its own centre and always settles facing the guest; sway kept small so it never looks skewed.
      const sway = s.opened ? Math.min(sinceOpen, 1) : 1; // no sway while the opening spin plays
      medallion.rotation.y = spin + (Math.sin(t * 0.5) * 0.06 + motion.x * 0.1) * sway;
      medallion.rotation.x = (Math.sin(t * 0.37) * 0.03 - motion.y * 0.07) * sway;
      medallion.visible = onScreen && faceMaterial.map !== null;
      halo.visible = medallion.visible;
      halo.position.set(medallion.position.x, medallion.position.y, -0.4);
      halo.scale.setScalar(sc * (1.5 + Math.sin(t * 0.8) * 0.06));
      glint.position.set(medallion.position.x + Math.cos(t * 0.6) * 2.2 * sc, medallion.position.y + Math.sin(t * 0.6) * 1.4 * sc, 2.4);

      // The camera stays fixed so the emblem lines up exactly with its centred HTML placeholder;
      // parallax comes from the photo shader and the dust layer instead.
      dust.position.set(-motion.x * 0.25, -motion.y * 0.18, 0);

      renderer.render(scene, camera);
      if (firstFrame) { firstFrame = false; document.documentElement.classList.add("webgl-on"); }
      frame = requestAnimationFrame(loop);
    }
    frame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(readyTimeout);
      resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      document.documentElement.classList.remove("webgl-on");
      [photoGeometry, dustGeometry, layerGeometry].forEach((g) => g.dispose());
      [photoMaterial, dustMaterial, faceMaterial, edgeMaterial, haloMaterial].forEach((m) => m.dispose());
      faceMaterial.map?.dispose();
      edgeMaterial.alphaMap?.dispose();
      haloTexture.dispose();
      textures.forEach((tx) => tx.dispose());
      envTexture.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [state]);

  return <div className="cinematic-webgl" ref={mountRef} aria-hidden="true" />;
}
