"use client";

import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { toggleProductAvailable } from "@/app/admin/actions";
import { cx, money } from "@/lib/format";
import type { Category, Product } from "@/lib/schema";
import { Photo } from "../Photo";
import { Card, inputCls, Switch, useRun } from "./ui";

type Avail = "todos" | "on" | "off";

export function ProductsTable({ cats, prods, initialAvail }: { cats: Category[]; prods: Product[]; initialAvail: Avail }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<number | "todas">("todas");
  const [avail, setAvail] = useState<Avail>(initialAvail);
  const run = useRun();
  const [, start] = useTransition();
  const [list, setOptimistic] = useOptimistic(prods, (cur, p: { id: number; available: boolean }) =>
    cur.map((x) => (x.id === p.id ? { ...x, available: p.available } : x)),
  );

  const catName = (id: number) => cats.find((c) => c.id === id)?.name ?? "—";
  const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const qq = norm(q.trim());
  const rows = list.filter(
    (p) =>
      (cat === "todas" || p.categoryId === cat) &&
      (avail === "todos" || (avail === "on" ? p.available : !p.available)) &&
      (!qq || norm(`${p.name} ${p.description}`).includes(qq)),
  );

  const toggle = (p: Product) =>
    start(async () => {
      setOptimistic({ id: p.id, available: !p.available });
      await run(toggleProductAvailable(p.id, !p.available), p.available ? `${p.name} pausado para hoy.` : `${p.name} vuelve a estar disponible.`);
    });

  const grid = "grid min-w-215 grid-cols-[56px_minmax(200px,2fr)_120px_90px_100px_80px_120px_60px] gap-3.5 px-4.5";

  return (
    <>
      <div className="flex flex-wrap items-center gap-2.5 border-b border-bone/8 px-5 pb-4 md:px-8">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre o ingrediente"
          aria-label="Buscar productos"
          className={cx(inputCls, "h-9.5 w-auto flex-[0_1_320px]")}
        />
        <select
          value={cat}
          onChange={(e) => setCat(e.target.value === "todas" ? "todas" : Number(e.target.value))}
          aria-label="Filtrar por categoría"
          className={cx(inputCls, "h-9.5 w-auto px-2.5")}
        >
          <option value="todas">Todas las categorías</option>
          {cats.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <div className="flex gap-1">
          {(
            [
              ["todos", "Todos"],
              ["on", "Disponibles"],
              ["off", "Pausados"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              aria-pressed={avail === id}
              onClick={() => setAvail(id)}
              className={cx("flex h-8.5 items-center rounded-full border px-3 text-[13px]", avail === id ? "border-panel-text text-panel-text" : "border-bone/18 text-panel-muted")}
            >
              {label}
            </button>
          ))}
        </div>
        <span className="ml-auto text-[13px] text-panel-muted">
          {rows.length} de {list.length} productos
        </span>
      </div>
      <div className="px-5 pt-4 pb-12 md:px-8">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-md border border-dashed border-bone/16 px-6 py-12 text-center">
            <span className="font-semibold">No encontramos productos con esa búsqueda</span>
            <button type="button" onClick={() => (setQ(""), setCat("todas"), setAvail("todos"))} className="text-[13px] text-panel-muted underline">
              Limpiar filtros
            </button>
          </div>
        ) : (
          <Card className="overflow-x-auto">
            <div className={cx(grid, "border-b border-bone/8 py-2.5 font-mono text-[10.5px] text-panel-muted uppercase")}>
              <span>Foto</span>
              <span>Producto</span>
              <span>Categoría</span>
              <span>Piezas</span>
              <span>Precio</span>
              <span>S/gluten</span>
              <span>Disponible</span>
              <span />
            </div>
            {rows.map((p) => (
              <div key={p.id} className={cx(grid, "items-center border-b border-bone/6 py-2.5 last:border-b-0")}>
                <Photo
                  placeholder={p.placeholder}
                  publicId={p.photoPublicId}
                  url={p.photoUrl}
                  cutout={p.photoCutout}
                  alt=""
                  off={!p.available}
                  className="h-12 w-12 rounded"
                  imgClassName="p-[4%]!"
                  sizes="48px"
                  ratio={[1, 1]}
                />
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className={cx("text-sm font-semibold", p.available ? "text-panel-text" : "text-panel-muted")}>{p.name}</span>
                  <span className="truncate text-[12.5px] text-panel-muted">{p.description}</span>
                </div>
                <span className="text-[13px] text-sand">{catName(p.categoryId)}</span>
                <span className="text-[13px] text-sand">{p.pieces ? (/^\d+$/.test(p.pieces) ? `${p.pieces} pzs` : p.pieces) : "—"}</span>
                <span className="font-display text-[17px]">{money(p.price)}</span>
                <span className={cx("text-[13px]", p.glutenFree ? "text-kraft" : "text-stone-6")}>{p.glutenFree ? "Sí" : "—"}</span>
                <span className="flex items-center gap-2">
                  <Switch on={p.available} onChange={() => toggle(p)} label={`Disponible: ${p.name}`} />
                  <span className={cx("text-[12.5px]", p.available ? "text-sand" : "text-sumeria-light")}>{p.available ? "Sí" : "Pausado"}</span>
                </span>
                <Link href={`/admin/productos/${p.id}`} className="text-[13px] text-sand underline">
                  Editar
                </Link>
              </div>
            ))}
          </Card>
        )}
      </div>
    </>
  );
}
