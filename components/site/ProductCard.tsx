import type { MenuProduct } from "@/lib/data";
import { cx, money, piecesLabel } from "@/lib/format";
import { Photo } from "../Photo";
import { MetaTag } from "../ui";
import { CartControl } from "./CartControl";

/**
 * Tarjeta de producto. Mobile: fila con foto cuadrada de 108px.
 * Desktop (≥900px): tarjeta con foto 4:3. No disponible: gris y sin botón.
 */
export function ProductCard({ p, preview = false }: { p: MenuProduct; preview?: boolean }) {
  const off = !p.available;
  const pcs = piecesLabel(p.pieces);
  return (
    <article
      className={cx(
        "flex gap-3.5 border-b border-bone/8 py-3.5",
        "d:flex-col d:gap-0 d:overflow-hidden d:rounded-xs d:border d:border-bone/8 d:bg-coal d:py-0",
        preview && "flex-col! gap-0! overflow-hidden rounded-xs border! border-bone/8 bg-coal py-0!",
      )}
    >
      <Photo
        placeholder={p.placeholder}
        publicId={p.photoPublicId}
        url={p.photoUrl}
        cutout={p.photoCutout}
        alt={p.name}
        off={off}
        className={cx("h-[108px] flex-[0_0_108px] rounded-xs d:aspect-[4/3] d:h-auto d:flex-none d:rounded-none", preview && "aspect-[4/3]! h-auto! flex-none! rounded-none!")}
        sizes="(max-width: 899px) 108px, 340px"
      />
      <div className={cx("flex min-w-0 flex-1 flex-col gap-1.5 d:gap-2 d:px-[18px] d:pt-4 d:pb-[18px]", preview && "gap-2! px-[18px] pt-4 pb-[18px]")}>
        <h3
          className={cx(
            "order-1 m-0 font-display text-[19px] leading-[1.1] font-semibold uppercase d:order-2 d:text-[23px] d:leading-[1.05]",
            preview && "order-2! text-[23px]!",
            off ? "text-stone-5" : "text-bone",
          )}
        >
          {p.name || "Sin nombre"}
        </h3>
        {p.description && (
          <p className={cx("order-2 m-0 text-[13.5px] leading-[1.45] text-pretty text-stone-3 d:order-3 d:text-sm d:leading-normal", preview && "order-3! text-sm!")}>
            {p.description}
          </p>
        )}
        {(pcs || p.glutenFree || off) && (
          <div className={cx("order-3 flex flex-wrap items-center gap-1.5 d:order-1 d:min-h-5", preview && "order-1! min-h-5")}>
            {pcs && <span className="font-mono text-[10.5px] text-stone-2 uppercase d:text-[11px]">{pcs}</span>}
            {p.glutenFree && <MetaTag tone="gf">Sin gluten</MetaTag>}
            {off && <MetaTag tone="off">No disponible hoy</MetaTag>}
          </div>
        )}
        <div className="order-4 mt-auto flex items-center justify-between gap-2 d:pt-2">
          <span className={cx("font-display text-[21px] font-semibold d:text-2xl", preview && "text-2xl!", off ? "text-stone-6" : "text-sumeria")}>
            {money(p.price)}
          </span>
          {!preview &&
            (off ? (
              <span className="hidden font-mono text-[11px] text-stone-4 uppercase d:inline">Volvé mañana</span>
            ) : (
              <CartControl id={p.id} name={p.name} />
            ))}
        </div>
      </div>
    </article>
  );
}
