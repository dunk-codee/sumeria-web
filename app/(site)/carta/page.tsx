import type { Metadata } from "next";
import { CartaFilter, CartaSection } from "@/components/site/CategoryBar";
import { CartaIntro } from "@/components/site/CartaIntro";
import { ProductCard } from "@/components/site/ProductCard";
import { getMenu, getSettings } from "@/lib/data";
import { hoursOf } from "@/lib/hours";

export const metadata: Metadata = {
  title: "Carta",
  description: "Rolls, combinados, entradas, ensaladas y bagels. Armá tu pedido y mandalo por WhatsApp.",
};

export default async function CartaPage() {
  const [menu, settings] = await Promise.all([getMenu(), getSettings()]);
  const pedidos = hoursOf(settings, "pedidos");
  const sections = menu.filter((c) => c.products.length > 0);

  return (
    <>
      <CartaIntro pedidosFrom={pedidos.from} />
      <CartaFilter cats={sections.map((c) => ({ slug: c.slug, name: c.name }))}>
        <div className="mx-auto max-w-[1280px] px-gutter pb-[140px]">
          {sections.map((s) => (
            <CartaSection key={s.id} slug={s.slug}>
              <section id={`cat-${s.slug}`} aria-labelledby={`h-${s.slug}`} className="flex flex-col gap-4 pt-[clamp(36px,4vw,56px)]">
                <div className="flex items-baseline justify-between gap-3 border-b border-bone/12 pb-2.5">
                  <h2 id={`h-${s.slug}`} className="m-0 font-display text-[clamp(32px,3.6vw,48px)] leading-none font-semibold uppercase">
                    {s.name}
                  </h2>
                  <span className="font-mono text-[11px] text-stone-3 uppercase">{s.products.length} productos</span>
                </div>
                <div className="flex flex-col d:grid d:grid-cols-[repeat(auto-fill,minmax(min(100%,270px),1fr))] d:gap-4">
                  {s.products.map((p) => (
                    <ProductCard key={p.id} p={p} />
                  ))}
                </div>
              </section>
            </CartaSection>
          ))}
        </div>
      </CartaFilter>
    </>
  );
}
