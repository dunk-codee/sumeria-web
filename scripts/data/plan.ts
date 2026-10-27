/** Plano del salón, elementos fijos y zonas de delivery iniciales (seed y modo sin base). */
import type { TableShape } from "../../lib/schema";

/*
 * Todas cuadradas y del mismo tamaño (TABLE_SIZE = 12). Las sueltas son para 4; las que están pegadas de a dos
 * son para 3 cada una (un lado contra la otra), así el par sienta 6. Misma distribución que la migración 0002.
 */
export const TABLES: { n: number; cap: number; shape: TableShape; x: number; y: number; location: string }[] = [
  { n: 1, cap: 3, shape: "square", x: 4, y: 4, location: "Salón, contra la pared" },
  { n: 2, cap: 3, shape: "square", x: 16, y: 4, location: "Salón, contra la pared" },
  { n: 3, cap: 4, shape: "square", x: 34, y: 4, location: "Salón" },
  { n: 4, cap: 4, shape: "square", x: 50, y: 4, location: "Salón" },
  { n: 5, cap: 4, shape: "square", x: 4, y: 25, location: "Salón" },
  { n: 6, cap: 3, shape: "square", x: 22, y: 25, location: "Centro del salón" },
  { n: 7, cap: 3, shape: "square", x: 34, y: 25, location: "Centro del salón" },
  { n: 8, cap: 4, shape: "square", x: 50, y: 25, location: "Cerca de la barra" },
  { n: 9, cap: 3, shape: "square", x: 4, y: 46, location: "Junto al ventanal" },
  { n: 10, cap: 3, shape: "square", x: 16, y: 46, location: "Junto al ventanal" },
  { n: 11, cap: 4, shape: "square", x: 40, y: 46, location: "Salón" },
];

export const FIXTURES = [
  { kind: "hatch", x: 72, y: 0, w: 28, h: 24, label: "Cocina" },
  { kind: "bar", x: 72, y: 30, w: 6, h: 28, label: "Barra" },
  { kind: "stool", x: 66.5, y: 32, w: 3.5, h: 3.5 },
  { kind: "stool", x: 66.5, y: 38.5, w: 3.5, h: 3.5 },
  { kind: "stool", x: 66.5, y: 45, w: 3.5, h: 3.5 },
  { kind: "stool", x: 66.5, y: 51.5, w: 3.5, h: 3.5 },
  { kind: "hatch", x: 84, y: 48, w: 16, h: 22, label: "Baños" },
  { kind: "window", x: 2, y: 68.8, w: 38, h: 1.4 },
  { kind: "door", x: 44, y: 68.6, w: 14, h: 2 },
  { kind: "label", x: 2, y: 63.5, w: 38, h: 4, label: "Ventanal · 25 de Mayo" },
  { kind: "label", x: 44, y: 63.5, w: 14, h: 4, label: "Entrada" },
] as const;

export const ZONES = [
  { name: "Zona 1 · Centro", description: "Hasta 15 cuadras del local", price: 1500 },
  { name: "Zona 2 · Barrios", description: "Hasta bulevares", price: 2500 },
  { name: "Zona 3 · Afueras", description: "Resto de la ciudad", price: 3500 },
];
