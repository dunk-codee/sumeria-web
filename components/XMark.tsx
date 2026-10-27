import { cx } from "@/lib/format";

/**
 * Motivo X de la marca: un trazo largo en S y dos cortos, con puntas redondeadas.
 * Un solo uso por bloque; nunca como fondo repetido.
 */
export const X_PATHS = ["M4.6 5.2C8.6 7.4 11 10.2 13 13.2S16.6 18.4 19.2 19", "M15.6 9.6L19 5.4", "M5 18.9L8.4 14.8"];

/** Trazos de la X del logo, calcados de `sumeria-logo.png` (viewBox 0 0 420 434, trazo 74): hero y header. */
export const LOGO_X = {
  long: "M38 52 C 110 98 175 150 215 215 C 255 280 300 350 378 390",
  top: "M298 128 C 330 102 352 75 382 38",
  bottom: "M128 302 C 95 335 65 368 42 402",
};

export function XMark({
  size = 10,
  className,
  stroke = 3.6,
  color = "currentColor",
  spin = false,
  title,
}: {
  size?: number;
  className?: string;
  stroke?: number;
  color?: string;
  spin?: boolean;
  title?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={stroke}
      strokeLinecap="round"
      className={cx("shrink-0", spin && "animate-x-spin", className)}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
    >
      {title && <title>{title}</title>}
      {X_PATHS.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

/** X roja de marca (marcadores, separadores). */
export function RedX(props: Omit<Parameters<typeof XMark>[0], "color">) {
  return <XMark {...props} className={cx("text-sumeria", props.className)} />;
}

/** Loader: la X gira 180° y frena. */
export function XLoader({ size = 22, label }: { size?: number; label?: string }) {
  return (
    <span className="inline-flex items-center gap-3.5 font-mono text-xs uppercase tracking-[.06em] text-stone-3" role="status">
      <XMark size={size} stroke={4} spin className="text-sumeria" />
      {label && <span>{label}</span>}
    </span>
  );
}
