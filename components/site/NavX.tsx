"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cx } from "@/lib/format";
import { X_PATHS } from "../XMark";

export const EASE_STROKE = [0.6, 0, 0.2, 1] as const;

/** Trazo largo primero y después los dos cortos, como en el hero: [delay, duración] por trazo. */
const X_DRAW = [
  [0.05, 0.3],
  [0.28, 0.14],
  [0.36, 0.14],
] as const;

/**
 * X roja de la opción activa (nav del header y filtros de la carta): se dibuja trazo por trazo al montarse.
 * No ocupa lugar propio en el flujo (absoluta o en un hueco reservado): los textos nunca se mueven.
 */
export function NavX({ size, className }: { size: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <span aria-hidden className={cx("flex shrink-0", className)}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={4} strokeLinecap="round" className="shrink-0 overflow-visible text-sumeria">
        {X_PATHS.map((d, i) => (
          // El trazo arranca invisible: con puntas redondeadas, un largo 0 dibujaría un punto.
          <motion.path
            key={d}
            d={d}
            initial={reduce ? false : { pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{
              pathLength: { delay: X_DRAW[i][0], duration: X_DRAW[i][1], ease: i === 0 ? EASE_STROKE : "easeOut" },
              opacity: { delay: X_DRAW[i][0], duration: 0.01 },
            }}
          />
        ))}
      </svg>
    </span>
  );
}
