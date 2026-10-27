"use client";

import { CldImage } from "next-cloudinary";

/** Foto servida por Cloudinary con f_auto,q_auto. `fill` recorta al aspecto de la tarjeta. */
export function CloudImage({
  publicId,
  alt,
  width,
  height,
  cutout,
  sizes,
  className,
}: {
  publicId: string;
  alt: string;
  width: number;
  height: number;
  cutout: boolean;
  sizes?: string;
  className?: string;
}) {
  return (
    <CldImage
      src={publicId}
      alt={alt}
      width={width}
      height={height}
      crop={cutout ? "fit" : { type: "fill", gravity: "auto" }}
      format="auto"
      quality="auto"
      sizes={sizes}
      className={className}
    />
  );
}
