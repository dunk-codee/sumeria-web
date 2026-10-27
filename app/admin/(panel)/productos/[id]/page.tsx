import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductEditor } from "@/components/admin/ProductEditor";
import { adminProduct, adminProducts } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Editar producto" };

export default async function EditProduct({ params, searchParams }: PageProps<"/admin/productos/[id]">) {
  await requireAdmin();
  const { id } = await params;
  const sp = await searchParams;
  const { cats } = await adminProducts();
  if (id === "nuevo") {
    const cat = Number(sp.cat);
    return <ProductEditor product={null} cats={cats} defaultCat={Number.isFinite(cat) && cat > 0 ? cat : undefined} />;
  }
  const n = Number(id);
  const product = Number.isInteger(n) && n > 0 ? await adminProduct(n) : null;
  if (!product) notFound();
  return <ProductEditor key={product.id} product={product} cats={cats} />;
}
