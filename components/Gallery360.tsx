"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { ChevronLeft, ChevronRight, Expand, Move3d } from "lucide-react";
import PhotoViewer, { type Photo } from "@/components/PhotoViewer";
import Gallery from "@/components/Gallery";
import type { SceneState } from "@/components/CinematicCanvas";

type Props = { photos: readonly Photo[]; state: React.RefObject<SceneState>; panoramaSrc?: string };

const skyVertex = /* glsl */ `
  varying vec3 vDir;
  void main() { vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;
const skyFragment = /* glsl */ `
  varying vec3 vDir;
  uniform float uTime;
  void main() {
    float h = vDir.y;
    vec3 zenith = vec3(0.03, 0.07, 0.11);
    vec3 sky = vec3(0.09, 0.17, 0.24);
    vec3 glow = vec3(0.95, 0.66, 0.40);
    vec3 sea = vec3(0.02, 0.05, 0.08);
    vec3 c = mix(sky, zenith, smoothstep(0.05, 0.7, h));
    float sun = pow(max(dot(normalize(vDir), normalize(vec3(0.0, 0.04, -1.0))), 0.0), 18.0);
    c += glow * (exp(-abs(h) * 14.0) * 0.55 + sun * 0.5);
    c = mix(c, sea, smoothstep(0.0, -0.08, h));
    gl_FragColor = vec4(c, 1.0);
    #include <colorspace_fragment>
  }
`;

/** A curved strip of the cylinder; `outward` faces away from the centre with mirrored UVs so photos read correctly from both sides. */
function arcPanel(radius: number, height: number, start: number, length: number, segments: number, outward: boolean) {
  const pos: number[] = [];
  const uv: number[] = [];
  const index: number[] = [];
  for (let i = 0; i <= segments; i++) {
    const f = i / segments;
    const th = start + f * length;
    const x = Math.sin(th) * radius;
    const z = -Math.cos(th) * radius;
    for (const j of [0, 1]) { pos.push(x, (j - 0.5) * height, z); uv.push(outward ? 1 - f : f, j); }
  }
  for (let i = 0; i < segments; i++) {
    const a = i * 2, b = a + 1, c = a + 2, d = a + 3;
    if (outward) index.push(a, b, c, b, d, c); else index.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(index);
  g.computeVertexNormals();
  return g;
}

/**
 * Depth-of-field without post-processing: photos sample a blurrier mip level the further they sit from the
 * focus distance, and fireflies off the focal plane swell into soft bokeh. Shared uniforms drive the focus pull.
 */
type Focus = { uFocus: { value: number }; uAperture: { value: number } };
function focusPhotos(material: THREE.Material, focus: Focus) {
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, focus);
    shader.vertexShader = "varying float vFocusDepth;\n" + shader.vertexShader.replace(
      "#include <project_vertex>", "#include <project_vertex>\n  vFocusDepth = -mvPosition.z;");
    shader.fragmentShader = "uniform float uFocus;\nuniform float uAperture;\nvarying float vFocusDepth;\n" + shader.fragmentShader.replace(
      "#include <map_fragment>",
      `#ifdef USE_MAP
        diffuseColor *= texture2D( map, vMapUv, min( abs( vFocusDepth - uFocus ) * uAperture, 5.0 ) );
      #endif`);
  };
}
function focusSparks(material: THREE.PointsMaterial, focus: Focus) {
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, focus);
    shader.vertexShader = "uniform float uFocus;\nuniform float uAperture;\nvarying float vCoc;\n" + shader.vertexShader.replace(
      "#include <fog_vertex>",
      `vCoc = min( abs( -mvPosition.z - uFocus ) * uAperture, 5.0 );
      gl_PointSize *= 1.0 + vCoc * 1.6;
      #include <fog_vertex>`);
    shader.fragmentShader = "varying float vCoc;\n" + shader.fragmentShader.replace(
      "#include <opaque_fragment>", "diffuseColor.a /= 1.0 + vCoc * vCoc * 0.9;\n#include <opaque_fragment>");
  };
}

const moves = ["Drone fly", "Orbit 360°", "Focus pull"] as const;

