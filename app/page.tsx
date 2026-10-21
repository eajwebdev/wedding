"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ArrowDown, CalendarDays, CalendarPlus, Church, Heart, MailOpen, MapPin,
  Shirt, Sparkles, Volume2, VolumeX, Wine,
} from "lucide-react";
import { galleryPhotos, wedding } from "@/lib/wedding";
import type { SceneState } from "@/components/CinematicCanvas";
import SplitTitle from "@/components/SplitTitle";
import Countdown from "@/components/Countdown";
import RsvpForm from "@/components/RsvpForm";
import ProgramTimeline from "@/components/ProgramTimeline";
import ColorMotif from "@/components/ColorMotif";
import GiftGuide from "@/components/GiftGuide";

const CinematicCanvas = dynamic(() => import("@/components/CinematicCanvas"), { ssr: false });
const Gallery360 = dynamic(() => import("@/components/Gallery360"), { ssr: false, loading: () => <div className="g360" /> });

const clamp = (v: number, min = -1, max = 1) => Math.min(max, Math.max(min, v));

function downloadCalendar() {
  const start = new Date(wedding.dateISO);
  if (Number.isNaN(start.getTime())) return;
  const end = new Date(start.getTime() + 5 * 3600000);
  const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const esc = (s: string) => s.replace(/([,;\\])/g, "\\$1");
  const ics = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Edwin & Jochel//Wedding//EN", "BEGIN:VEVENT",
    "UID:edwin-jochel-wedding@invitation", `DTSTAMP:${stamp(new Date())}`, `DTSTART:${stamp(start)}`, `DTEND:${stamp(end)}`,
    `SUMMARY:${esc(`${wedding.names.first} & ${wedding.names.second}'s Wedding`)}`,
    `LOCATION:${esc(wedding.venueAddress || wedding.ceremonyVenue)}`, "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: "edwin-jochel-wedding.ics" });
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function Home() {
  const scene = useRef<SceneState>({ progress: 0, heroFade: 0, opened: false, openedAt: 0, pointer: { x: 0, y: 0 }, covered: false });
  const progressBar = useRef<HTMLDivElement>(null);
  const audio = useRef<HTMLAudioElement>(null);
  const [ready, setReady] = useState(false);
  const [opened, setOpened] = useState(false);
  const [gateGone, setGateGone] = useState(false);
  const [tilt, setTilt] = useState(false);
  const [playing, setPlaying] = useState(false);
  const onReady = useCallback(() => setReady(true), []);

  // Scroll → progress bar and the 3D scene.
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      const y = window.scrollY;
      scene.current.progress = clamp(y / max, 0, 1);
      scene.current.heroFade = clamp(y / (window.innerHeight * 0.85), 0, 1);
      if (progressBar.current) progressBar.current.style.transform = `scaleX(${scene.current.progress})`;
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    update();
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); cancelAnimationFrame(raf); };
  }, []);

  // Mouse parallax on desktop; device tilt on phones once the guest opens the invitation.
  useEffect(() => {
    const onPointer = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      scene.current.pointer.x = (e.clientX / window.innerWidth - 0.5) * 2;
      scene.current.pointer.y = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("pointermove", onPointer, { passive: true });
    if (!tilt) return () => window.removeEventListener("pointermove", onPointer);
    let baseBeta: number | null = null;
    let baseGamma: number | null = null;
    const onOrient = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return;
      // The pose the phone is held in when the invitation opens is "centre"; slowly re-centre after that.
      baseBeta ??= e.beta;
      baseGamma ??= e.gamma;
      baseBeta += (e.beta - baseBeta) * 0.01;
      baseGamma += (e.gamma - baseGamma) * 0.01;
      scene.current.pointer.x = clamp((e.gamma - baseGamma) / 20);
      scene.current.pointer.y = clamp((baseBeta - e.beta) / 20);
    };
    window.addEventListener("deviceorientation", onOrient);
    return () => { window.removeEventListener("pointermove", onPointer); window.removeEventListener("deviceorientation", onOrient); };
  }, [tilt]);

  // Lock scrolling behind the opening gate.
  useEffect(() => {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    document.documentElement.classList.toggle("is-locked", !opened);
    return () => document.documentElement.classList.remove("is-locked");
  }, [opened]);

  // Scroll-linked reveals.
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.set(".hero-reveal", { autoAlpha: 0, y: 28, filter: "blur(10px)" });
      gsap.utils.toArray<HTMLElement>(".reveal").forEach((el) => {
        gsap.from(el, { autoAlpha: 0, y: 40, filter: "blur(8px)", duration: 1.4, ease: "expo.out",
          scrollTrigger: { trigger: el, start: "top 90%", once: true } });
      });
      gsap.utils.toArray<HTMLElement>(".split:not(.hero-split)").forEach((el) => {
        gsap.from(el.querySelectorAll(".split-inner"), { yPercent: 118, rotate: 5, duration: 1.4, ease: "expo.out", stagger: 0.07,
          scrollTrigger: { trigger: el, start: "top 88%", once: true } });
      });
      gsap.utils.toArray<HTMLElement>(".chapter-num").forEach((el) => {
        gsap.fromTo(el, { yPercent: 35 }, { yPercent: -35, ease: "none",
          scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "bottom top", scrub: 1 } });
      });
      gsap.utils.toArray<HTMLElement>(".timeline").forEach((el) => {
        gsap.fromTo(el.querySelector(".timeline-progress"), { scaleY: 0 }, { scaleY: 1, ease: "none",
          scrollTrigger: { trigger: el, start: "top 65%", end: "bottom 65%", scrub: 0.6 } });
      });
      gsap.utils.toArray<HTMLElement>(".stagger").forEach((group) => {
        gsap.from(group.children, { autoAlpha: 0, y: 26, duration: 1.1, ease: "expo.out", stagger: 0.09,
          scrollTrigger: { trigger: group, start: "top 88%", once: true } });
      });
    });
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (!opened) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduced) gsap.to(".hero-reveal", { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 1.6, ease: "expo.out", stagger: 0.12, delay: 0.75 });
    ScrollTrigger.refresh();
    const t = window.setTimeout(() => setGateGone(true), reduced ? 0 : 1400);
    return () => window.clearTimeout(t);
  }, [opened]);

  // 3D card tilt that follows the same mouse / gyro input as the WebGL scene.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const cards = Array.from(document.querySelectorAll<HTMLElement>("[data-tilt]"));
    const visible = new Set<HTMLElement>();
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) visible.add(e.target as HTMLElement); else visible.delete(e.target as HTMLElement);
    }));
    cards.forEach((c) => io.observe(c));
    const m = { x: 0, y: 0 };
    let raf = 0;
    const loop = () => {
      m.x += (scene.current.pointer.x - m.x) * 0.08;
      m.y += (scene.current.pointer.y - m.y) * 0.08;
      visible.forEach((c) => {
        c.style.setProperty("--ry", `${(m.x * 7).toFixed(2)}deg`);
        c.style.setProperty("--rx", `${(m.y * 5).toFixed(2)}deg`);
        c.style.setProperty("--gx", `${(50 + m.x * 45).toFixed(1)}%`);
        c.style.setProperty("--gy", `${(40 - m.y * 40).toFixed(1)}%`);
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); io.disconnect(); };
  }, []);

  function openInvitation() {
    // iOS only grants motion sensors from inside a tap, so ask first.
    const DOE = (typeof DeviceOrientationEvent !== "undefined" ? DeviceOrientationEvent : undefined) as unknown as
      { requestPermission?: () => Promise<"granted" | "denied"> } | undefined;
    if (DOE?.requestPermission) DOE.requestPermission().then((r) => r === "granted" && setTilt(true)).catch(() => {});
    else if (DOE) setTilt(true);
    if (audio.current) audio.current.play().then(() => setPlaying(true)).catch(() => {});
    window.scrollTo(0, 0);
    scene.current.opened = true;
    scene.current.openedAt = performance.now();
    setOpened(true);
  }

  function toggleMusic() {
    const el = audio.current;
    if (!el) return;
    if (el.paused) el.play().then(() => setPlaying(true)).catch(() => {});
    else { el.pause(); setPlaying(false); }
  }


  return <main className={`wedding-site ${opened ? "is-open" : "is-gated"}`}>
    <div className="cinema-photo-fallback" aria-hidden="true" />
    <CinematicCanvas state={scene} onReady={onReady} />
    <div className="page-progress" aria-hidden="true"><div ref={progressBar} /></div>
    {wedding.musicSrc && <audio ref={audio} src={wedding.musicSrc} loop preload="none" />}

    {!gateGone && (
      <div className="intro-gate" aria-hidden={opened}>
        <div className="gate-inner">
          <p className="eyebrow">You are cordially invited</p>
          <div className="gate-medallion" data-medallion="gate">
            <img className="medallion-fallback" src="/images/ej-logo-512.png" alt="" />
            <span className="medallion-halo" aria-hidden="true" />
          </div>
          <p className="gate-names">{wedding.names.first} <em>&</em> {wedding.names.second}</p>
          <p className="gate-sub">Together with their families</p>
          <button type="button" className="gold-button gate-button" onClick={openInvitation} disabled={!ready || opened}>
            {ready ? <><MailOpen size={18} strokeWidth={1.5} /> <span>Open invitation</span></> : <span className="loading-dots">Preparing</span>}
          </button>
          <p className="gate-hint"><Sparkles size={13} strokeWidth={1.5} /> {wedding.musicSrc ? "Turn your sound on · tilt your phone" : "Tilt your phone to feel the depth"}</p>
        </div>
      </div>
    )}

    <div className="site-content">
      {wedding.musicSrc && (
        <button type="button" className="round-button sound-toggle" onClick={toggleMusic} aria-label={playing ? "Mute music" : "Play music"} aria-pressed={playing}>
          {playing ? <Volume2 size={18} /> : <VolumeX size={18} />}
        </button>
      )}

      <section className="panel hero-panel" id="home" aria-label="Wedding introduction">
        <div className="hero-content">
          <p className="eyebrow hero-reveal">A love written by the sea</p>
          <div className="monogram-holder" data-medallion="hero">
            <img className="medallion-fallback" src="/images/ej-logo-512.png" alt="Gold E and J monogram framed by ornate filigree" />
          </div>
          <p className="wedding-label hero-reveal">The wedding of</p>
          <h1 className="hero-names hero-reveal"><span className="foil">{wedding.names.first}</span><em>&</em><span className="foil">{wedding.names.second}</span></h1>
          <div className="ornamental-line hero-reveal"><span /></div>
          <p className="hero-quote hero-reveal">Our greatest adventure is just beginning.</p>
          <p className="date-chip glass hero-reveal"><CalendarDays size={14} strokeWidth={1.5} /> {wedding.dateDisplay}</p>
        </div>
        <a className="scroll-indicator hero-reveal" href="#story"><span>Scroll to begin</span><span className="scroll-line"><ArrowDown size={14} /></span></a>
      </section>

      <section className="panel poetry-panel" id="story">
        <span className="chapter-num" aria-hidden="true">01</span>
        <div className="poetry-content align-left">
          <p className="eyebrow reveal">Chapter one · Our story</p>
          <SplitTitle className="display-title" lines={["Some stories", "feel like *fate.*"]} />
          <div className="fine-line reveal" />
          <p className="scene-description reveal">Among a thousand beautiful moments, we found our favorite place — right beside each other.</p>
        </div>
      </section>

      <section className="panel poetry-panel scene-two">
        <span className="chapter-num" aria-hidden="true">02</span>
        <div className="poetry-content align-right">
          <p className="eyebrow reveal">Chapter two · The promise</p>
          <SplitTitle className="display-title" lines={["In every tide,", "*I'll find you.*"]} />
          <div className="fine-line reveal" />
          <p className="scene-description reveal">Through every season, every sunrise, and every road ahead — we choose each other.</p>
        </div>
      </section>

      <section className="panel promise-panel">
        <div className="center-message">
          <p className="eyebrow reveal">Two hearts · One forever</p>
          <h2 className="calligraphic reveal">And so, our<br /><span className="foil">forever begins.</span></h2>
          <p className="little-heart reveal"><Heart size={18} strokeWidth={1.2} /></p>
        </div>
      </section>

      <section className="panel details-panel" id="details">
        <div className="reveal invite-wrap">
          <article className="invite-paper" data-tilt>
            <span className="invite-glare" aria-hidden="true" />
            <img className="invite-seal" src="/images/ej-logo-512.png" alt="" aria-hidden="true" />
            <p className="eyebrow dark">To our beloved family & friends</p>
            <h2 className="invite-title">Together with our families, we joyfully invite you to celebrate the wedding of</h2>
            <p className="invite-names foil-dark">{wedding.names.first} <span>&</span> {wedding.names.second}</p>
            <div className="paper-divider" aria-hidden="true"><span />✦<span /></div>
            <dl className="details-list stagger">
              <div className="details-item"><CalendarDays size={20} strokeWidth={1.3} /><div><dt>When</dt><dd>{wedding.dateDisplay}<small>{wedding.timeDisplay}</small></dd></div></div>
              <div className="details-item"><Church size={20} strokeWidth={1.3} /><div><dt>Ceremony</dt><dd>{wedding.ceremonyVenue}</dd></div></div>
              <div className="details-item"><Wine size={20} strokeWidth={1.3} /><div><dt>Reception</dt><dd>{wedding.receptionVenue}</dd></div></div>
              <div className="details-item"><Shirt size={20} strokeWidth={1.3} /><div><dt>Attire</dt><dd>{wedding.dressCode}</dd></div></div>
            </dl>
            {(wedding.venueAddress || wedding.dateISO) && (
              <div className="invite-actions">
                {wedding.venueAddress && <a className="outline-button" target="_blank" rel="noopener noreferrer" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(wedding.venueAddress)}`}><MapPin size={16} /> Directions</a>}
                {wedding.dateISO && <button type="button" className="outline-button" onClick={downloadCalendar}><CalendarPlus size={16} /> Add to calendar</button>}
              </div>
            )}
            <p className="paper-end">We cannot wait to share our special day with you.</p>
          </article>
        </div>
      </section>

      <section className="panel countdown-panel">
        <p className="eyebrow reveal">Before we say I do</p>
        <SplitTitle className="display-title centered" lines={["Counting down", "to *always.*"]} />
        <div className="reveal"><Countdown /></div>
        <p className="countdown-foot reveal"><span className="countdown-date">{wedding.dateDisplay} · {wedding.timeDisplay}</span>A beautiful new chapter is on its way.</p>
      </section>

      <section className="panel guide-panel" id="program">
        <div className="guide-heading">
          <p className="eyebrow reveal">Program of events</p>
          <SplitTitle className="display-title centered" lines={["The order", "of *our day.*"]} />
        </div>
        <ProgramTimeline />
      </section>

      <section className="panel guide-panel" id="motif">
        <div className="guide-heading">
          <p className="eyebrow reveal">Color motif & attire</p>
          <SplitTitle className="display-title centered" lines={["Gold &", "*royal blue.*"]} />
        </div>
        <ColorMotif />
      </section>

      <section className="panel gallery-panel" id="gallery">
        <div className="gallery-heading">
          <p className="eyebrow reveal">Little moments, big love</p>
          <SplitTitle className="display-title" lines={["The way we", "*remember us.*"]} />
        </div>
        <Gallery360 photos={galleryPhotos} state={scene} panoramaSrc={wedding.panoramaSrc || undefined} />
      </section>

      <section className="panel guide-panel" id="gifts">
        <div className="guide-heading">
          <p className="eyebrow reveal">Gift guide</p>
          <SplitTitle className="display-title centered" lines={["With love", "*& gratitude.*"]} />
        </div>
        <GiftGuide />
      </section>

      <section className="panel rsvp-panel" id="rsvp">
        <div className="reveal rsvp-wrap">
          <div className="rsvp-card">
            <p className="eyebrow dark">The celebration isn’t complete without you</p>
            <h2 className="rsvp-title">Will you join<br /><i>our forever?</i></h2>
            <p className="rsvp-intro">We would be honored to celebrate this unforgettable day with you.</p>
            <div className="rsvp-rule" />
            <RsvpForm />
            <p className="rsvp-deadline">{wedding.rsvpDeadline}</p>
          </div>
        </div>
      </section>

      <section className="panel closing-panel">
        <div className="closing-content">
          <p className="eyebrow reveal">With all our love</p>
          <SplitTitle className="closing-forever" lines={["The best is", "*yet to come.*"]} />
          <p className="closing-names reveal">{wedding.names.first} <span>&</span> {wedding.names.second}</p>
          <div className="ornamental-line reveal"><span /></div>
          <p className="closing-tag reveal">{wedding.hashtag}</p>
        </div>
      </section>

      <footer className="page-footer">
        <span>Made with love · E & J</span>
        <span>Photos · The Ilaya Project</span>
      </footer>
    </div>
  </main>;
}
