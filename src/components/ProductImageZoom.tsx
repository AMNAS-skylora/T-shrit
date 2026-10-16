"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type TouchEvent as ReactTouchEvent } from "react";
import { createPortal } from "react-dom";
import styles from "./ProductGallery.module.css";

type Offset = { x: number; y: number };
const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

function distance(touches: ReactTouchEvent<HTMLDivElement>["touches"]) {
  const a = touches[0], b = touches[1];
  return a && b ? Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY) : 0;
}

export function ProductImageZoom({
  src,
  alt,
  onClose,
}: {
  src: string;
  alt: string;
  onClose: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 });
  const scaleRef = useRef(1);
  const offsetRef = useRef<Offset>({ x: 0, y: 0 });
  const pinchRef = useRef<{ distance: number; zoom: number } | null>(null);
  const panRef = useRef<{ x: number; y: number; origin: Offset } | null>(null);
  const mouseRef = useRef<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
    const oldOverflow = document.body.style.overflow;
    const oldFocus = document.activeElement;
    document.body.style.overflow = "hidden";
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onEscape);
    const frame = requestAnimationFrame(() => closeRef.current?.focus());
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onEscape);
      document.body.style.overflow = oldOverflow;
      if (oldFocus instanceof HTMLElement) oldFocus.focus();
    };
  }, [onClose]);

  function update(nextScale: number, nextOffset = offsetRef.current) {
    const value = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, nextScale));
    // Limit dragging so the photo stays reachable after zooming.
    const maxX = (window.innerWidth * (value - 1)) / 2;
    const maxY = (window.innerHeight * (value - 1)) / 2;
    const bounded = value === 1
      ? { x: 0, y: 0 }
      : {
          x: Math.min(maxX, Math.max(-maxX, nextOffset.x)),
          y: Math.min(maxY, Math.max(-maxY, nextOffset.y)),
        };
    scaleRef.current = value;
    offsetRef.current = bounded;
    setScale(value);
    setOffset(bounded);
  }

  function touchStart(event: ReactTouchEvent<HTMLDivElement>) {
    const touches = event.touches;
    if (touches.length >= 2) {
      pinchRef.current = { distance: distance(touches), zoom: scaleRef.current };
      panRef.current = null;
    } else if (touches.length === 1) {
      pinchRef.current = null;
      panRef.current = {
        x: touches[0].clientX,
        y: touches[0].clientY,
        origin: offsetRef.current,
      };
    }
  }

  function touchMove(event: ReactTouchEvent<HTMLDivElement>) {
    const touches = event.touches;
    if (touches.length >= 2 && pinchRef.current) {
      const nextDistance = distance(touches);
      if (pinchRef.current.distance) {
        update(pinchRef.current.zoom * nextDistance / pinchRef.current.distance);
      }
    } else if (touches.length === 1 && panRef.current && scaleRef.current > 1) {
      update(scaleRef.current, {
        x: panRef.current.origin.x + touches[0].clientX - panRef.current.x,
        y: panRef.current.origin.y + touches[0].clientY - panRef.current.y,
      });
    }
  }

  function touchEnd(event: ReactTouchEvent<HTMLDivElement>) {
    if (event.touches.length === 0) {
      pinchRef.current = null;
      panRef.current = null;
    } else if (event.touches.length === 1) {
      pinchRef.current = null;
      panRef.current = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY,
        origin: offsetRef.current,
      };
    }
  }

  function pointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse" || scaleRef.current <= 1) return;
    mouseRef.current = event.pointerId;
    panRef.current = { x: event.clientX, y: event.clientY, origin: offsetRef.current };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function pointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse" || mouseRef.current !== event.pointerId || !panRef.current) return;
    update(scaleRef.current, {
      x: panRef.current.origin.x + event.clientX - panRef.current.x,
      y: panRef.current.origin.y + event.clientY - panRef.current.y,
    });
  }

  function pointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (mouseRef.current !== event.pointerId) return;
    mouseRef.current = null;
    panRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  if (!mounted) return null;

  return createPortal(
    <div className={styles.zoomOverlay} role="dialog" aria-modal="true" aria-label="Zoom product image">
      <div className={styles.zoomHeader}>
        <span className={styles.zoomTitle}>Product photo</span>
        <button ref={closeRef} type="button" className={styles.zoomClose} onClick={onClose} aria-label="Close image zoom">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M5 5 19 19M19 5 5 19"/></svg>
        </button>
      </div>
      <div
        className={styles.zoomViewport}
        onTouchStart={touchStart}
        onTouchMove={touchMove}
        onTouchEnd={touchEnd}
        onTouchCancel={touchEnd}
        onPointerDown={pointerDown}
        onPointerMove={pointerMove}
        onPointerUp={pointerUp}
        onPointerCancel={pointerUp}
        onDoubleClick={() => update(scaleRef.current > 1 ? 1 : 2.5)}
      >
        <Image
          src={src}
          alt={alt}
          fill
          sizes="100vw"
          className={styles.zoomImage}
          draggable={false}
          style={{ transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${scale})` }}
        />
      </div>
      <div className={styles.zoomToolbar} role="group" aria-label="Image zoom controls">
        <button type="button" onClick={() => update(scaleRef.current - .5)} disabled={scale <= MIN_ZOOM} aria-label="Zoom out">−</button>
        <output aria-label="Zoom level">{Math.round(scale * 100)}%</output>
        <button type="button" onClick={() => update(scaleRef.current + .5)} disabled={scale >= MAX_ZOOM} aria-label="Zoom in">+</button>
        <button type="button" className={styles.zoomReset} onClick={() => update(1)}>Reset</button>
      </div>
      <p className={styles.zoomHint}>Pinch to zoom · Drag to explore</p>
    </div>,
    document.body,
  );
}
