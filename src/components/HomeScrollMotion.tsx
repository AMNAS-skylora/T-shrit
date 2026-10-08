"use client";

import { useEffect } from "react";

type MotionConfig = {
  element: HTMLElement;
  x?: number;
  y?: number;
  scale?: number;
  delay?: number;
  duration?: number;
};

export function HomeScrollMotion() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    const distance = isMobile ? 0.68 : 1;
    const observed = new Set<HTMLElement>();
    const configs = new Map<HTMLElement, MotionConfig>();

    const add = (
      element: Element | null,
      config: Omit<MotionConfig, "element"> = {},
    ) => {
      if (!(element instanceof HTMLElement) || observed.has(element)) return;

      observed.add(element);
      configs.set(element, {
        element,
        x: (config.x ?? 0) * distance,
        y: (config.y ?? 28) * distance,
        scale: config.scale ?? 0.992,
        delay: config.delay ?? 0,
        duration: config.duration ?? (isMobile ? 720 : 900),
      });
    };

    const addSplit = (selector: string) => {
      const children = document.querySelectorAll<HTMLElement>(selector);
      children.forEach((element, index) => {
        add(element, {
          x: (index % 2 === 0 ? -30 : 30),
          y: 10,
          delay: index * 90,
          duration: 940,
        });
      });
    };

    addSplit('[aria-label="Featured products"] > div > div');
    addSplit("#about > div > div");
    addSplit('[aria-label="Dealership"] > div > div');

    add(document.querySelector("#all-products h2"), {
      y: 22,
      scale: 1,
      duration: 760,
    });

    document
      .querySelectorAll<HTMLElement>("#all-products article")
      .forEach((card, index) => {
        add(card, {
          y: 30,
          scale: 0.985,
          delay: Math.min(index, 7) * 55,
          duration: 820,
        });
      });

    add(document.querySelector(".home-spotlight-media"), {
      x: -28,
      y: 8,
      duration: 980,
    });

    add(document.querySelector(".home-spotlight-info"), {
      x: 28,
      y: 8,
      delay: 90,
      duration: 980,
    });

    document
      .querySelectorAll<HTMLElement>(".reference-home > section")
      .forEach((section, index) => {
        if (index === 0) return;

        const hasChildMotion = Array.from(observed).some((element) =>
          section.contains(element),
        );

        if (!hasChildMotion) {
          const content =
            section.querySelector<HTMLElement>(":scope > div") ?? section;
          add(content, { y: 26, duration: 880 });
        }
      });

    if (!observed.size) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const element = entry.target as HTMLElement;
          const config = configs.get(element);
          if (!config) return;

          observer.unobserve(element);

          element.style.willChange = "opacity, transform, filter";

          const animation = element.animate(
            [
              {
                opacity: 0,
                transform: `translate3d(${config.x ?? 0}px, ${config.y ?? 0}px, 0) scale(${config.scale ?? 1})`,
                filter: "blur(3px)",
              },
              {
                opacity: 1,
                transform: "translate3d(0, 0, 0) scale(1)",
                filter: "blur(0)",
              },
            ],
            {
              duration: config.duration,
              delay: config.delay,
              easing: "cubic-bezier(.16,1,.3,1)",
              fill: "both",
            },
          );

          animation.finished
            .catch(() => undefined)
            .finally(() => {
              element.style.willChange = "";
            });
        });
      },
      {
        threshold: isMobile ? 0.08 : 0.12,
        rootMargin: "0px 0px -7% 0px",
      },
    );

    observed.forEach((element) => observer.observe(element));

    return () => {
      observer.disconnect();
      observed.forEach((element) => {
        element.getAnimations().forEach((animation) => animation.cancel());
        element.style.willChange = "";
      });
    };
  }, []);

  return null;
}
