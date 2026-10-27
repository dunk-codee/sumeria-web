import { v2 as cloudinary } from "cloudinary";

/** Carpeta base de las fotos de Sumeria en Cloudinary. */
export const CLOUDINARY_FOLDER = "sumeria";

export function cloudinaryEnabled(): boolean {
  return Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
}

export function getCloudinary() {
  if (!cloudinaryEnabled()) throw new Error("Cloudinary no está configurado (CLOUDINARY_CLOUD_NAME / API_KEY / API_SECRET).");
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  return cloudinary;
}

/** Firma los parámetros que manda el Upload Widget (subida firmada). */
export function signUploadParams(params: Record<string, string | number>): string {
  const c = getCloudinary();
  return c.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET as string);
}
