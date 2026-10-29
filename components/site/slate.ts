/** Pizarra oscura con un degradé encima: el texto hueso/beige mantiene contraste ≥ 4.5:1. Se usa junto con `bg-coal bg-cover bg-center`. */
export const SLATE = "bg-[linear-gradient(180deg,rgb(20_18_16/.25)_0%,rgb(20_18_16/.55)_45%,rgb(20_18_16/.88)_100%),url(/fotos/fondo-pizarra.webp)]";

/** Tarjeta sobre pizarra: fondo, borde fino y esquinas. */
export const SLATE_CARD = `overflow-hidden rounded-xs border border-bone/12 bg-coal bg-cover bg-center ${SLATE}`;
