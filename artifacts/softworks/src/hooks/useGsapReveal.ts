import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function useGsapReveal() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {

      // ── Fade + slide up ──
      gsap.utils.toArray<Element>(".reveal").forEach((el) => {
        gsap.fromTo(el,
          { opacity: 0, y: 40 },
          {
            opacity: 1, y: 0, duration: 0.8, ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 88%", toggleActions: "play none none none" },
          }
        );
      });

      // ── Stagger children (simple) ──
      gsap.utils.toArray<Element>(".reveal-stagger").forEach((parent) => {
        gsap.fromTo(Array.from(parent.children),
          { opacity: 0, y: 30 },
          {
            opacity: 1, y: 0, duration: 0.6, stagger: 0.12, ease: "power2.out",
            scrollTrigger: { trigger: parent, start: "top 85%", toggleActions: "play none none none" },
          }
        );
      });

      // ── Card stagger — scale + translateY + slight rotate ──
      gsap.utils.toArray<Element>(".reveal-cards").forEach((parent) => {
        gsap.fromTo(Array.from(parent.children),
          { opacity: 0, y: 60, scale: 0.92, rotateX: 8 },
          {
            opacity: 1, y: 0, scale: 1, rotateX: 0,
            duration: 0.7, stagger: 0.1, ease: "power3.out",
            scrollTrigger: { trigger: parent, start: "top 82%", toggleActions: "play none none none" },
          }
        );
      });

      // ── Zoom in (elastic) ──
      gsap.utils.toArray<Element>(".reveal-zoom").forEach((el) => {
        gsap.fromTo(el,
          { opacity: 0, scale: 0.7 },
          {
            opacity: 1, scale: 1, duration: 0.75, ease: "back.out(1.6)",
            scrollTrigger: { trigger: el, start: "top 88%", toggleActions: "play none none none" },
          }
        );
      });

      // ── Zoom stagger ──
      gsap.utils.toArray<Element>(".reveal-zoom-stagger").forEach((parent) => {
        gsap.fromTo(Array.from(parent.children),
          { opacity: 0, scale: 0.72 },
          {
            opacity: 1, scale: 1, duration: 0.65, stagger: 0.1, ease: "back.out(1.7)",
            scrollTrigger: { trigger: parent, start: "top 84%", toggleActions: "play none none none" },
          }
        );
      });

      // ── Scale in (for cards) ──
      gsap.utils.toArray<Element>(".reveal-scale").forEach((el) => {
        gsap.fromTo(el,
          { opacity: 0, scale: 0.92 },
          {
            opacity: 1, scale: 1, duration: 0.7, ease: "back.out(1.4)",
            scrollTrigger: { trigger: el, start: "top 88%", toggleActions: "play none none none" },
          }
        );
      });

      // ── Slide from left ──
      gsap.utils.toArray<Element>(".reveal-left").forEach((el) => {
        gsap.fromTo(el,
          { opacity: 0, x: -60 },
          {
            opacity: 1, x: 0, duration: 0.85, ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 88%", toggleActions: "play none none none" },
          }
        );
      });

      // ── Slide from right ──
      gsap.utils.toArray<Element>(".reveal-right").forEach((el) => {
        gsap.fromTo(el,
          { opacity: 0, x: 60 },
          {
            opacity: 1, x: 0, duration: 0.85, ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 88%", toggleActions: "play none none none" },
          }
        );
      });

      // ── Flip-in (3D Y axis) — great for value/feature cards ──
      gsap.utils.toArray<Element>(".reveal-flip-stagger").forEach((parent) => {
        gsap.fromTo(Array.from(parent.children),
          { opacity: 0, rotateY: 80, transformOrigin: "left center" },
          {
            opacity: 1, rotateY: 0,
            duration: 0.7, stagger: 0.15, ease: "power3.out",
            scrollTrigger: { trigger: parent, start: "top 83%", toggleActions: "play none none none" },
          }
        );
      });

      // ── Pop up (icon / badge style) ──
      gsap.utils.toArray<Element>(".reveal-pop").forEach((el) => {
        gsap.fromTo(el,
          { opacity: 0, scale: 0, rotate: -10 },
          {
            opacity: 1, scale: 1, rotate: 0, duration: 0.6, ease: "back.out(2)",
            scrollTrigger: { trigger: el, start: "top 90%", toggleActions: "play none none none" },
          }
        );
      });

      // ── Pop stagger ──
      gsap.utils.toArray<Element>(".reveal-pop-stagger").forEach((parent) => {
        gsap.fromTo(Array.from(parent.children),
          { opacity: 0, scale: 0.5, rotate: -8 },
          {
            opacity: 1, scale: 1, rotate: 0, duration: 0.5, stagger: 0.08, ease: "back.out(2)",
            scrollTrigger: { trigger: parent, start: "top 85%", toggleActions: "play none none none" },
          }
        );
      });

      // ── Drift up slow (for section headings/badges) ──
      gsap.utils.toArray<Element>(".reveal-drift").forEach((el) => {
        gsap.fromTo(el,
          { opacity: 0, y: 25 },
          {
            opacity: 1, y: 0, duration: 1, ease: "expo.out",
            scrollTrigger: { trigger: el, start: "top 90%", toggleActions: "play none none none" },
          }
        );
      });

      // ── Stagger drift (for section heading groups) ──
      gsap.utils.toArray<Element>(".reveal-drift-stagger").forEach((parent) => {
        gsap.fromTo(Array.from(parent.children),
          { opacity: 0, y: 30 },
          {
            opacity: 1, y: 0, duration: 0.8, stagger: 0.14, ease: "expo.out",
            scrollTrigger: { trigger: parent, start: "top 88%", toggleActions: "play none none none" },
          }
        );
      });

      // ── Progress / underline width reveal ──
      gsap.utils.toArray<Element>(".reveal-width").forEach((el) => {
        gsap.fromTo(el,
          { scaleX: 0, transformOrigin: "left center" },
          {
            scaleX: 1, duration: 1, ease: "expo.out",
            scrollTrigger: { trigger: el, start: "top 90%", toggleActions: "play none none none" },
          }
        );
      });

      // ── Hero entrance (immediate, no scrolltrigger) ──
      gsap.utils.toArray<Element>(".hero-enter").forEach((el, i) => {
        gsap.fromTo(el,
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.7, delay: i * 0.15, ease: "power2.out" }
        );
      });

      // ── Hero stagger children ──
      gsap.utils.toArray<Element>(".hero-stagger").forEach((parent) => {
        gsap.fromTo(Array.from(parent.children),
          { opacity: 0, y: 24 },
          { opacity: 1, y: 0, duration: 0.65, stagger: 0.13, ease: "power2.out" }
        );
      });

      // ── Glow pulse on scroll-trigger ──
      gsap.utils.toArray<Element>(".reveal-glow").forEach((el) => {
        gsap.fromTo(el,
          { opacity: 0, y: 30, boxShadow: "0 0 0px rgba(99,102,241,0)" },
          {
            opacity: 1, y: 0,
            boxShadow: "0 0 40px rgba(99,102,241,0.18)",
            duration: 0.9, ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 88%", toggleActions: "play none none none" },
          }
        );
      });

    }, ref);

    return () => ctx.revert();
  }, []);

  return ref;
}
