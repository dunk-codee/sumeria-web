/**
 * Carta real de Sumeria (fuente: info_web/menu/Menú Sumeria_DIGITAL.pdf).
 * `photo` es el archivo en public/menu/ extraído del PDF (recorte sin fondo).
 * No hay productos marcados sin TACC en el menú: el local los marca desde el panel.
 */
import type { Placeholder } from "../../lib/schema";

export type SeedProduct = {
  name: string;
  description: string;
  pieces?: string;
  price: number;
  photo?: string;
  placeholder?: Placeholder;
};
export type SeedCategory = { slug: string; name: string; featured?: boolean; products: SeedProduct[] };

const VEG = " Apto vegetariano.";
const roll = (name: string, description: string, price: number, photo: string, extra = ""): SeedProduct => ({
  name,
  description: description + extra,
  pieces: "8",
  price,
  photo,
  placeholder: "pizarra",
});

const tabla = (name: string, description: string, photo: string, sizes: [number, number][]): SeedProduct[] =>
  sizes.map(([pcs, price]) => ({ name, description, pieces: String(pcs), price, photo, placeholder: "negro" }));

export const MENU: SeedCategory[] = [
  {
    slug: "rolls",
    name: "Rolls",
    featured: true,
    products: [
      roll("Dai Sake", "Norimaki con langostino frito y queso philadelphia, coronado con salmón ahumado y salsa de mostaza y miel.", 11900, "rolls-dai-sake"),
      roll("Sidney", "Norimaki con salmón rosado cocido y queso philadelphia, coronado con batata frita y salsa de maracuyá.", 14000, "rolls-sidney"),
      roll("New York", "Uramaki con salmón rosado y palta.", 12600, "rolls-new-york"),
      roll("Phila ahumado", "Uramaki con salmón ahumado y queso philadelphia.", 12600, "rolls-phila-ahumado"),
      roll("JTM", "Uramaki con salmón ahumado y queso philadelphia, coronado con palta y salsa caramelo.", 12600, "rolls-jtm"),
      roll("Buenos Aires", "Uramaki con salmón ahumado y queso philadelphia, coronado con mango.", 14100, "rolls-buenos-aires"),
      roll("Phila Candy", "Uramaki con salmón rosado y queso philadelphia, coronado con salsa caramelo y almendra praliné.", 13200, "rolls-phila-candy"),
      roll("New York con phila", "Uramaki con salmón rosado, queso philadelphia y palta.", 12600, "rolls-new-york-phila"),
      roll("Philadelphia", "Uramaki con salmón rosado y queso philadelphia.", 12600, "rolls-philadelphia"),
      roll("California", "Uramaki con kanikama, queso philadelphia y palta.", 9900, "rolls-california"),
      roll("Tuna", "Uramaki con lomito de atún y queso philadelphia.", 11300, "rolls-tuna"),
      roll("Hand", "Uramaki con langostino frito y queso philadelphia, coronado con salsa de mostaza y miel.", 11800, "rolls-hand"),
      roll("Empoderado Bis", "Uramaki con palta y queso philadelphia, coronado con croqueta de salmón rosado frito.", 11800, "rolls-empoderado-bis"),
      roll("Inverted", "Uramaki con palta y queso philadelphia, coronado con salmón ahumado.", 13300, "rolls-inverted"),
      roll("Los Angeles", "Uramaki con langostino salteado en salsa teriyaki y queso philadelphia, coronado con salmón ahumado y ralladura de lima.", 16000, "rolls-los-angeles"),
      roll("Extra Tropical", "Uramaki con salmón ahumado y queso philadelphia, coronado con mango, batata frita y salsa de maracuyá.", 11800, "rolls-extra-tropical"),
      roll("Mariachi", "Uramaki con salmón rosado cocido y queso philadelphia, coronado con guacamole.", 14600, "rolls-mariachi"),
      roll("Caviar Roll", "Uramaki con salmón rosado y palta, coronado con mayonesa picante y caviar.", 18000, "rolls-caviar-roll"),
      roll("Veggie", "Norimaki con palta, pepino, zanahoria y queso philadelphia.", 8700, "rolls-veggie", VEG),
      roll("Inverted V", "Uramaki con palta y queso philadelphia.", 8700, "rolls-inverted-v", VEG),
      roll("Green D", "Norimaki con palta, remolacha y queso philadelphia.", 8700, "rolls-green-d", VEG),
      roll("Nut", "Uramaki con palta, nuez y queso philadelphia.", 8700, "rolls-nut", VEG),
    ],
  },
  {
    slug: "sin-alga",
    name: "Rolls sin alga",
    products: [
      roll("Nairobi", "Queso phila y palta, envuelto en tamago y salmón ahumado, coronado con batata frita y salsa de maracuyá.", 18000, "sin-alga-nairobi"),
      roll("Sweet", "Salmón ahumado y mango envuelto en tamago y queso phila, coronado con salsa caramelo y almendra praliné.", 16300, "sin-alga-sweet"),
      roll("Feel", "Salmón ahumado y queso philadelphia envuelto en tamago.", 14300, "sin-alga-feel"),
    ],
  },
  {
    slug: "calientes",
    name: "Rolls calientes",
    featured: true,
    products: [
      { ...roll("Melou", "Uramaki con salmón rosado y palta, envuelto en panko frito, coronado con batata frita y mayonesa picante.", 15100, "calientes-melou"), placeholder: "madera" },
      { ...roll("Evolution", "Uramaki con salmón ahumado y queso philadelphia, envuelto en panko frito.", 15000, "calientes-evolution"), placeholder: "madera" },
      { ...roll("Qatar", "Uramaki con pollo envuelto en panko frito, ciboulette y queso phila, envuelto en panko frito.", 9500, "calientes-qatar"), placeholder: "madera" },
      { ...roll("Berlin", "Uramaki con salmón rosado y queso phila, envuelto en panko frito, coronado con guacamole.", 16000, "calientes-berlin"), placeholder: "madera" },
      { ...roll("Veggie Hot", "Uramaki con palta, mango, zanahoria y queso phila, envuelto en panko frito.", 9000, "calientes-veggie-hot", VEG), placeholder: "madera" },
      { ...roll("Bologna", "Uramaki con langostino salteado en pimentón y queso philadelphia, rebozado frito.", 14000, "calientes-bologna"), placeholder: "madera" },
    ],
  },
  {
    slug: "combinados",
    name: "Combinados",
    featured: true,
    products: [
      ...tabla("Tabla Clásica", "New York, Philadelphia, Tuna, California, Veggie y Evolution.", "combinados-tabla-clasica", [[12, 15500], [16, 20500], [24, 30200], [30, 38300]]),
      ...tabla("Tabla Premium", "New York, Philadelphia, Empoderado Bis, Geishas, Inverted y Evolution.", "combinados-tabla-premium", [[12, 18300], [16, 24300], [24, 36000], [30, 45000]]),
      ...tabla("Tabla Black", "Niguiris, New York con phila, JTM, Montadito, Sweet y Berlin.", "combinados-tabla-black", [[22, 46000], [40, 80000]]),
      ...tabla("Tabla Black Premium", "Caviar Roll, Nairobi, Geishas, Mariachi y Melou.", "combinados-tabla-black-premium", [[22, 53000], [40, 88000]]),
    ],
  },
  {
    slug: "entradas",
    name: "Entradas",
    products: [
      { name: "Langostinos", description: "Langostino rebozado en panko frito con salsa mostaza y miel.", price: 21600, photo: "entradas-langostinos", placeholder: "madera" },
      { name: "Rabas", description: "Aro de calamar rebozado en harina con limón.", price: 20000, photo: "entradas-rabas", placeholder: "madera" },
      { name: "Empanaditas", description: "Empanada copetín de salmón rosado, perejil, huevo y salsa bechamel, fritas.", pieces: "4 unidades", price: 8900, photo: "entradas-empanaditas", placeholder: "madera" },
      { name: "Geishas", description: "Salmón ahumado, queso philadelphia y palta.", pieces: "4 unidades", price: 8900, photo: "entradas-geishas", placeholder: "pizarra" },
      { name: "Geishas DF", description: "Salmón ahumado, queso phila y palta, coronada con batata frita y salsa de maracuyá.", pieces: "4 unidades", price: 11000, photo: "entradas-geishas-df", placeholder: "pizarra" },
      { name: "Niguiris de salmón", description: "Base de arroz coronada con salmón ahumado.", pieces: "4 unidades", price: 8300, photo: "entradas-niguiris-salmon", placeholder: "negro" },
      { name: "Bombay", description: "Bomba de arroz rellena de langostino sazonado en salsa teriyaki, rebozada en panko.", pieces: "4 unidades", price: 8300, photo: "entradas-bombay", placeholder: "madera" },
      { name: "Pinchos de salmón", description: "Feta de salmón rosado rebozado en panko frito.", pieces: "2 unidades", price: 14000, photo: "entradas-pinchos-salmon", placeholder: "madera" },
      { name: "Montadito", description: "Base de arroz frito con salmón rosado, ciboulette y salsa de mayonesa picante.", pieces: "3 unidades", price: 9200, photo: "entradas-montadito", placeholder: "pizarra" },
      { name: "Niguiris de langostino", description: "Base de arroz coronada con langostino fresco o frito.", pieces: "4 unidades", price: 8300, photo: "entradas-niguiris-langostino", placeholder: "negro" },
      { name: "Sashimi", description: "Salmón rosado o langostino fresco.", pieces: "4 unidades", price: 10100, photo: "entradas-sashimi", placeholder: "pizarra" },
      { name: "Temakis", description: "Cono de arroz y alga nori relleno de salmón rosado, queso philadelphia y palta.", pieces: "2 unidades", price: 14100, photo: "entradas-temakis", placeholder: "negro" },
    ],
  },
  {
    slug: "ensaladas",
    name: "Ensaladas",
    featured: true,
    products: [
      { name: "California", description: "Base de arroz, queso phila, palta y kanikama.", price: 14400, photo: "ensaladas-california", placeholder: "makisu" },
      { name: "Tuna", description: "Base de arroz, queso phila, palta y lomito de atún.", price: 14400, photo: "ensaladas-tuna", placeholder: "makisu" },
      { name: "Evolution", description: "Base de arroz, queso phila, palta y langostinos fritos.", price: 16400, photo: "ensaladas-evolution", placeholder: "makisu" },
      { name: "Teriyaki", description: "Base de arroz, queso phila, palta y pollo al teriyaki.", price: 15600, photo: "ensaladas-teriyaki", placeholder: "makisu" },
      { name: "Veggie", description: "Base de arroz, queso phila, palta, pepino, zanahoria y mango." + VEG, price: 12400, photo: "ensaladas-veggie", placeholder: "makisu" },
      { name: "Philadelphia", description: "Base de arroz, queso phila, palta y salmón ahumado.", price: 20600, photo: "ensaladas-philadelphia", placeholder: "makisu" },
      { name: "New York", description: "Base de arroz, queso phila, palta y salmón rosado.", price: 20600, photo: "ensaladas-new-york", placeholder: "makisu" },
      { name: "Langostinos", description: "Base de arroz, queso phila, palta y langostinos.", price: 21000, photo: "ensaladas-langostinos", placeholder: "makisu" },
    ],
  },
  {
    slug: "bagels",
    name: "Bagels",
    featured: true,
    products: [
      { name: "Bagel Tuna", description: "Bagel relleno con queso phila, lomito de atún sazonado en salsa Buenos Aires y palta.", price: 13200, photo: "bagels-tuna", placeholder: "kraft" },
      { name: "Bagel Teriyaki", description: "Bagel relleno con queso phila, guacamole y pollo al teriyaki.", price: 14800, photo: "bagels-teriyaki", placeholder: "kraft" },
      { name: "Bagel Veggie", description: "Bagel relleno con queso phila, remolacha, zanahoria y guacamole." + VEG, price: 10700, photo: "bagels-veggie", placeholder: "kraft" },
      { name: "Bagel Philadelphia", description: "Bagel relleno con queso phila, palta, tomate y salmón ahumado.", price: 17700, photo: "bagels-philadelphia", placeholder: "kraft" },
      { name: "Bagel New York", description: "Bagel relleno con queso phila, guacamole y salmón rosado cocido.", price: 17700, photo: "bagels-new-york", placeholder: "kraft" },
      {
        name: "Hamburguesa sushi",
        description: "Tapas de arroz (sushi o sushi hot) rellenas con lo que quieras: 1 proteína (pollo al teriyaki, salmón rosado, salmón ahumado o lomito de atún), 1 salsa (queso phila, guacamole o mayonesa picante) y 2 verduras (zanahoria, remolacha, tomate o palta).",
        price: 16300,
        photo: "bagels-hamburguesa",
        placeholder: "kraft",
      },
    ],
  },
];
