import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

function forceScrollTop() {
  window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

export function scrollToTopNow() {
  forceScrollTop();
  requestAnimationFrame(forceScrollTop);
  setTimeout(forceScrollTop, 0);
  setTimeout(forceScrollTop, 50);
  setTimeout(forceScrollTop, 150);
}

export function ScrollToTop() {
  const [location] = useLocation();
  const prevLocation = useRef(location);

  useEffect(() => {
    if (prevLocation.current !== location) {
      prevLocation.current = location;
      scrollToTopNow();
      setTimeout(() => ScrollTrigger.refresh(), 200);
    }
  }, [location]);

  return null;
}
