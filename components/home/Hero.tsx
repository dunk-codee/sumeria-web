"use client";

import { motion, useReducedMotion, type Transition } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore, type ComponentProps } from "react";
import { LOGO_X } from "@/components/XMark";
import { cx } from "@/lib/format";

/*
 * Hero de la home con animación de entrada (≈2.4 s).
 * Solo se animan transform, opacity, clip-path y pathLength.
 * Corre una vez por carga: al volver a la home navegando dentro del sitio aparece ya armado.
 * De fondo, el video del hero se reproduce una vez y queda pausado en el último cuadro.
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

/** Velocidad del video, último tramo (s) en el que frena y velocidad mínima al llegar al final. */
const RATE = 1.25;
const TAIL = 0.8;
// Más abajo de 0,5× se ven pocos cuadros por segundo y el final parece trabado.
const TAIL_MIN_RATE = 0.5;

/**
 * Video de fondo: arranca al entrar (mudo, inline, sin loop), se ve entero y al terminar queda pausado en el último cuadro.
 * Al empezar a frenar, la imagen sigue con un acercamiento lento (≈ 2 s) y se oscurece un poco: el movimiento no se corta
 * de golpe y el texto gana contraste.
 * Si la intro ya corrió en esta carga (volver al inicio navegando) o se pide menos movimiento, muestra directo el último
 * cuadro, ya acercado y oscurecido.
 */
function HeroVideo() {
  const ref = useRef<HTMLVideoElement>(null);
  // Se decide una sola vez, en el primer render: si dependiera de re-renders, al hidratar saltaría al final a mitad del video.
  const [skip] = useState(
    () => played || (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches),
  );
  const [settled, setSettled] = useState(skip);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    // React no siempre escribe el atributo `muted`, y sin él los navegadores bloquean el autoplay.
    v.muted = true;
    if (skip) {
      const toEnd = () => {
        v.currentTime = v.duration;
      };
      if (v.readyState >= 1) toEnd();
      else v.addEventListener("loadedmetadata", toEnd, { once: true });
      return () => v.removeEventListener("loadedmetadata", toEnd);
    }
    v.defaultPlaybackRate = RATE;
    v.playbackRate = RATE;
    // Si el navegador bloquea el autoplay (ahorro de batería, etc.) queda el primer cuadro.
    if (v.paused && !v.ended) v.play().catch(() => {});

    // Frenado suave: en el último tramo la velocidad baja con lo que falta (hasta TAIL_MIN_RATE),
    // así el video se asienta en el último cuadro en vez de cortar de golpe. En total dura ≈ 5,3 s.
    // Cuadro a cuadro con rAF; `timeupdate` (≈ 4 por segundo) de respaldo si el navegador frena los rAF.
    let raf = 0;
    const brake = () => {
      const left = v.duration - v.currentTime;
      if (left < TAIL) {
        v.playbackRate = Math.max(TAIL_MIN_RATE, (RATE * left) / TAIL);
        setSettled(true);
      }
    };
    const loop = () => {
      brake();
      if (!v.ended) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    v.addEventListener("timeupdate", brake);
    return () => {
      cancelAnimationFrame(raf);
      v.removeEventListener("timeupdate", brake);
    };
  }, [skip]);

  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden">
      {/* Desktop (≥ 900 px) recibe la versión 1920×1080 (2,6 MB); mobile, la de 1280×720 (0,9 MB). */}
      <video
        ref={ref}
        autoPlay={!skip}
        muted
        playsInline
        preload="auto"
        className={cx(
          "absolute inset-0 h-full w-full origin-[55%_50%] object-cover object-[55%_50%]",
          !skip && "transition-[scale] duration-[2000ms] ease-[cubic-bezier(.2,.7,.2,1)]",
          settled && "scale-103",
        )}
      >
        <source src="/fotos/hero-1080.mp4" type="video/mp4" media="(min-width: 900px)" />
        <source src="/fotos/hero-720.mp4" type="video/mp4" />
      </video>
      <div
        className={cx(
          "absolute inset-0 bg-black",
          !skip && "transition-opacity duration-[2500ms] ease-out",
          settled ? "opacity-35" : "opacity-0",
        )}
      />
    </div>
  );
}

