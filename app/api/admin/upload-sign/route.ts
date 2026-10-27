import { getSession } from "@/lib/auth";
import { cloudinaryEnabled, CLOUDINARY_FOLDER, signUploadParams } from "@/lib/cloudinary";

/**
 * POST /api/admin/upload-sign — firma los parámetros del Upload Widget de Cloudinary.
 * Solo para el panel: valida sesión y que la subida vaya a la carpeta de Sumeria.
 */
export async function POST(request: Request) {
  if (!(await getSession())) return Response.json({ error: "No autorizado" }, { status: 401 });
  if (!cloudinaryEnabled()) return Response.json({ error: "Cloudinary no está configurado" }, { status: 503 });

  const body = (await request.json().catch(() => null)) as { paramsToSign?: Record<string, string | number> } | null;
  const params = body?.paramsToSign;
  if (!params || typeof params !== "object") return Response.json({ error: "Faltan parámetros" }, { status: 400 });
  const folder = String(params.folder ?? "");
  if (folder !== CLOUDINARY_FOLDER && !folder.startsWith(`${CLOUDINARY_FOLDER}/`)) {
    return Response.json({ error: "Carpeta no permitida" }, { status: 400 });
  }
  return Response.json({ signature: signUploadParams(params) });
}
