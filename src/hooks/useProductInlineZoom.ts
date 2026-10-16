"use client";

import { useEffect, useRef, useState, type PointerEvent, type TouchEvent } from "react";

type Offset = { x: number; y: number };
type TouchStart = { x: number; y: number; offset: Offset };
type PinchStart = { distance: number; scale: number };
const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

function distance(touches: TouchEvent<HTMLDivElement>["touches"]) {
  if (touches.length < 2) return 0;
  return Math.hypot(
    touches[0].clientX - touches[1].clientX,
    touches[0].clientY - touches[1].clientY,
  );
}

/** Magnify the photo within its existing gallery rectangle, never in a modal. */
export function useProductInlineZoom(image: string | undefined, onSwipe: (direction: number) => void) {
  const galleryRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const scaleRef = useRef(1);
  const offsetRef = useRef<Offset>({ x: 0, y: 0 });
  const touchRef = useRef<TouchStart | null>(null);
  const pinchRef = useRef<PinchStart | null>(null);
  const mousePointer = useRef<number | null>(null);
  const ignoreClickUntil = useRef(0);

  function applyZoom(requestedScale: number, proposedOffset = offsetRef.current) {
    const nextScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, requestedScale));
    const bounds = galleryRef.current?.getBoundingClientRect();
    const maxX = (bounds?.width ?? 0) * (nextScale - 1) / 2;
    const maxY = (bounds?.height ?? 0) * (nextScale - 1) / 2;
    const nextOffset = nextScale === 1
      ? { x: 0, y: 0 }
      : {
          x: Math.max(-maxX, Math.min(maxX, proposedOffset.x)),
          y: Math.max(-maxY, Math.min(maxY, proposedOffset.y)),
        };
    scaleRef.current = nextScale;
    offsetRef.current = nextOffset;
    setScale(nextScale);
    setOffset(nextOffset);
  }

  // Switching thumbnails or colour always starts with the complete photo.
  useEffect(() => {
    scaleRef.current = 1;
    offsetRef.current = { x: 0, y: 0 };
    setScale(1);
    setOffset({ x: 0, y: 0 });
    setDragging(false);
    touchRef.current = null;
    pinchRef.current = null;
  }, [image]);

  function toggleZoom() {
    if (!image) return;
    applyZoom(scaleRef.current > 1 ? 1 : 2.2);
  }

  function onTouchStart(event: TouchEvent<HTMLDivElement>) {
    if (event.touches.length >= 2) {
      pinchRef.current = { distance: distance(event.touches), scale: scaleRef.current };
      touchRef.current = null;
      ignoreClickUntil.current = Date.now() + 500;
    } else if (event.touches.length === 1) {
      const t = event.touches[0];
      touchRef.current = { x: t.clientX, y: t.clientY, offset: offsetRef.current };
      pinchRef.current = null;
    }
  }

  function onTouchMove(event: TouchEvent<HTMLDivElement>) {
    if (event.touches.length >= 2) {
      if (!pinchRef.current) pinchRef.current = { distance: distance(event.touches), scale: scaleRef.current };
      const start = pinchRef.current;
      if (start.distance > 0) applyZoom(start.scale * distance(event.touches) / start.distance);
      ignoreClickUntil.current = Date.now() + 500;
    } else if (event.touches.length === 1 && scaleRef.current > 1 && touchRef.current) {
      const t = event.touches[0];
      const start = touchRef.current;
      applyZoom(scaleRef.current, {
        x: start.offset.x + t.clientX - start.x,
        y: start.offset.y + t.clientY - start.y,
      });
      setDragging(true);
      ignoreClickUntil.current = Date.now() + 500;
    }
  }

  function onTouchEnd(event: TouchEvent<HTMLDivElement>) {
    if (event.touches.length === 1) {
      const t = event.touches[0];
      touchRef.current = { x: t.clientX, y: t.clientY, offset: offsetRef.current };
      pinchRef.current = null;
    } else if (event.touches.length === 0) {
      if (!pinchRef.current && touchRef.current && scaleRef.current === 1) {
        const touch = event.changedTouches[0];
        if (touch) {
          const dx = touch.clientX - touchRef.current.x;
          const dy = touch.clientY - touchRef.current.y;
          if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.25) {
            onSwipe(dx < 0 ? 1 : -1);
            ignoreClickUntil.current = Date.now() + 500;
          } else if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
            ignoreClickUntil.current = Date.now() + 350;
          }
        }
      }
      touchRef.current = null;
      pinchRef.current = null;
      setDragging(false);
    }
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse" || scaleRef.current === 1) return;
    mousePointer.current = event.pointerId;
    touchRef.current = { x: event.clientX, y: event.clientY, offset: offsetRef.current };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse" || mousePointer.current !== event.pointerId || !touchRef.current) return;
    const dx = event.clientX - touchRef.current.x;
    const dy = event.clientY - touchRef.current.y;
    if (Math.abs(dx) + Math.abs(dy) > 4) {
      setDragging(true);
      ignoreClickUntil.current = Date.now() + 400;
    }
    applyZoom(scaleRef.current, {
      x: touchRef.current.offset.x + dx,
      y: touchRef.current.offset.y + dy,
    });
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse" || mousePointer.current !== event.pointerId) return;
    mousePointer.current = null;
    touchRef.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  return {
    galleryRef,
    scale,
    offset,
    dragging,
    toggleZoom,
    resetZoom: () => applyZoom(1),
    ignoreNextClick: () => { ignoreClickUntil.current = Date.now() + 400; },
    allowClick: () => Date.now() >= ignoreClickUntil.current,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    onTouchCancel: () => {
      touchRef.current = null;
      pinchRef.current = null;
      setDragging(false);
    },
    onPointerDown,
    onPointerMove,
    onPointerUp,
  };
}