/** Cover-crop a texture onto a panel of the given aspect ratio. */
function coverTexture(tex: THREE.Texture, panelAspect: number) {
  const img = tex.image as { width: number; height: number };
  const imageAspect = img.width / img.height;
  if (imageAspect > panelAspect) { tex.repeat.set(panelAspect / imageAspect, 1); tex.offset.set((1 - tex.repeat.x) / 2, 0); }
  else { tex.repeat.set(1, imageAspect / panelAspect); tex.offset.set(0, (1 - tex.repeat.y) / 2); }
}

/**
 * 360° photo ring filmed as one continuous shot while the section scrolls: a drone flies in from an aerial
 * view, orbits a full 360° around the ring, dives over the rim and racks focus onto the first photo.
 * Guests can then drag/tilt to look around.
 */
export default function Gallery360({ photos, state, panoramaSrc }: Props) {
  const section = useRef<HTMLDivElement>(null);
  const mount = useRef<HTMLDivElement>(null);
  const control = useRef({ target: 0, go: (_dir: number) => {} });
  const [active, setActive] = useState(0);
  const [viewer, setViewer] = useState<number | null>(null);
  const [fallback, setFallback] = useState(false);
  const [landed, setLanded] = useState(false);
  const [move, setMove] = useState(0);

  useEffect(() => {
    const host = mount.current;
    const wrap = section.current;
    if (!host || !wrap) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isPhone = window.matchMedia("(max-width: 760px), (pointer: coarse)").matches;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    } catch {
      setFallback(true);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isPhone ? 1.6 : 1.75));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const fog = new THREE.FogExp2("#0a1620", 0.07);
    scene.fog = fog;
    const camera = new THREE.PerspectiveCamera(60, 1, 0.05, 120);
    const pmrem = new THREE.PMREMGenerator(renderer);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    const disposables: { dispose: () => void }[] = [env, pmrem];
    const focus: Focus = { uFocus: { value: 5 }, uAperture: { value: 0 } };

    /* Sky: a real 360° panorama when one is supplied, otherwise a dusk-over-the-sea gradient. */
    const skyGeometry = new THREE.SphereGeometry(60, 48, 24);
    let skyMaterial: THREE.Material;
    if (panoramaSrc) {
      const pano = new THREE.TextureLoader().load(panoramaSrc);
      pano.colorSpace = THREE.SRGBColorSpace;
      pano.mapping = THREE.EquirectangularReflectionMapping;
      skyMaterial = new THREE.MeshBasicMaterial({ map: pano, side: THREE.BackSide, fog: false, toneMapped: false });
      scene.background = pano;
      disposables.push(pano);
    } else {
      skyMaterial = new THREE.ShaderMaterial({ vertexShader: skyVertex, fragmentShader: skyFragment, uniforms: { uTime: { value: 0 } }, side: THREE.BackSide, depthWrite: false, fog: false });
    }
    const sky = new THREE.Mesh(skyGeometry, skyMaterial);
    if (!panoramaSrc) scene.add(sky);
    disposables.push(skyGeometry, skyMaterial);

    /* Ring of photographs */
    const n = photos.length;
    const slot = (Math.PI * 2) / n;
    const radius = 1.7 * Math.max(1, n / 6); // grow the ring with the photo count so each panel keeps its size
    const arc = slot * 0.84;
    const panelWidth = radius * arc;
    const panelHeight = panelWidth / 0.75;
    const floorY = -panelHeight / 2 - 0.22;
    const ring = new THREE.Group();
    const reflection = new THREE.Group();
    const pickables: THREE.Mesh[] = [];
    const loader = new THREE.TextureLoader();
    photos.forEach((photo, i) => {
      const start = i * slot - arc / 2;
      const inner = arcPanel(radius, panelHeight, start, arc, 24, false);
      const outer = arcPanel(radius + 0.004, panelHeight, start, arc, 24, true);
      const tex = loader.load(photo.src, (t) => coverTexture(t, 0.75));
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 4;
      const mat = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false });
      const reflected = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, color: "#4a5a66", transparent: true, opacity: 0.55 });
      focusPhotos(mat, focus);
      focusPhotos(reflected, focus);
      [inner, outer].forEach((g) => {
        const mesh = new THREE.Mesh(g, mat);
        mesh.userData.index = i;
        ring.add(mesh);
        pickables.push(mesh);
        reflection.add(new THREE.Mesh(g, reflected));
      });
      disposables.push(inner, outer, tex, mat, reflected);
    });

    const gold = new THREE.MeshStandardMaterial({ color: "#d9b46c", metalness: 1, roughness: 0.28 });
    const bandGeometry = new THREE.TorusGeometry(radius + 0.01, 0.016, 10, 220);
    [-1, 1].forEach((side) => {
      const band = new THREE.Mesh(bandGeometry, gold);
      band.rotation.x = Math.PI / 2;
      band.position.y = side * (panelHeight / 2 + 0.07);
      ring.add(band);
    });
    disposables.push(gold, bandGeometry);
    reflection.scale.y = -1;
    reflection.position.y = floorY * 2;
    scene.add(ring, reflection);

    // Glassy water floor that lets the mirrored ring show through, fading into fog.
    const floorGeometry = new THREE.CircleGeometry(50, 64);
    const floorMaterial = new THREE.MeshStandardMaterial({ color: "#07121a", metalness: 0.6, roughness: 0.18, transparent: true, opacity: 0.72 });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = floorY;
    scene.add(floor);
    disposables.push(floorGeometry, floorMaterial);

    // Fireflies of gold above the water.
    const count = isPhone ? 260 : 520;
    const pts = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 0.6 + Math.random() * 9;
      const a = Math.random() * Math.PI * 2;
      pts.set([Math.cos(a) * r, floorY + Math.random() * 4.5, Math.sin(a) * r], i * 3);
    }
    const sparkGeometry = new THREE.BufferGeometry();
    sparkGeometry.setAttribute("position", new THREE.BufferAttribute(pts, 3));
    const dot = document.createElement("canvas");
    dot.width = dot.height = 64;
    const dctx = dot.getContext("2d")!;
    const grad = dctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, "rgba(255,255,255,1)");
    grad.addColorStop(0.25, "rgba(255,240,200,0.6)");
    grad.addColorStop(1, "rgba(255,240,200,0)");
    dctx.fillStyle = grad;
    dctx.fillRect(0, 0, 64, 64);
    const dotTexture = new THREE.CanvasTexture(dot);
    const sparkMaterial = new THREE.PointsMaterial({ color: "#f3d79b", map: dotTexture, size: 0.07, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });
    focusSparks(sparkMaterial, focus);
    disposables.push(dotTexture);
    const sparks = new THREE.Points(sparkGeometry, sparkMaterial);
    scene.add(sparks);
    disposables.push(sparkGeometry, sparkMaterial);

    /* Camera shot: drone fly (aerial → orbit height) → orbit 360° around the ring → dive over the rim → focus pull */
    const k = radius / 1.7;              // paths were tuned for a 1.7-radius ring
    const landZ = radius - 2.65;         // land ~2.65 units from the front photo whatever the ring size
    const rim = panelHeight / 2 + 0.07;
    const centre = new THREE.Vector3(0, -0.1, 0);
    const orbit = { r0: 0, r1: 0, h0: 0, h1: 0 };
    const drone = new THREE.CatmullRomCurve3([0, 1, 2, 3].map(() => new THREE.Vector3()));
    const dive = new THREE.CatmullRomCurve3([new THREE.Vector3(), new THREE.Vector3(0, rim + 0.35, radius + 0.3), new THREE.Vector3(0, 0.05, landZ)]);
    /** Pulls the aerial and orbit legs back on narrow screens so the whole ring stays in frame (phones see far less sideways). */
    const frameShot = () => {
      const halfWidth = Math.atan(Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * camera.aspect);
      const fit = ((radius + 0.25) * 1.12) / Math.tan(halfWidth);
      const s = Math.max(1, fit / (radius * 2.1));
      const lift = (y: number) => centre.y + (y - centre.y) * s; // keep the same downward viewing angle when further out
      orbit.r0 = radius * 2.1 * s;
      orbit.r1 = radius * 1.85 * s;
      orbit.h0 = lift(rim + 0.8 * k);
      orbit.h1 = lift(rim + 0.45 * k);
      drone.points[0].set(0, lift(9 * k), 10 * k * s);
      drone.points[1].set(-2.6 * k * s, lift(5 * k), 7.5 * k * s);
      drone.points[2].set(-1.4 * k * s, orbit.h0 + 1.2 * k * s, orbit.r0 + 0.6 * k * s);
      drone.points[3].set(0, orbit.h0, orbit.r0); // arrives sideways, already moving along the orbit
      dive.points[0].set(0, orbit.h1, orbit.r1);
      drone.updateArcLengths();
      dive.updateArcLengths();
      fog.density = 0.07 / (k * s); // keep the aerial view clear when the ring (or the pull-back) grows
    };
    const frontPhoto = new THREE.Vector3(0, 0, -radius);
    const landLook = new THREE.Vector3(0, 0, landZ - 3);
    // Shot timeline in flight progress (0–1): drone | orbit | dive | focus pull, each eased in and out.
    const phases = [0, 0.26, 0.68, 0.84, 1];
    const local = (f: number, i: number) => THREE.MathUtils.smootherstep(f, phases[i], phases[i + 1]);

    let width = 1, height = 1;
    const resize = () => {
      const w = Math.max(host.clientWidth, 1);
      const h = Math.max(host.clientHeight, 1);
      if (w === width && Math.abs(h - height) < 2) return;
      width = w; height = h;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.fov = w / h < 0.8 ? 74 : w / h < 1.2 ? 64 : 54; // narrow phones need a wider lens to frame a panel
      camera.updateProjectionMatrix();
      frameShot();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    /* Drag / tap */
    const rot = { value: 0, target: 0, velocity: 0 };
    const drag = { active: false, x: 0, startX: 0, startY: 0, moved: 0, time: 0 };
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const canvas = renderer.domElement;
    const snap = () => { rot.target = Math.round(rot.target / slot) * slot; };
    control.current.go = (dir: number) => { rot.target = Math.round(rot.target / slot) * slot + dir * slot; lastInput = performance.now(); };
    let lastInput = 0;
    const onDown = (e: PointerEvent) => {
      drag.active = true; drag.x = drag.startX = e.clientX; drag.startY = e.clientY; drag.moved = 0; drag.time = performance.now();
      lastInput = performance.now();
    };
    const onMove = (e: PointerEvent) => {
      if (!drag.active) return;
      const dx = e.clientX - drag.x;
      drag.x = e.clientX;
      drag.moved = Math.max(drag.moved, Math.abs(e.clientX - drag.startX), Math.abs(e.clientY - drag.startY));
      rot.target -= dx * (Math.PI * 1.4) / width;
      lastInput = performance.now();
    };
    const onUp = (e: PointerEvent) => {
      if (!drag.active) return;
      drag.active = false;
      if (drag.moved < 8 && performance.now() - drag.time < 450) {
        const r = canvas.getBoundingClientRect();
        ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
        raycaster.setFromCamera(ndc, camera);
        const hit = raycaster.intersectObjects(pickables, false)[0];
        if (hit) setViewer(hit.object.userData.index as number);
      } else snap();
    };
    canvas.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);

    let inView = false;
    const io = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      if (!inView && state.current) state.current.covered = false;
      if (inView && !frame) frame = requestAnimationFrame(loop);
    }, { rootMargin: "100px 0px" });
    io.observe(wrap);

    const clock = new THREE.Clock();
    const pos = new THREE.Vector3();
    const target = new THREE.Vector3();
    let frame = 0;
    let flight = 0;
    let lastActive = -1;
    let lastMove = -1;
    let wasLanded = false;
    function loop() {
      frame = 0;
      if (!inView) return;
      const t = clock.getElapsedTime();
      const rect = wrap!.getBoundingClientRect();
      if (state.current) state.current.covered = rect.top <= 0 && rect.bottom >= window.innerHeight;
      const travel = Math.max(rect.height - window.innerHeight, 1);
      const p = THREE.MathUtils.clamp(-rect.top / travel, 0, 1);
      flight += ((reduced ? 1 : p) - flight) * 0.08;
      const f = THREE.MathUtils.smootherstep(flight, 0, 1);

      let bank = 0;
      let aperture = 0.35;
      if (f < phases[1]) {
        const d = local(f, 0);
        drone.getPointAt(d, pos);
        target.copy(centre);
        bank = Math.sin(d * Math.PI) * 0.1;
      } else if (f < phases[2]) {
        const o = local(f, 1);
        const a = o * Math.PI * 2;
        const r = THREE.MathUtils.lerp(orbit.r0, orbit.r1, o);
        pos.set(Math.sin(a) * r, THREE.MathUtils.lerp(orbit.h0, orbit.h1, o), Math.cos(a) * r);
        target.copy(centre);
        bank = -Math.sin(o * Math.PI) * 0.09; // lean into the turn
        aperture = 0.35 + Math.sin(o * Math.PI) * 0.3;
      } else {
        const v = local(f, 2);
        dive.getPointAt(v, pos);
        target.lerpVectors(centre, landLook, v);
        bank = Math.sin(v * Math.PI) * 0.06;
      }
      const hover = reduced ? 0 : (1 - f * 0.7);
      pos.y += Math.sin(t * 0.9) * 0.05 * hover;           // drone hover drift
      pos.x += Math.sin(t * 0.6) * 0.04 * hover;
      camera.position.copy(pos);
      camera.up.set(bank, 1, 0).normalize();
      camera.lookAt(target);

      // Focus: on the nearest photos while flying, then a rack from the fireflies at the lens onto the front photo.
      const nearest = Math.max(0.5, camera.position.distanceTo(centre) - radius);
      let focusAt = nearest;
      if (f >= phases[2]) {
        const v = local(f, 2);
        const pull = local(f, 3);
        focusAt = THREE.MathUtils.lerp(THREE.MathUtils.lerp(nearest, 0.35, v), camera.position.distanceTo(frontPhoto), pull);
        aperture = THREE.MathUtils.lerp(THREE.MathUtils.lerp(0.65, 1.3, v), 0.2, pull);
      }
      focus.uFocus.value = focusAt;
      focus.uAperture.value = reduced ? 0 : aperture;

      const currentMove = f < phases[1] ? 0 : f < phases[2] ? 1 : f < 0.985 ? 2 : 3;
      if (currentMove !== lastMove) { lastMove = currentMove; setMove(currentMove); }

      // Ring holds still while the camera orbits, then belongs to the guest (drag, arrows, tilt) with idle auto-turn.
      const idle = performance.now() - lastInput > 4000 && !drag.active;
      if (idle && !reduced && f > 0.98) rot.target += 0.0018;
      rot.value += (rot.target - rot.value) * 0.09;
      const tilt = state.current?.pointer.x ?? 0;
      ring.rotation.y = reflection.rotation.y = rot.value + tilt * 0.25;
      sparks.rotation.y = t * 0.02;

      const idx = ((Math.round(ring.rotation.y / slot) % n) + n) % n;
      if (idx !== lastActive) { lastActive = idx; setActive(idx); }
      const isLanded = f > 0.9;
      if (isLanded !== wasLanded) { wasLanded = isLanded; setLanded(isLanded); }

      renderer.render(scene, camera);
      frame = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(frame);
      if (state.current) state.current.covered = false;
      io.disconnect();
      ro.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
      canvas.remove();
    };
  }, [photos, state, panoramaSrc]);

  const go = useCallback((dir: number) => control.current.go(dir), []);

  if (fallback) return <Gallery photos={photos} />;

  return (
    <div className="g360" ref={section}>
      <div className="g360-stage">
        <div className="g360-canvas" ref={mount} aria-hidden="true" />
        <div className={`g360-ui ${landed ? "landed" : ""}`}>
          <div className="g360-top" aria-live="polite">
            <p className="g360-badge glass">
              <Move3d size={14} strokeWidth={1.6} />
              {move < moves.length ? <span className="g360-move"><b>{moves[move]}</b> · keep scrolling</span> : "Drag or tilt · 360°"}
            </p>
            <div className="g360-steps" aria-hidden="true">{moves.map((m, i) => <span key={m} className={i === Math.min(move, moves.length - 1) ? "on" : ""} />)}</div>
          </div>
          <div className="g360-bar">
            <button type="button" className="round-button" onClick={() => go(-1)} aria-label="Previous photo"><ChevronLeft size={20} /></button>
            <button type="button" className="g360-label glass" onClick={() => setViewer(active)} aria-label={`Open photo: ${photos[active].alt}`}>
              <em>{String(active + 1).padStart(2, "0")} / {String(photos.length).padStart(2, "0")}</em>
              <span>{photos[active].label}</span>
              <Expand size={15} strokeWidth={1.6} />
            </button>
            <button type="button" className="round-button" onClick={() => go(1)} aria-label="Next photo"><ChevronRight size={20} /></button>
          </div>
        </div>
      </div>
      <PhotoViewer photos={photos} index={viewer} onChange={setViewer} />
    </div>
  );
}
