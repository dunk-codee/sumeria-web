import type { Metadata } from "next";
import { CategoriesEditor } from "@/components/admin/CategoriesEditor";
import { PageHead } from "@/components/admin/ui";
import { adminProducts } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Categorías" };

export default async function CategoriasAdmin() {
  await requireAdmin();
  const { cats, prods } = await adminProducts();
  const rows = cats.map((c) => ({ ...c, count: prods.filter((p) => p.categoryId === c.id).length }));
  return (
    <>
      <PageHead kicker="Carta" title="Categorías" />
      <CategoriesEditor key={rows.map((r) => `${r.id}:${r.name}`).join("|")} cats={rows} />
    </>
  );
}
