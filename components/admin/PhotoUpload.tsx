"use client";

import { CldUploadWidget, type CloudinaryUploadWidgetInfo } from "next-cloudinary";
import { Photo } from "../Photo";
import { abtn, AButton } from "./ui";

const CLOUD = Boolean(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME);

export type PhotoValue = { photoPublicId: string | null; photoUrl: string | null; photoCutout: boolean };

/** Subida firmada al Upload Widget de Cloudinary; guarda public_id + secure_url. */
export function PhotoUpload({
  value,
  placeholder,
  folder,
  onChange,
  hint,
  previewClass = "h-22.5 w-30",
  ratio = [4, 3],
}: {
  value: PhotoValue;
  placeholder: string;
  folder: "productos" | "eventos";
  onChange: (v: PhotoValue) => void;
  hint: string;
  previewClass?: string;
  ratio?: [number, number];
}) {
  const has = !!(value.photoPublicId || value.photoUrl);
  return (
    <div className="flex flex-wrap items-center gap-4">
      <Photo
        placeholder={placeholder}
        publicId={value.photoPublicId}
        url={value.photoUrl}
        cutout={value.photoCutout}
        alt="Foto actual"
        className={`${previewClass} flex-none rounded`}
        sizes="160px"
        ratio={ratio}
      />
      <div className="flex min-w-50 flex-1 flex-col gap-1.5">
        <span className="text-sm font-semibold">Foto</span>
        <span className="text-[12.5px] text-panel-muted">{hint}</span>
        <div className="flex flex-wrap items-center gap-2.5">
          {CLOUD ? (
            <CldUploadWidget
              signatureEndpoint="/api/admin/upload-sign"
              options={{
                folder: `sumeria/${folder}`,
                sources: ["local", "camera", "url"],
                multiple: false,
                maxFiles: 1,
                clientAllowedFormats: ["jpg", "jpeg", "png", "webp", "heic"],
                maxFileSize: 12_000_000,
                language: "es",
              }}
              onSuccess={(res) => {
                const info = res.info as CloudinaryUploadWidgetInfo;
                if (info?.public_id) {
                  onChange({ photoPublicId: info.public_id, photoUrl: info.secure_url, photoCutout: info.format === "png" || info.format === "webp" });
                }
              }}
            >
              {({ open }) => (
                <button type="button" onClick={() => open()} className={abtn({ variant: "outline", size: "sm" })}>
                  {has ? "Cambiar foto" : "Subir foto"}
                </button>
              )}
            </CldUploadWidget>
          ) : (
            <span className="text-[12.5px] text-kraft">Configurá Cloudinary (variables CLOUDINARY_*) para subir fotos.</span>
          )}
          {has && (
            <AButton variant="link" className="text-[13px]" onClick={() => onChange({ photoPublicId: null, photoUrl: null, photoCutout: false })}>
              Quitar
            </AButton>
          )}
        </div>
        {has && (
          <label className="flex items-center gap-2 text-[12.5px] text-sand">
            <input type="checkbox" checked={value.photoCutout} onChange={(e) => onChange({ ...value, photoCutout: e.target.checked })} className="accent-sumeria" />
            Foto recortada (sin fondo): se muestra entera sobre el fondo cálido
          </label>
        )}
      </div>
    </div>
  );
}
