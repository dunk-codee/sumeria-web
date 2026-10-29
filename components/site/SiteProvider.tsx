"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { orderMessage, waLink, type OrderLine } from "@/lib/whatsapp";

export type CartProduct = { id: number; name: string; pieces: string | null; price: number; available: boolean };
type CartEntry = { qty: number; note: string };
export type Payment = "cash" | "transfer";

type Persisted = {
  cart: Record<string, CartEntry>;
  generalNote: string;
  mode: "delivery" | "take";
  name: string;
  address: string;
  /** Aclaraciones para encontrar la dirección (solo delivery). */
  addressNote: string;
  payment: Payment;
};

const STORAGE_KEY = "sumeria:pedido";

type Ctx = Persisted & {
  ready: boolean;
  products: Record<number, CartProduct>;
  whatsapp: string;
  pickupAddress: string;
  lines: (OrderLine & { id: number })[];
  count: number;
  subtotal: number;
  message: string;
  qtyOf: (id: number) => number;
  setQty: (id: number, qty: number) => void;
  setNote: (id: number, note: string) => void;
  set: (patch: Partial<Persisted>) => void;
  orderUrl: string;
  cartOpen: boolean;
  menuOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleMenu: (open?: boolean) => void;
};

const SiteCtx = createContext<Ctx | null>(null);

export function useSite() {
  const c = useContext(SiteCtx);
  if (!c) throw new Error("useSite fuera de SiteProvider");
  return c;
}

export function SiteProvider({
  products,
  whatsapp,
  pickupAddress,
  children,
}: {
  products: CartProduct[];
  whatsapp: string;
  pickupAddress: string;
  children: ReactNode;
}) {
  const byId = useMemo(() => Object.fromEntries(products.map((p) => [p.id, p])) as Record<number, CartProduct>, [products]);
  const [state, setState] = useState<Persisted>({ cart: {}, generalNote: "", mode: "take", name: "", address: "", addressNote: "", payment: "cash" });
  const [ready, setReady] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Recupera el pedido guardado (solo productos que siguen disponibles).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<Persisted>;
        const cart: Record<string, CartEntry> = {};
        for (const [id, e] of Object.entries(saved.cart ?? {})) {
          const p = byId[Number(id)];
          if (p?.available && e && e.qty > 0) cart[id] = { qty: Math.min(99, Math.floor(e.qty)), note: String(e.note ?? "") };
        }
        const payment = saved.payment === "transfer" ? "transfer" : "cash";
        // eslint-disable-next-line react-hooks/set-state-in-effect -- hidratación desde localStorage
        setState((s) => ({ ...s, ...saved, cart, payment }));
      }
    } catch {
      /* localStorage no disponible: el pedido vive solo en memoria */
    }
    setReady(true);
  }, [byId]);

  // Se persiste recién después de hidratar, para no pisar el pedido guardado (p. ej. desde otra pestaña).
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* sin persistencia */
    }
  }, [state, ready]);

  const set = useCallback((patch: Partial<Persisted>) => setState((s) => ({ ...s, ...patch })), []);
  const setQty = useCallback((id: number, qty: number) => {
    setState((s) => {
      const cart = { ...s.cart };
      if (qty <= 0) delete cart[id];
      else cart[id] = { note: cart[id]?.note ?? "", qty: Math.min(99, qty) };
      return { ...s, cart };
    });
  }, []);
  const setNote = useCallback((id: number, note: string) => {
    setState((s) => (s.cart[id] ? { ...s, cart: { ...s.cart, [id]: { ...s.cart[id], note } } } : s));
  }, []);

  const lines = Object.entries(state.cart)
    .map(([id, e]) => {
      const p = byId[Number(id)];
      return p ? { id: p.id, name: p.name, pieces: p.pieces, price: p.price, qty: e.qty, note: e.note } : null;
    })
    .filter((l): l is NonNullable<typeof l> => l !== null);
  const count = lines.reduce((a, l) => a + l.qty, 0);
  const subtotal = lines.reduce((a, l) => a + l.qty * l.price, 0);
  const message = orderMessage({
    lines,
    mode: state.mode,
    name: state.name,
    address: state.address,
    addressNote: state.addressNote,
    payment: state.payment,
    note: state.generalNote,
    pickupAddress,
  });

  // Bloquea el scroll del fondo con el carrito o el menú abiertos.
  useEffect(() => {
    const lock = cartOpen || menuOpen;
    document.documentElement.style.overflow = lock ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [cartOpen, menuOpen]);

  const value: Ctx = {
    ...state,
    ready,
    products: byId,
    whatsapp,
    pickupAddress,
    lines,
    count,
    subtotal,
    message,
    qtyOf: (id) => state.cart[id]?.qty ?? 0,
    setQty,
    setNote,
    set,
    orderUrl: waLink(whatsapp, message),
    cartOpen,
    menuOpen,
    openCart: () => {
      setMenuOpen(false);
      setCartOpen(true);
    },
    closeCart: () => setCartOpen(false),
    toggleMenu: (open) => {
      setCartOpen(false);
      setMenuOpen((m) => (open === undefined ? !m : open));
    },
  };

  return <SiteCtx.Provider value={value}>{children}</SiteCtx.Provider>;
}
