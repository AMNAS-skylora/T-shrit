"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type CartItem = {
  productId: string;
  color: string;
  size: string;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  ready: boolean;
  addItem: (item: CartItem) => void;
  setQuantity: (item: CartItem, quantity: number) => void;
  removeItem: (item: CartItem) => void;
  clearCart: () => void;
};

const STORAGE_KEY = "kleidin-cart-v1";
const MAX_LINES = 30;
const MAX_QUANTITY = 20;
const CartContext = createContext<CartContextValue | null>(null);

function sameItem(a: CartItem, b: CartItem) {
  return a.productId === b.productId && a.color === b.color && a.size === b.size;
}

function cleanItems(value: unknown): CartItem[] {
  if (!Array.isArray(value)) return [];
  const items: CartItem[] = [];
  for (const raw of value.slice(0, 100)) {
    if (!raw || typeof raw !== "object") continue;
    const record = raw as Record<string, unknown>;
    const productId = typeof record.productId === "string" ? record.productId.trim() : "";
    const color = typeof record.color === "string" ? record.color.trim().slice(0, 80) : "";
    const size = typeof record.size === "string" ? record.size.trim().slice(0, 80) : "";
    const quantity = Number(record.quantity);
    if (!productId || productId.length > 100 || !Number.isSafeInteger(quantity) || quantity < 1) continue;
    const item = { productId, color, size, quantity: Math.min(quantity, MAX_QUANTITY) };
    const index = items.findIndex((candidate) => sameItem(candidate, item));
    if (index !== -1) {
      items[index] = { ...items[index], quantity: Math.min(MAX_QUANTITY, items[index].quantity + item.quantity) };
    } else if (items.length < MAX_LINES) {
      items.push(item);
    }
  }
  return items;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    function readCart() {
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        setItems(saved ? cleanItems(JSON.parse(saved)) : []);
      } catch {
        setItems([]);
      }
    }
    readCart();
    setReady(true);
    function onStorage(event: StorageEvent) {
      if (event.key === STORAGE_KEY || event.key === null) readCart();
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Shopping remains usable in memory when storage is disabled.
    }
  }, [items, ready]);

  function addItem(item: CartItem) {
    const [valid] = cleanItems([item]);
    if (!valid) return;
    setItems((previous) => {
      const index = previous.findIndex((entry) => sameItem(entry, valid));
      if (index === -1) return previous.length < MAX_LINES ? [...previous, valid] : previous;
      return previous.map((entry, i) => i === index
        ? { ...entry, quantity: Math.min(MAX_QUANTITY, entry.quantity + valid.quantity) }
        : entry);
    });
  }

  function setQuantity(item: CartItem, quantity: number) {
    if (!Number.isSafeInteger(quantity)) return;
    if (quantity < 1) return removeItem(item);
    setItems((previous) => previous.map((entry) =>
      sameItem(entry, item) ? { ...entry, quantity: Math.min(quantity, MAX_QUANTITY) } : entry,
    ));
  }

  function removeItem(item: CartItem) {
    setItems((previous) => previous.filter((entry) => !sameItem(entry, item)));
  }

  return (
    <CartContext.Provider value={{
      items,
      count: items.reduce((sum, item) => sum + item.quantity, 0),
      ready,
      addItem,
      setQuantity,
      removeItem,
      clearCart: () => setItems([]),
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const cart = useContext(CartContext);
  if (!cart) throw new Error("useCart must be used inside CartProvider.");
  return cart;
}
