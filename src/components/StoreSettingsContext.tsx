"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { StoreSettings } from "@/types/commerce";

const StoreSettingsContext = createContext<StoreSettings | null>(null);

export function StoreSettingsProvider({
  settings,
  children,
}: {
  settings: StoreSettings;
  children: ReactNode;
}) {
  return (
    <StoreSettingsContext.Provider value={settings}>
      {children}
    </StoreSettingsContext.Provider>
  );
}

export function useStoreSettings() {
  const value = useContext(StoreSettingsContext);
  if (!value) {
    throw new Error("useStoreSettings must be used inside StoreSettingsProvider.");
  }
  return value;
}
