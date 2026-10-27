import type { Metadata } from "next";
import Link from "next/link";
import { ProductsTable } from "@/components/admin/ProductsTable";
import { abtn } from "@/components/admin/styles";
import { PageHead } from "@/components/admin/ui";
import { adminProducts } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Productos" };

export default async function ProductosAdmin({ searchParams }: PageProps<"/admin/productos">) {
  await requireAdmin();
  const sp = await searchParams;
  const { cats, prods } = await adminProducts();
  const avail = sp.disp === "off" ? "off" : sp.disp === "on" ? "on" : "todos";
  return (
    <>
      <PageHead kicker="Carta" title="Productos">
        <Link href="/admin/productos/nuevo" className={abtn({ variant: "primary" })}>
          + Agregar producto
        </Link>
      </PageHead>
      <div className="pt-4">
        <ProductsTable cats={cats} prods={prods} initialAvail={avail} />
      </div>
    </>
  );
}
