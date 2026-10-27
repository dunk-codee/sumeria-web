import { XLoader } from "@/components/XMark";
import { CartaIntro } from "@/components/site/CartaIntro";

/** Estado "cargando": skeleton con pulso suave (x-pulse). */
export default function CartaLoading() {
  return (
    <>
      <CartaIntro />
      <div className="h-[53px] border-b border-bone/12" />
      <div className="mx-auto flex max-w-[1280px] flex-col gap-7 px-gutter pt-12 pb-[120px]">
        <XLoader label="Cargando la carta…" />
        <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,280px),1fr))] gap-4" aria-hidden>
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="flex animate-x-pulse flex-col gap-3 pb-3" style={{ animationDelay: `${i * 120}ms` }}>
              <div className="aspect-[4/3] rounded-xs bg-raised" />
              <div className="h-[18px] w-3/5 rounded-xs bg-[#211E1B]" />
              <div className="h-3 w-[90%] rounded-xs bg-raised" />
              <div className="h-3 w-[70%] rounded-xs bg-raised" />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
