"use client";

import { motion, useReducedMotion, type Transition } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useSyncExternalStore } from "react";
import { button } from "@/components/ui";
import { LOGO_X } from "@/components/XMark";
import { cx } from "@/lib/format";

/*
 * Hero de la home con animación de entrada (≈2.4 s).
 * Solo se animan transform, opacity, clip-path y pathLength.
 * Corre una vez por carga: al volver a la home navegando dentro del sitio aparece ya armado.
 */

const EASE_OUT = [0.2, 0.7, 0.2, 1] as const;
const EASE_STROKE = [0.6, 0, 0.2, 1] as const;
const EASE_WIPE = [0.7, 0, 0.3, 1] as const;

const { long: X_LONG, top: X_TOP, bottom: X_BOTTOM } = LOGO_X;

/*
 * Con prefers-reduced-motion se fuerza el estado final por CSS, así no se ve
 * el estado oculto mientras la página hidrata.
 */
const REDUCED = "motion-reduce:opacity-100! motion-reduce:transform-none! motion-reduce:[clip-path:none]!";

const MotionLink = motion.create(Link);

/** La animación ya corrió en esta carga de la página (estado del módulo, se reinicia al recargar). */
let played = false;

const subscribeNoop = () => () => {};

export function Hero({ salonFrom, address }: { salonFrom: string; address: string }) {
  const reduce = useReducedMotion();
  // Durante la hidratación se respeta el HTML del servidor (estado inicial);
  // en navegaciones del cliente se arranca en el estado final si ya corrió o si se pide menos movimiento.
  const hydrated = useSyncExternalStore(subscribeNoop, () => true, () => false);
  const animateIn = !hydrated || !(played || reduce);

  useEffect(() => {
    played = true;
  }, []);

  const from = <T,>(hidden: T) => (animateIn ? hidden : false);
  const at = (delay: number, duration: number, ease: Transition["ease"] = EASE_OUT): Transition =>
    reduce ? { duration: 0 } : { delay, duration, ease };

  const fadeUp = (delay: number) => ({
    initial: from({ opacity: 0, y: 26 }),
    animate: { opacity: 1, y: 0 },
    transition: at(delay, 0.6),
  });

  // El trazo arranca invisible: con puntas redondeadas, un largo 0 dibujaría un punto.
  const stroke = (delay: number, duration: number, ease: Transition["ease"]) => ({
    initial: from({ pathLength: 0, opacity: 0 }),
    animate: { pathLength: 1, opacity: 1 },
    transition: reduce ? { duration: 0 } : { pathLength: { delay, duration, ease }, opacity: { delay, duration: 0.01 } },
  });

  const cta = "h-[52px] max-w-60 flex-[1_1_160px] rounded-full! py-0! whitespace-nowrap";

  return (
    <section className="relative -mt-14 flex min-h-[min(92vh,860px)] items-end overflow-hidden bg-black">
      {/* Ken Burns */}
      <motion.div
        className={cx("absolute inset-0 origin-[60%_40%]", REDUCED)}
        initial={from({ scale: 1.14 })}
        animate={{ scale: 1.02 }}
        transition={at(0, 2.4)}
      >
        <Image
          src="/fotos/hero-sushi.jpg"
          alt="Rolls de salmón sobre plato negro y mesa de madera oscura"
          fill
          preload
          quality={85}
          sizes="100vw"
          className="object-cover object-[84%_50%] d:object-[60%_50%]"
        />
      </motion.div>
      <motion.div
        aria-hidden
        className={cx(
          "absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,.55)_0%,rgba(0,0,0,.05)_35%,rgba(0,0,0,.55)_70%,#000_100%)]",
          REDUCED,
        )}
        initial={from({ opacity: 0 })}
        animate={{ opacity: 1 }}
        transition={at(0, 1.2, "easeOut")}
      />

      <div className="relative mx-auto flex w-full max-w-[1280px] flex-col gap-[22px] px-gutter pt-[calc(56px+40px)] pb-[clamp(28px,4vw,52px)]">
        {/* data-hero-logo: el header muestra su logo recién cuando este sale de la vista. */}
        <h1 data-hero-logo aria-label="Sumeria Sushi" className="m-0 flex w-[min(100%,760px)] items-center gap-[2.4%]">
          <svg
            viewBox="0 0 420 434"
            fill="none"
            stroke="currentColor"
            strokeWidth={74}
            strokeLinecap="round"
            aria-hidden
            className="h-auto w-[13%] shrink-0 overflow-visible text-sumeria"
          >
            <motion.path d={X_LONG} className={cx(REDUCED, "motion-reduce:[stroke-dasharray:none]!")} {...stroke(0.45, 0.75, EASE_STROKE)} />
            <motion.path d={X_TOP} className={cx(REDUCED, "motion-reduce:[stroke-dasharray:none]!")} {...stroke(1.1, 0.3, "easeOut")} />
            <motion.path d={X_BOTTOM} className={cx(REDUCED, "motion-reduce:[stroke-dasharray:none]!")} {...stroke(1.25, 0.3, "easeOut")} />
          </svg>

          {/* "SUMERIA" recortado del logo horizontal (x 160–1072 de 1187 px); el aspect-ratio reserva el espacio. */}
          <motion.span
            aria-hidden
            className={cx("relative block aspect-[912/154] min-w-0 flex-1 overflow-hidden", REDUCED)}
            initial={from({ clipPath: "inset(0 100% 0 0)" })}
            animate={{ clipPath: "inset(0 0% 0 0)" }}
            transition={at(0.9, 0.9, EASE_WIPE)}
          >
            <Image
              src="/brand/sumeria-logo.png"
              alt=""
              width={1187}
              height={154}
              loading="eager"
              className="absolute top-0 left-[-17.544%] h-full w-auto max-w-none"
            />
          </motion.span>

          <motion.span
            aria-hidden
            className={cx("flex shrink-0 flex-col font-jost text-[clamp(22px,4.6vw,46px)] leading-[.92] font-light text-sumeria", REDUCED)}
            {...fadeUp(1.55)}
          >
            <span>SU</span>
            <span>SHI</span>
          </motion.span>
        </h1>

        <motion.p
          className={cx("m-0 font-display text-[clamp(12px,1.2vw,15px)] tracking-[.32em] text-silver uppercase", REDUCED)}
          {...fadeUp(1.75)}
        >
          Sushi · Rolls · Salads · Bagels
        </motion.p>

        {/* Los CTAs son links reales desde el primer frame: opacity/transform no bloquean el clic. */}
        <div className="flex flex-wrap gap-2.5">
          <MotionLink href="/carta" className={cx(button(), cta, REDUCED)} {...fadeUp(1.9)}>
            Ver la carta
          </MotionLink>
          <MotionLink href="/reservas" className={cx(button({ variant: "outline" }), cta, "border-bone/60!", REDUCED)} {...fadeUp(2)}>
            Reservar mesa
          </MotionLink>
        </div>

        <motion.div
          className={cx(
            "mt-[clamp(6px,2vw,22px)] flex flex-wrap items-center gap-x-[18px] gap-y-1.5 border-t border-bone/12 pt-[18px] font-display text-[clamp(13px,1.3vw,16px)] tracking-[.12em] uppercase",
            REDUCED,
          )}
          initial={from({ opacity: 0 })}
          animate={{ opacity: 1 }}
          transition={at(2.2, 0.8, "easeOut")}
        >
          <span>Todos los días desde las {salonFrom}</span>
          <span aria-hidden className="text-silver">
            ·
          </span>
          <span>Delivery &amp; take away</span>
          <span aria-hidden className="text-silver">
            ·
          </span>
          <span>{address}</span>
        </motion.div>
      </div>
    </section>
  );
}
