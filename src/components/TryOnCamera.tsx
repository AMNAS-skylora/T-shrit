"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Product } from "@/types/product";

export function TryOnCamera({ product }: { product: Product }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const requirementRef = useRef<HTMLElement | null>(null);
  const cameraSectionRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(false);
  const [requirementVisible, setRequirementVisible] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [scale, setScale] = useState(100);
  const [x, setX] = useState(0);
  const [y, setY] = useState(8);
  const reducedMotion = false;
  const [message, setMessage] = useState(
    "Camera stays on this device. No photo upload is used.",
  );

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setActive(false);
  }, []);

  const startCamera = useCallback(
    async (mode: "user" | "environment" = facingMode) => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setMessage("Camera is not supported in this browser.");
        return;
      }

      try {
        stopCamera();
        setMessage("Starting camera…");

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: mode },
            width: { ideal: 1280 },
            height: { ideal: 1280 },
          },
          audio: false,
        });

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        setFacingMode(mode);
        setActive(true);
        setMessage("Live preview only — nothing is uploaded.");
      } catch {
        setMessage(
          "Camera permission was not granted. Allow camera access and try again.",
        );
      }
    },
    [facingMode, stopCamera],
  );

  useEffect(() => {
    const node = requirementRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRequirementVisible(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.32,
        rootMargin: "0px 0px -8% 0px",
      },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const syncChrome = () => {
      const requirement = requirementRef.current;
      if (!requirement) return;

      const hidden = requirement.getBoundingClientRect().bottom > 1;

      window.dispatchEvent(
        new CustomEvent("kleidin:tryon-chrome", {
          detail: { hidden },
        }),
      );
    };

    syncChrome();
    window.addEventListener("scroll", syncChrome, { passive: true });
    window.addEventListener("resize", syncChrome);

    return () => {
      window.removeEventListener("scroll", syncChrome);
      window.removeEventListener("resize", syncChrome);
      window.dispatchEvent(
        new CustomEvent("kleidin:tryon-chrome", {
          detail: { hidden: false },
        }),
      );
    };
  }, []);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  if (!product.featuredImage) {
    return (
      <main className="mx-auto min-h-[70svh] max-w-[760px] px-4 py-10">
        <div className="rounded-[22px] border border-black/10 bg-white p-6 text-center">
          <h1 className="text-[28px] font-semibold tracking-[-.04em]">
            Try-on unavailable
          </h1>
          <p className="mt-2 text-[12px] text-black/55">
            This product does not have a transparent animation image available.
          </p>
          <Link
            href={"/products/" + product.slug}
            className="mt-5 inline-flex min-h-[46px] items-center rounded-full bg-[#111111] px-6 text-[10px] font-bold text-white"
          >
            Back to product
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-[1180px] px-3 py-4 sm:px-5 sm:py-6">
      <section
        ref={requirementRef}
        className={
          "relative left-1/2 mb-4 min-h-[100svh] w-screen -translate-x-1/2 overflow-hidden border-y border-black/10 bg-[#f3efe7] transition-[opacity,transform] duration-700 ease-[cubic-bezier(.16,1,.3,1)] md:min-h-[100dvh] " +
          (requirementVisible
            ? "translate-y-0 opacity-100"
            : "translate-y-6 opacity-0")
        }
        aria-label="Try-on image requirements"
      >
        <div className="mx-auto flex min-h-[100svh] w-full max-w-[1180px] items-center px-5 py-14 sm:px-8 md:min-h-[100dvh] lg:px-10">
          <div className="max-w-[760px]">
            <p className="text-[9px] font-bold uppercase tracking-[.14em] text-black/45">
              Image requirement
            </p>

            <h2 className="mt-3 text-[42px] font-semibold leading-[.92] tracking-[-.055em] sm:text-[58px] lg:text-[76px]">
              Stand clear. Keep the full outfit visible.
            </h2>

            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-[10px] font-semibold text-black/55 sm:text-[11px]">
              <span>Full body</span>
              <span>Good lighting</span>
              <span>Face camera</span>
              <span>Clear background</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          aria-label="Continue to live camera"
          onClick={() =>
            cameraSectionRef.current?.scrollIntoView({
              behavior: reducedMotion ? "auto" : "smooth",
              block: "start",
            })
          }
          className={
            "absolute bottom-7 left-1/2 grid h-12 w-12 -translate-x-1/2 place-items-center rounded-full border border-black/15 bg-white/85 text-black shadow-[0_10px_30px_rgba(0,0,0,.08)] backdrop-blur transition-[opacity,transform] duration-500 sm:bottom-9 " +
            (requirementVisible
              ? "translate-y-0 opacity-100"
              : "translate-y-3 opacity-0")
          }
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 5v14" />
            <path d="m6.5 13.5 5.5 5.5 5.5-5.5" />
          </svg>
        </button>
      </section>

      <div
        ref={cameraSectionRef}
        className="scroll-mt-4"
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="inline-flex min-h-9 items-center justify-center rounded-full border border-black/10 bg-white px-4 text-[9px] font-bold uppercase tracking-[.14em] text-black shadow-sm">
              TRY-ON ANYWHERE
            </span>
            <h1 className="mt-1 text-[26px] font-semibold tracking-[-.045em] sm:text-[34px]">
              {product.name}
            </h1>
          </div>
          <Link
            href={"/products/" + product.slug}
            className="inline-flex min-h-[44px] items-center rounded-full border border-black/10 bg-white px-5 text-[10px] font-bold"
          >
            Back to product
          </Link>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="relative overflow-hidden rounded-[22px] bg-[#111111]">
          <div className="relative aspect-[3/4] min-h-[520px] w-full overflow-hidden sm:aspect-square sm:min-h-0">
            <video
              ref={videoRef}
              playsInline
              muted
              className={
                "absolute inset-0 h-full w-full object-cover " +
                (facingMode === "user" ? "-scale-x-100" : "")
              }
            />

            {!active ? (
              <div className="absolute inset-0 grid place-items-center bg-[#111111] px-6 text-center text-white">
                <div>
                  <strong className="text-[20px] font-semibold">
                    Start live camera
                  </strong>
                  <p className="mx-auto mt-2 max-w-[360px] text-[11px] leading-5 text-white/60">
                    Camera works on HTTPS or localhost. Your camera feed is not
                    uploaded to KLEID.IN.
                  </p>
                  <button
                    type="button"
                    onClick={() => void startCamera()}
                    className="mt-5 min-h-[48px] rounded-full bg-white px-7 text-[10px] font-bold text-[#111111]"
                  >
                    Allow camera
                  </button>
                </div>
              </div>
            ) : null}

            {active ? (
              <img
                src={product.featuredImage}
                alt={product.name + " virtual try-on overlay"}
                draggable={false}
                className="pointer-events-none absolute left-1/2 top-1/2 max-h-none max-w-none select-none object-contain"
                style={{
                  width: scale + "%",
                  transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                }}
              />
            ) : null}

            <div className="pointer-events-none absolute left-3 top-3 rounded-full bg-black/55 px-3 py-2 text-[8px] font-bold text-white backdrop-blur">
              LIVE · NO UPLOAD
            </div>
          </div>
        </section>

        <aside className="grid content-start gap-3">
          <section className="rounded-[20px] border border-black/10 bg-white p-4 sm:p-5">
            <p className="text-[9px] font-bold uppercase tracking-[.12em] text-black/45">
              Camera
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => void startCamera("user")}
                className={
                  "min-h-[46px] rounded-full px-4 text-[10px] font-bold " +
                  (facingMode === "user"
                    ? "bg-[#111111] text-white"
                    : "border border-black/10 bg-white")
                }
              >
                Front
              </button>
              <button
                type="button"
                onClick={() => void startCamera("environment")}
                className={
                  "min-h-[46px] rounded-full px-4 text-[10px] font-bold " +
                  (facingMode === "environment"
                    ? "bg-[#111111] text-white"
                    : "border border-black/10 bg-white")
                }
              >
                Back
              </button>
            </div>

            <button
              type="button"
              onClick={active ? stopCamera : () => void startCamera()}
              className="mt-2 min-h-[46px] w-full rounded-full border border-black/10 bg-[#f5f5f5] px-4 text-[10px] font-bold"
            >
              {active ? "Stop camera" : "Start camera"}
            </button>

            <p className="mt-3 text-[9px] leading-5 text-black/50">{message}</p>
          </section>

          <section className="rounded-[20px] border border-black/10 bg-white p-4 sm:p-5">
            <p className="text-[9px] font-bold uppercase tracking-[.12em] text-black/45">
              Fit overlay
            </p>

            <label className="mt-4 block">
              <span className="flex justify-between text-[9px] font-semibold">
                Scale <strong>{scale}%</strong>
              </span>
              <input
                type="range"
                min="45"
                max="170"
                value={scale}
                onChange={(event) => setScale(Number(event.target.value))}
                className="mt-2 w-full accent-black"
              />
            </label>

            <label className="mt-4 block">
              <span className="flex justify-between text-[9px] font-semibold">
                Horizontal <strong>{x}</strong>
              </span>
              <input
                type="range"
                min="-160"
                max="160"
                value={x}
                onChange={(event) => setX(Number(event.target.value))}
                className="mt-2 w-full accent-black"
              />
            </label>

            <label className="mt-4 block">
              <span className="flex justify-between text-[9px] font-semibold">
                Vertical <strong>{y}</strong>
              </span>
              <input
                type="range"
                min="-200"
                max="220"
                value={y}
                onChange={(event) => setY(Number(event.target.value))}
                className="mt-2 w-full accent-black"
              />
            </label>

            <button
              type="button"
              onClick={() => {
                setScale(100);
                setX(0);
                setY(8);
              }}
              className="mt-5 min-h-[44px] w-full rounded-full border border-black/10 bg-white px-4 text-[10px] font-bold"
            >
              Reset position
            </button>
          </section>
        </aside>
        </div>
      </div>
    </main>
  );
}
