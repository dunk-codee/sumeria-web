/** Plano del salón, elementos fijos y zonas de delivery iniciales (seed y modo sin base). */
import type { TableShape } from "../../lib/schema";

export const TABLES: { n: number; cap: number; shape: TableShape; x: number; y: number; location: string }[] = [
  { n: 1, cap: 2, shape: "round", x: 5, y: 6, location: "Salón, contra la pared" },
  { n: 2, cap: 2, shape: "round", x: 19, y: 6, location: "Salón, contra la pared" },
  { n: 3, cap: 4, shape: "square", x: 34, y: 5, location: "Salón" },
  { n: 4, cap: 6, shape: "long", x: 51, y: 6, location: "Salón, cerca de la barra" },
  { n: 5, cap: 4, shape: "square", x: 5, y: 27, location: "Salón" },
  { n: 6, cap: 4, shape: "square", x: 23, y: 27, location: "Centro del salón" },
  { n: 7, cap: 8, shape: "long", x: 40, y: 28, location: "Mesa larga" },
  { n: 8, cap: 2, shape: "round", x: 14, y: 52, location: "Junto al ventanal" },
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
