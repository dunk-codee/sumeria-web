import { MotionConfig } from "framer-motion";
import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Instrument_Sans, Jost, Mrs_Saint_Delafield, Oswald } from "next/font/google";
import "./globals.css";

/*
 * Tipografías del prototipo (Google Fonts). El manual de marca define
 * Grafik Poster RND y Granat (licencias comerciales): cuando el local
 * entregue los archivos, reemplazar por next/font/local con las mismas variables.
 */
const oswald = Oswald({ variable: "--font-oswald", subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const instrument = Instrument_Sans({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});
const plexMono = IBM_Plex_Mono({ variable: "--font-plex-mono", subsets: ["latin"], weight: ["400", "500"] });
const script = Mrs_Saint_Delafield({ variable: "--font-script", subsets: ["latin"], weight: "400" });
// "SU SHI" del logo en el hero.
const jost = Jost({ variable: "--font-jost", subsets: ["latin"], weight: "300" });

export const metadata: Metadata = {
  title: { default: "Sumeria Sushi · Concepción del Uruguay", template: "%s · Sumeria Sushi" },
  description:
    "Sushi, rolls, ensaladas y bagels en 25 de Mayo 181, Concepción del Uruguay. Pedí por WhatsApp con delivery o take away, o reservá tu mesa.",
  openGraph: { siteName: "Sumeria Sushi", locale: "es_AR", type: "website" },
};

export const viewport: Viewport = { themeColor: "#0B0A09", colorScheme: "dark" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-AR" className={`${oswald.variable} ${instrument.variable} ${plexMono.variable} ${script.variable} ${jost.variable}`}>
      <body>
        {/* Respeta prefers-reduced-motion en todas las animaciones de framer-motion. */}
        <MotionConfig reducedMotion="user">{children}</MotionConfig>
      </body>
    </html>
  );
}
