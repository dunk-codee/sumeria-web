import Image from "next/image";
import Link from "next/link";
import { InstagramIcon, WhatsAppIcon } from "@/components/icons";
import { CartDrawer, CartFab } from "@/components/site/CartDrawer";
import { MobileMenu, SiteHeader } from "@/components/site/SiteHeader";
import { NAV } from "@/components/site/nav";
import { SiteProvider } from "@/components/site/SiteProvider";
import { getMenu, getSettings } from "@/lib/data";
import { hoursOf } from "@/lib/hours";
import { waLink } from "@/lib/whatsapp";

const FOOT_LINK =
  "flex min-h-11 items-center gap-2.5 font-display text-sm tracking-[.12em] text-stone-2 uppercase transition-colors hover:text-bone";

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const [menu, settings] = await Promise.all([getMenu(), getSettings()]);
  const products = menu.flatMap((c) => c.products.map((p) => ({ id: p.id, name: p.name, pieces: p.pieces, price: p.price, available: p.available })));
  const salon = hoursOf(settings, "salon");

  return (
    <SiteProvider products={products} whatsapp={settings.whatsapp} pickupAddress={settings.address}>
      <SiteHeader />
      <main>{children}</main>
      <footer className="border-t border-bone/12 px-gutter pt-10 pb-25">
        <div className="mx-auto flex max-w-7xl flex-wrap items-start justify-between gap-6">
          <div className="flex flex-col gap-3.5">
            <Image src="/brand/sumeria-logo.png" alt="Sumeria Sushi" width={1187} height={154} className="h-auto w-45" />
            <span className="text-sm leading-relaxed text-stone-3">
              {settings.address} · {settings.city.split(",")[0]}
              <br />
              Todos los días desde las {salon.from}
            </span>
          </div>
          <div className="flex flex-wrap gap-x-16 gap-y-6">
            <nav aria-label="Secciones" className="flex flex-col">
              <span className="mb-1 font-mono text-[10.5px] text-stone-4 uppercase">Secciones</span>
              {NAV.map((n) => (
                <Link key={n.href} href={n.href} className={FOOT_LINK}>
                  {n.label}
                </Link>
              ))}
            </nav>
            <div className="flex flex-col">
              <span className="mb-1 font-mono text-[10.5px] text-stone-4 uppercase">Contacto</span>
              <a href={waLink(settings.whatsapp)} target="_blank" rel="noopener noreferrer" className={FOOT_LINK}>
                <WhatsAppIcon className="text-sumeria" />
                WhatsApp
              </a>
              <a href={`https://instagram.com/${settings.instagram}`} target="_blank" rel="noopener noreferrer" className={FOOT_LINK}>
                <InstagramIcon className="text-sumeria" />
                Instagram
              </a>
            </div>
          </div>
        </div>
        <div className="mx-auto mt-5 flex max-w-7xl items-center gap-1.5 font-mono text-[10.5px] text-stone-4 uppercase">
          © Sumeria Sushi 2026 · Diseñada por{" "}
          <a href="https://dunkcode.dev" target="_blank" rel="noopener" className="inline-flex min-h-11 items-center text-stone-2 underline-offset-2 transition-colors hover:text-bone hover:underline">
            DunkCode
          </a>
        </div>
      </footer>
      <CartFab />
      <MobileMenu whatsapp={settings.whatsapp} instagram={settings.instagram} address={settings.address} salonFrom={salon.from} />
      <CartDrawer />
    </SiteProvider>
  );
}
