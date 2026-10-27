import type { Placeholder } from "./schema";

/** Trama diagonal (STR) + degradados de fotos placeholder (PH) del prototipo. */
const STR = "repeating-linear-gradient(135deg,rgba(255,255,255,.028) 0 1px,transparent 1px 8px)";

const PH: Record<Placeholder, string> = {
  madera: "radial-gradient(110% 90% at 62% 58%,rgba(150,92,48,.55) 0%,rgba(60,36,20,.85) 40%,#0d0a08 80%)",
  pizarra: "radial-gradient(110% 90% at 50% 55%,rgba(98,88,80,.45) 0%,rgba(30,28,27,.9) 42%,#0a0a0a 82%)",
  negro: "radial-gradient(55% 48% at 50% 52%,rgba(130,86,52,.32) 0%,#050505 72%)",
  makisu: "radial-gradient(110% 90% at 45% 50%,rgba(170,128,70,.45) 0%,rgba(70,50,25,.85) 45%,#0c0a07 84%)",
  kraft: "radial-gradient(100% 90% at 50% 45%,rgba(214,180,130,.5) 0%,rgba(120,86,50,.8) 50%,#1a120b 92%)",
};

export const PLACEHOLDER_LABELS: Record<Placeholder, string> = {
  madera: "Madera",
  pizarra: "Pizarra",
  negro: "Negro",
  makisu: "Makisu",
  kraft: "Kraft",
};

export function placeholderBg(k: Placeholder | string | null | undefined): string {
  return `${STR},${PH[(k as Placeholder) in PH ? (k as Placeholder) : "madera"]}`;
}
