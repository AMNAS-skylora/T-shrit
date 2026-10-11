"use client";

import { createContext, useContext } from "react";

const OfferClockContext = createContext(0);

export function OfferClockProvider({ initialNow, children }: {
  initialNow: number;
  children: React.ReactNode;
}) {
  return <OfferClockContext.Provider value={initialNow}>{children}</OfferClockContext.Provider>;
}

export function useInitialOfferTime() {
  return useContext(OfferClockContext);
}
