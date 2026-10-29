import { Eyebrow, PageTitle } from "../ui";

export function CartaIntro({ pedidosFrom = "19:30" }: { pedidosFrom?: string }) {
  return (
    <section className="px-gutter pt-page pb-5.5">
      <div className="mx-auto flex max-w-7xl flex-col gap-3">
        <Eyebrow>Carta</Eyebrow>
        <PageTitle>Armá tu pedido</PageTitle>
        <div className="flex flex-col gap-1 text-sm text-stone-2">
          <span>Delivery y take away desde las {pedidosFrom}. Lo mandás por WhatsApp y te confirmamos.</span>
          <span className="text-stone-3">Todos los pedidos incluyen palitos, salsa de soja y wasabi.</span>
        </div>
      </div>
    </section>
  );
}
