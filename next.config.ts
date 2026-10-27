import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // PGlite (base local de desarrollo) usa WASM y archivos propios: no se empaqueta.
  serverExternalPackages: ["@electric-sql/pglite"],
  // next-cloudinary lee estas variables públicas; se derivan de las del servidor
  // para no duplicar configuración en Vercel.
  env: {
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME ?? "",
    NEXT_PUBLIC_CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY ?? "",
  },
  images: {
    // 75 por defecto; 85 para el hero.
    qualities: [75, 85],
    remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }],
  },
};

export default nextConfig;
