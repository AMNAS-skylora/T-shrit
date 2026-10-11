"use client";

import { useEffect, useRef } from "react";

export function AdminActionFeedback({message,error=false,id}: {message:string;error?:boolean;id?:string}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!error || !message) return;
    const element = ref.current;
    element?.scrollIntoView({behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",block:"center"});
    element?.focus({preventScroll:true});
  },[message,error]);
  if (!message) return null;
  return <div ref={ref} id={id} tabIndex={-1} role={error ? "alert" : "status"} className={"mt-4 scroll-mt-24 rounded-xl border px-4 py-3 text-sm font-medium " + (error ? "border-red-200 bg-red-50 text-red-800" : "border-black/5 bg-white text-black/60")}>{message}</div>;
}
