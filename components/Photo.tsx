import Image from "next/image";
import { cx } from "@/lib/format";
import { placeholderBg } from "@/lib/placeholders";
import { CloudImage } from "./CloudImage";

const CLOUD = Boolean(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME);

/**
 * Foto de producto o evento. Siempre pinta el fondo cálido (placeholder) y,
 * si hay foto, la superpone: los recortes sin fondo se muestran enteros.
 */
export function Photo({
  placeholder,
  publicId,
  url,
  cutout = false,
  alt,
  sizes = "(max-width: 900px) 120px, 320px",
  off = false,
  className,
  imgClassName,
  children,
  ratio = [4, 3],
  bare = false,
}: {
  placeholder: string;
  publicId?: string | null;
  url?: string | null;
  cutout?: boolean;
  alt: string;
  sizes?: string;
  off?: boolean;
  className?: string;
  imgClassName?: string;
  children?: React.ReactNode;
  ratio?: [number, number];
  /** Sin fondo placeholder: deja ver el fondo del contenedor (la pizarra de la tarjeta). */
  bare?: boolean;
}) {
  const imgCls = cx(
    "absolute inset-0 h-full w-full",
    cutout ? "object-contain p-[9%] drop-shadow-[0_10px_16px_rgba(0,0,0,.6)]" : "object-cover",
    imgClassName,
  );
  const w = 640;
  const h = Math.round((w * ratio[1]) / ratio[0]);
  return (
    <div
      className={cx("relative overflow-hidden", className)}
      style={{ backgroundImage: bare ? undefined : placeholderBg(placeholder), filter: off ? "grayscale(1) brightness(.55)" : undefined }}
    >
      {publicId && CLOUD ? (
        <CloudImage publicId={publicId} alt={alt} width={w} height={h} cutout={cutout} sizes={sizes} className={imgCls} />
      ) : url ? (
        <Image src={url} alt={alt} fill sizes={sizes} className={imgCls} />
      ) : null}
      {children}
    </div>
  );
}
