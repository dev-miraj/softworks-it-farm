import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function ScrollToTop() {
  const [location] = useLocation();
  const prevLocation = useRef(location);

  useEffect(() => {
    if (prevLocation.current !== location) {
      prevLocation.current = location;

      const scrollTop = () => {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      };

      scrollTop();
      requestAnimationFrame(scrollTop);
      setTimeout(scrollTop, 0);
      setTimeout(scrollTop, 50);
      setTimeout(() => {
        scrollTop();
        ScrollTrigger.refresh();
      }, 100);
    }
  }, [location]);

  return null;
}