const WORDS = ["Sushi", "Rolls", "Salads", "Bagels"];
/** Las palabras arrancan cuando termina de entrar el logo; los CTAs y los datos, cuando asentó la última. */
const WORDS_AT = 1.7;
const WORDS_STAGGER = 0.14;
const AFTER_WORDS = WORDS_AT + (WORDS.length - 1) * WORDS_STAGGER + 0.45;

/**
 * CTA del hero como sello hanko (mismo lenguaje que el pedido y el "Agregar" de la carta): texto en mayúsculas + sello
 * con flecha, apenas girado. `solid`: sello rojo (acción principal); `dashed`: sello punteado. Al pasar el mouse el
 * sello se endereza, la flecha avanza y un subrayado rojo se dibuja bajo el texto.
 */
function HeroCta({
  seal,
  className,
  children,
  ...props
}: { seal: "solid" | "dashed"; children: string } & Omit<ComponentProps<typeof MotionLink>, "children">) {
  return (
    <MotionLink
      {...props}
      className={cx(
        "group flex h-[52px] items-center gap-3.5 font-display text-[clamp(16px,1.6vw,19px)] font-medium tracking-[.16em] whitespace-nowrap text-bone uppercase",
        className,
      )}
    >
      <span className="relative">
        {children}
        <span
          aria-hidden
          className="absolute -bottom-1 left-0 h-[1.5px] w-full origin-left scale-x-0 bg-sumeria transition-[scale] duration-300 ease-out group-hover:scale-x-100 group-focus-visible:scale-x-100"
        />
      </span>
      <span
        aria-hidden
        className={cx(
          "flex h-9 w-9 items-center justify-center rounded-xs -rotate-6 transition-[rotate,border-color] duration-200 group-hover:rotate-0 group-focus-visible:rotate-0",
          seal === "solid"
            ? "bg-sumeria-dark text-white ring-1 ring-white/35 ring-inset"
            : "border-[1.5px] border-dashed border-bone/70 text-bone group-hover:border-solid group-hover:border-bone",
        )}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-200 group-hover:translate-x-0.5">
          <path d="M3 8h10M9 4l4 4-4 4" />
        </svg>
      </span>
    </MotionLink>
  );
}

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

  // Las palabras caen de a una con un rebote corto (spring con poco amortiguamiento); después entra lo demás.
  const word = (i: number) => ({
    initial: from({ opacity: 0, y: 18 }),
    animate: { opacity: 1, y: 0 },
    transition: reduce
      ? { duration: 0 }
      : {
          y: { type: "spring" as const, stiffness: 520, damping: 13, mass: 0.7, delay: WORDS_AT + i * WORDS_STAGGER },
          opacity: { duration: 0.2, delay: WORDS_AT + i * WORDS_STAGGER },
        },
  });

  return (
    <section className="relative -mt-14 flex min-h-svh items-end overflow-hidden bg-black">
      <HeroVideo />
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

        <p aria-label={WORDS.join(", ")} className="m-0 flex flex-wrap items-center gap-x-[.9em] font-display text-[clamp(13px,1.3vw,16px)] tracking-[.32em] text-silver uppercase">
          {WORDS.map((w, i) => (
            <motion.span key={w} aria-hidden className={cx("flex items-center gap-x-[.9em]", REDUCED)} {...word(i)}>
              {i > 0 && <span className="text-sumeria">·</span>}
              {w}
            </motion.span>
          ))}
        </p>

        {/* Los CTAs son links reales desde el primer frame: opacity/transform no bloquean el clic. */}
        <div className="flex flex-wrap items-center gap-x-[clamp(24px,4vw,44px)] gap-y-1">
          <HeroCta href="/carta" seal="solid" className={REDUCED} {...fadeUp(AFTER_WORDS)}>
            Ver la carta
          </HeroCta>
          <HeroCta href="/reservas" seal="dashed" className={REDUCED} {...fadeUp(AFTER_WORDS + 0.1)}>
            Reservar mesa
          </HeroCta>
        </div>

        <motion.div
          className={cx(
            "mt-[clamp(6px,2vw,22px)] flex flex-wrap items-center gap-x-[18px] gap-y-1.5 border-t border-bone/12 pt-[18px] font-display text-[clamp(13px,1.3vw,16px)] tracking-[.12em] uppercase",
            REDUCED,
          )}
          initial={from({ opacity: 0 })}
          animate={{ opacity: 1 }}
          transition={at(AFTER_WORDS + 0.3, 0.8, "easeOut")}
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
