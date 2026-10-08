"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import type {
  AnimationBarConfig,
  AnimationBarPlacement,
} from "@/types/animation-bar";

function isLive(bar: AnimationBarConfig, now: number) {
  if (!bar.enabled) return false;

  const starts = bar.startsAt ? new Date(bar.startsAt).getTime() : null;
  const ends = bar.endsAt ? new Date(bar.endsAt).getTime() : null;

  if (starts !== null && Number.isFinite(starts) && now < starts) return false;
  if (ends !== null && Number.isFinite(ends) && now > ends) return false;

  return true;
}

function themeClasses(theme: AnimationBarConfig["theme"]) {
  if (theme === "light") {
    return "bg-white text-[#111] border-y border-black/10";
  }

  if (theme === "blue") {
    return "bg-[#001cac] text-white";
  }

  return "bg-[#111] text-white";
}

function Item({
  text,
  href,
  hidden = false,
}: {
  text: string;
  href?: string;
  hidden?: boolean;
}) {
  const className =
    "inline-flex min-h-10 shrink-0 items-center whitespace-nowrap text-[10px] font-bold uppercase tracking-[.12em]";

  if (!href) {
    return <span className={className}>{text}</span>;
  }

  const external =
    href.startsWith("http://") ||
    href.startsWith("https://") ||
    href.startsWith("mailto:");

  if (external) {
    return (
      <a
        href={href}
        target={href.startsWith("http") ? "_blank" : undefined}
        rel={href.startsWith("http") ? "noreferrer" : undefined}
        className={className}
        tabIndex={hidden ? -1 : undefined}
      >
        {text}
      </a>
    );
  }

  return (
    <Link
      href={href}
      className={className}
      tabIndex={hidden ? -1 : undefined}
    >
      {text}
    </Link>
  );
}

function AnimationBarRow({ bar }: { bar: AnimationBarConfig }) {
  const shellRef = useRef<HTMLElement | null>(null);
  const primaryRef = useRef<HTMLDivElement | null>(null);
  const [metrics, setMetrics] = useState({
    shellWidth: 0,
    setWidth: 0,
  });

  useEffect(() => {
    const shell = shellRef.current;
    const primary = primaryRef.current;
    if (!shell || !primary) return;

    const measure = () => {
      const shellWidth = Math.max(0, shell.getBoundingClientRect().width);
      const setWidth = Math.max(0, primary.getBoundingClientRect().width);

      setMetrics((current) => {
        if (
          Math.abs(current.shellWidth - shellWidth) < 0.5 &&
          Math.abs(current.setWidth - setWidth) < 0.5
        ) {
          return current;
        }

        return { shellWidth, setWidth };
      });
    };

    measure();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }

    const observer = new ResizeObserver(measure);
    observer.observe(shell);
    observer.observe(primary);

    return () => observer.disconnect();
  }, [bar.items, bar.gap, bar.separator]);

  const repeats =
    metrics.setWidth > 0 && metrics.shellWidth > 0
      ? Math.max(2, Math.ceil(metrics.shellWidth / metrics.setWidth) + 2)
      : 2;

  // Convert the 1-10 admin slider into a stable physical scroll velocity.
  // Because duration is based on measured content width, speed does not change
  // when the viewport/resolution or message length changes.
  const pixelsPerSecond = 20 + Math.max(1, Math.min(10, bar.speed)) * 10;
  const measuredDuration =
    metrics.setWidth > 0 ? metrics.setWidth / pixelsPerSecond : 12;
  const duration = Math.max(4, Math.min(90, measuredDuration));
  const travel = metrics.setWidth > 0 ? metrics.setWidth : 1;

  const style = {
    "--animation-bar-duration": duration + "s",
    "--animation-bar-gap": bar.gap + "px",
    "--animation-bar-travel": travel + "px",
  } as CSSProperties;

  const renderSet = (
    hidden: boolean,
    copy: string,
    primary = false,
  ) => (
    <div
      key={copy}
      ref={primary ? primaryRef : undefined}
      className="animation-bar-set"
      style={{ gap: bar.gap }}
      aria-hidden={hidden || undefined}
    >
      {bar.items.map((item, index) => (
        <div
          key={copy + "-" + item.id}
          className="flex shrink-0 items-center"
          style={{ gap: bar.gap }}
        >
          <Item text={item.text} href={item.href} hidden={hidden} />
          {bar.separator ? (
            <span
              aria-hidden="true"
              className="shrink-0 text-[9px] opacity-50"
            >
              {bar.separator}
            </span>
          ) : null}
          {index === bar.items.length - 1 ? (
            <span className="w-1 shrink-0" aria-hidden="true" />
          ) : null}
        </div>
      ))}
    </div>
  );

  return (
    <section
      ref={shellRef}
      aria-label={bar.name}
      className={
        "animation-bar-shell overflow-hidden " +
        themeClasses(bar.theme) +
        (bar.pauseOnHover ? " animation-bar-pause-hover" : "")
      }
      style={style}
    >
      {bar.autoScroll ? (
        <div
          className={
            "animation-bar-track " +
            (bar.direction === "right"
              ? "animation-bar-right"
              : "animation-bar-left")
          }
        >
          {Array.from({ length: repeats }, (_, index) =>
            renderSet(index > 0, "copy-" + index, index === 0),
          )}
        </div>
      ) : (
        <div
          className={
            "animation-bar-manual " +
            (bar.allowManualScroll
              ? "overflow-x-auto overscroll-x-contain"
              : "overflow-hidden")
          }
        >
          <div
            className="flex min-w-max items-center"
            style={{ gap: bar.gap }}
          >
            {bar.items.map((item, index) => (
              <div
                key={item.id}
                className="flex shrink-0 items-center"
                style={{ gap: bar.gap }}
              >
                <Item text={item.text} href={item.href} />
                {bar.separator && index < bar.items.length - 1 ? (
                  <span
                    aria-hidden="true"
                    className="shrink-0 text-[9px] opacity-50"
                  >
                    {bar.separator}
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export function HomepageAnimationBars({
  bars,
  placement,
}: {
  bars: AnimationBarConfig[];
  placement: AnimationBarPlacement;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const liveBars = useMemo(
    () =>
      bars
        .filter((bar) => bar.placement === placement && isLive(bar, now))
        .sort((a, b) => a.order - b.order),
    [bars, now, placement],
  );

  if (!liveBars.length) return null;

  return (
    <div className="w-full">
      {liveBars.map((bar) => (
        <AnimationBarRow key={bar.id} bar={bar} />
      ))}
    </div>
  );
}
