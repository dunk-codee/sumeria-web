"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useToast } from "./ui";

const EVERY_MS = 10_000;

/**
 * Mantiene el panel al día: cada 10 s (con la pestaña a la vista) pregunta si cambiaron las reservas y, si es así,
 * refresca los datos de la página sin recargar. Si entró una reserva nueva, avisa con un cartel.
 */
export function LiveReservations() {
  const router = useRouter();
  const toast = useToast();
  const last = useRef<{ latest: number; total: number } | null>(null);

  useEffect(() => {
    let stop = false;
    const check = async () => {
      if (document.hidden) return;
      try {
        const res = await fetch("/api/admin/reservations-stamp", { cache: "no-store" });
        if (!res.ok) return;
        const now = (await res.json()) as { latest: number; total: number };
        const prev = last.current;
        last.current = now;
        if (stop || !prev || (prev.latest === now.latest && prev.total === now.total)) return;
        if (now.latest > prev.latest) toast("Entró una reserva nueva.");
        router.refresh();
      } catch {
        /* sin conexión: se reintenta en el próximo ciclo */
      }
    };
    check();
    const id = setInterval(check, EVERY_MS);
    document.addEventListener("visibilitychange", check);
    return () => {
      stop = true;
      clearInterval(id);
      document.removeEventListener("visibilitychange", check);
    };
  }, [router, toast]);

  return null;
}
