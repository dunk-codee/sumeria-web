"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteProduct, saveProduct, type ProductInput } from "@/app/admin/actions";
import { cx } from "@/lib/format";
import { PLACEHOLDER_LABELS } from "@/lib/placeholders";
import { PLACEHOLDERS, type Category, type Placeholder, type Product } from "@/lib/schema";
import { ProductCard } from "../site/ProductCard";
import { PhotoUpload } from "./PhotoUpload";
import { AButton, abtn, Card, ConfirmModal, Field, inputCls, Switch, useRun } from "./ui";

const DESC_SOFT = 120;

export function ProductEditor({ product, cats, defaultCat }: { product: Product | null; cats: Category[]; defaultCat?: number }) {
  const router = useRouter();
  const run = useRun();
  const [saving, start] = useTransition();
  const [askDelete, setAskDelete] = useState(false);
  const [ed, setEd] = useState({
    name: product?.name ?? "",
    description: product?.description ?? "",
    pieces: product?.pieces ?? "",
    price: product ? String(product.price) : "",
    categoryId: product?.categoryId ?? defaultCat ?? cats[0]?.id ?? 0,
    glutenFree: product?.glutenFree ?? false,
    available: product?.available ?? true,
    placeholder: (product?.placeholder ?? "madera") as Placeholder,
    photoPublicId: product?.photoPublicId ?? null,
    photoUrl: product?.photoUrl ?? null,
    photoCutout: product?.photoCutout ?? false,
  });
  const set = (p: Partial<typeof ed>) => setEd((s) => ({ ...s, ...p }));

  const [errors, setErrors] = useState<{ name?: string; description?: string; price?: string }>({});
  const clear = (k: "name" | "description" | "price") => setErrors((e) => (e[k] ? { ...e, [k]: undefined } : e));
  const bad = (k: "name" | "description" | "price") => (errors[k] ? "border-sumeria" : "");

  const save = () => {
    const next: { name?: string; description?: string; price?: string } = {};
    if (!ed.name.trim()) next.name = "Poné un nombre para el producto.";
    if (!ed.description.trim()) next.description = "Escribí una descripción corta.";
    if (!(Number(ed.price) > 0)) next.price = "Poné un precio mayor a 0.";
    setErrors(next);
    const first = next.name ? "product-name" : next.description ? "product-description" : next.price ? "product-price" : null;
    if (first) {
      document.getElementById(first)?.focus();
      return;
    }
    start(async () => {
      const input: ProductInput = { ...ed, id: product?.id, price: Number(ed.price) || 0 };
      const r = await run(saveProduct(input), "Producto guardado. Ya se ve en la carta.");
      if (r?.ok) router.push("/admin/productos");
    });
  };

  const remove = () => {
    if (!product) return;
    setAskDelete(false);
    start(async () => {
      const r = await run(deleteProduct(product.id), "Producto eliminado.");
      if (r?.ok) router.push("/admin/productos");
    });
  };

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-bone/8 px-5 pt-7 pb-4.5 md:px-8">
        <div className="flex flex-col gap-1">
          <Link href="/admin/productos" className="font-mono text-[11px] tracking-[.08em] text-panel-muted uppercase">
            ← Productos
          </Link>
          <h1 className="m-0 font-display text-[34px] leading-[1.05] font-semibold uppercase">{product ? "Editar producto" : "Nuevo producto"}</h1>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/productos" className={abtn({ variant: "outline" })}>
            Cancelar
          </Link>
          <AButton variant="primary" onClick={save} disabled={saving}>
            {saving ? "Guardando…" : product ? "Guardar cambios" : "Crear producto"}
          </AButton>
        </div>
      </div>
      <div className="flex flex-wrap items-start gap-7 px-5 pt-6 pb-12 md:px-8">
        <div className="flex min-w-0 flex-[1_1_460px] flex-col gap-4">
          <Card className="p-4">
            <PhotoUpload
              value={ed}
              placeholder={ed.placeholder}
              folder="productos"
              onChange={set}
              hint="JPG o PNG, horizontal. Mejor sobre fondo oscuro, con luz cálida. Un PNG sin fondo también queda bien."
            />
          </Card>
          <Field label="Nombre" error={errors.name}>
            <input
              id="product-name"
              value={ed.name}
              onChange={(e) => (set({ name: e.target.value }), clear("name"))}
              aria-invalid={!!errors.name}
              className={cx(inputCls, "h-10.5 text-[15px]", bad("name"))}
            />
          </Field>
          <Field
            label="Descripción corta"
            error={errors.description}
            hint={
              <span className={ed.description.length > DESC_SOFT ? "text-kraft" : undefined}>
                {ed.description.length}/{DESC_SOFT} · corta y concreta
              </span>
            }
          >
            <textarea
              id="product-description"
              value={ed.description}
              onChange={(e) => (set({ description: e.target.value.slice(0, 280) }), clear("description"))}
              rows={3}
              aria-invalid={!!errors.description}
              className={cx(inputCls, "h-auto resize-y py-2.5 text-[15px]", bad("description"))}
            />
          </Field>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Field label="Precio" error={errors.price}>
              <input
                id="product-price"
                value={ed.price}
                onChange={(e) => (set({ price: e.target.value.replace(/\D/g, "") }), clear("price"))}
                inputMode="numeric"
                aria-invalid={!!errors.price}
                className={cx(inputCls, "h-10.5 text-[15px]", bad("price"))}
              />
            </Field>
            <Field
              label={
                <>
                  Piezas <span className="font-normal text-panel-muted">(opcional)</span>
                </>
              }
            >
              <input
                value={ed.pieces}
                onChange={(e) => set({ pieces: e.target.value.replace(/\D/g, "").slice(0, 3) })}
                inputMode="numeric"
                placeholder="Ej.: 10"
                className={cx(inputCls, "h-10.5 text-[15px]")}
              />
            </Field>
            <Field label="Categoría">
              <select value={ed.categoryId} onChange={(e) => set({ categoryId: Number(e.target.value) })} className={cx(inputCls, "h-10.5 px-2.5")}>
                {cats.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Fondo mientras no haya foto">
            <select value={ed.placeholder} onChange={(e) => set({ placeholder: e.target.value as Placeholder })} className={cx(inputCls, "px-2.5 sm:w-60")}>
              {PLACEHOLDERS.map((k) => (
                <option key={k} value={k}>
                  {PLACEHOLDER_LABELS[k]}
                </option>
              ))}
            </select>
          </Field>
          <div className="flex flex-col gap-px overflow-hidden rounded-md border border-bone/8 bg-bone/8">
            {(
              [
                ["glutenFree", "Sin gluten", "Muestra la etiqueta en la carta"],
                ["available", "Disponible", "Si lo pausás, aparece como “no disponible” y no se puede pedir hasta que lo vuelvas a activar"],
              ] as const
            ).map(([k, title, sub]) => (
              <div key={k} className="flex items-center justify-between gap-3 bg-panel-surface px-4 py-3.5">
                <span className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold">{title}</span>
                  <span className="text-[12.5px] text-panel-muted">{sub}</span>
                </span>
                <Switch on={ed[k]} onChange={(v) => set({ [k]: v })} label={title} />
              </div>
            ))}
          </div>
          {product && (
            <AButton variant="danger" onClick={() => setAskDelete(true)} disabled={saving} className="self-start text-[13px]">
              Eliminar producto
            </AButton>
          )}
        </div>
        <div className="flex max-w-90 flex-[1_1_280px] flex-col gap-2.5 md:sticky md:top-6">
          <span className="font-mono text-[10.5px] text-panel-muted uppercase">Así se ve en la carta</span>
          <ProductCard
            preview
            p={{
              id: product?.id ?? 0,
              name: ed.name,
              description: ed.description,
              pieces: ed.pieces || null,
              price: Number(ed.price) || 0,
              glutenFree: ed.glutenFree,
              available: ed.available,
              placeholder: ed.placeholder,
              photoPublicId: ed.photoPublicId,
              photoUrl: ed.photoUrl,
              photoCutout: ed.photoCutout,
            }}
          />
        </div>
      </div>
      <ConfirmModal
        open={askDelete}
        title="¿Eliminar el producto?"
        body={
          <>
            Vas a eliminar <strong className="text-panel-text">{product?.name}</strong> de la carta y no se puede deshacer. Si es solo por un rato, mejor pausalo con el interruptor
            “Disponible”.
          </>
        }
        confirmLabel="Sí, eliminar"
        busy={saving}
        onClose={() => setAskDelete(false)}
        onConfirm={remove}
      />
    </>
  );
}
