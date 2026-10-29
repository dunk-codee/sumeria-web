import Image from "next/image";
import Link from "next/link";
import { CartDrawer, CartFab } from "@/components/site/CartDrawer";
import { MobileMenu, SiteHeader } from "@/components/site/SiteHeader";
import { SiteProvider } from "@/components/site/SiteProvider";
import { getMenu, getSettings } from "@/lib/data";
import { hoursOf } from "@/lib/hours";
import { waLink } from "@/lib/whatsapp";

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const [menu, settings] = await Promise.all([getMenu(), getSettings()]);
  const products = menu.flatMap((c) => c.products.map((p) => ({ id: p.id, name: p.name, pieces: p.pieces, price: p.price, available: p.available })));
  const salon = hoursOf(settings, "salon");

  return (
    <SiteProvider products={products} whatsapp={settings.whatsapp} pickupAddress={settings.address}>
      <SiteHeader />
      <main>{children}</main>
      <footer className="border-t border-bone/12 px-gutter pt-10 pb-[100px]">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-start justify-between gap-6">
          <div className="flex flex-col gap-3.5">
            <Image src="/brand/sumeria-logo.png" alt="Sumeria Sushi" width={1187} height={154} className="h-auto w-[180px]" />
            <span className="text-sm leading-relaxed text-stone-3">
              {settings.address} · {settings.city.split(",")[0]}
              <br />
              Todos los días desde las {salon.from}
            </span>
          </div>
          <nav className="flex flex-wrap gap-x-[22px] gap-y-2.5 font-display text-sm tracking-[.12em] uppercase" aria-label="Contacto">
            <a href={waLink(settings.whatsapp)} target="_blank" rel="noopener noreferrer">
              WhatsApp
            </a>
            <a href={`https://instagram.com/${settings.instagram}`} target="_blank" rel="noopener noreferrer">
              Instagram
            </a>
            <Link href="/nosotros">Nosotros</Link>
          </nav>
        </div>
        <div className="mx-auto mt-7 max-w-[1280px] font-mono text-[10.5px] text-stone-4 uppercase">© Sumeria Sushi · Sitio por DunkCode</div>
      </footer>
      <CartFab />
      <MobileMenu whatsapp={settings.whatsapp} instagram={settings.instagram} address={settings.address} salonFrom={salon.from} />
      <CartDrawer />
    </SiteProvider>
  );
}
