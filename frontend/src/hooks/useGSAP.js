// EVOS — useGSAPScrollTrigger Hook
import { useEffect } from "react";

export function useGSAPScrollTrigger() {
  useEffect(() => {
    // Dynamic GSAP import (loaded via CDN in index.html)
    if (typeof window === "undefined") return;

    const tryGSAP = () => {
      if (!window.gsap || !window.ScrollTrigger) return;
      window.gsap.registerPlugin(window.ScrollTrigger);

      // Reveal sections on scroll
      window.gsap.utils.toArray(".gsap-reveal").forEach(el => {
        window.gsap.fromTo(
          el,
          { opacity: 0, y: 28 },
          {
            opacity: 1, y: 0, duration: 0.7,
            ease: "power2.out",
            scrollTrigger: {
              trigger: el,
              start: "top 88%",
              toggleActions: "play none none none",
            },
          }
        );
      });
    };

    // Try immediately, then retry after CDN loads
    tryGSAP();
    const timer = setTimeout(tryGSAP, 1500);
    return () => clearTimeout(timer);
  }, []);
}
