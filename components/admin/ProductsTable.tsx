"use client";

import Link from "next/link";
import { Reorder, useDragControls } from "framer-motion";
import { useState, useTransition } from "react";
import { reorderProducts, toggleProductAvailable } from "@/app/admin/actions";
import { cx, money } from "@/lib/format";
import type { Category, Product } from "@/lib/schema";
import { Photo } from "../Photo";
import { Card, inputCls, Switch, useRun } from "./ui";

type Avail = "todos" | "on" | "off";

export function ProductsTable({ cats, prods, initialAvail, initialCat }: { cats: Category[]; prods: Product[]; initialAvail: Avail; initialCat: number | "todas" }) {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<number | "todas">(initialCat);
  const [avail, setAvail] = useState<Avail>(initialAvail);
  // El panel conserva la pantalla al navegar: si llegan otros filtros por la URL (p. ej. desde Categorías), se aplican.
  const [seenFilters, setSeenFilters] = useState(`${initialCat}|${initialAvail}`);
  if (seenFilters !== `${initialCat}|${initialAvail}`) {
    setSeenFilters(`${initialCat}|${initialAvail}`);
    setCat(initialCat);
    setAvail(initialAvail);
  }
  const run = useRun();
  const [, start] = useTransition();
  // Copia local para mostrar al instante los cambios de orden y de disponibilidad; se vuelve a sincronizar cuando llegan datos nuevos.
  const [list, setList] = useState(prods);
  const [seen, setSeen] = useState(prods);
  // Mientras hay un orden guardándose no se pisa la lista con la respuesta (vieja) del servidor: evita saltos al mover varios seguidos.
  const [saves, setSaves] = useState(0);
  if (prods !== seen) {
    setSeen(prods);
    if (saves === 0) setList(prods);
  }

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
      setList((cur) => cur.map((x) => (x.id === p.id ? { ...x, available: !p.available } : x)));
      await run(toggleProductAvailable(p.id, !p.available), p.available ? `${p.name} pausado.` : `${p.name} vuelve a estar disponible.`);
    });

  // Solo se ordena viendo la categoría completa (sin búsqueda ni filtro de disponibilidad).
  const canSort = !qq && avail === "todos";
  const groups = cats.map((c) => ({ cat: c, items: rows.filter((p) => p.categoryId === c.id) })).filter((g) => g.items.length > 0);

  const reorder = (categoryId: number, ids: number[]) =>
    setList((cur) => {
      const byId = new Map(cur.map((p) => [p.id, p]));
      const reordered = ids.map((id) => byId.get(id)!);
      let i = 0;
      return cur.map((p) => (p.categoryId === categoryId ? reordered[i++] : p));
    });
  const saveOrder = (categoryId: number) => {
    const ids = list.filter((p) => p.categoryId === categoryId).map((p) => p.id);
    setSaves((n) => n + 1);
    start(async () => {
      await run(reorderProducts(categoryId, ids), "Orden guardado.");
      setSaves((n) => n - 1);
    });
  };

  const grid = "grid min-w-215 grid-cols-[28px_56px_minmax(200px,2fr)_120px_90px_100px_80px_120px_60px] gap-3.5 px-4.5";

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
          <Card className="no-scrollbar overflow-x-auto">
            <div className={cx(grid, "border-b border-bone/8 py-2.5 font-mono text-[10.5px] text-panel-muted uppercase")}>
              <span />
              <span>Foto</span>
              <span>Producto</span>
              <span>Categoría</span>
              <span>Piezas</span>
              <span>Precio</span>
              <span>S/gluten</span>
              <span>Disponible</span>
              <span />
            </div>
            {!canSort && <div className="border-b border-bone/8 px-4.5 py-2 text-[12.5px] text-panel-muted">Para cambiar el orden, quitá la búsqueda y los filtros de disponibilidad.</div>}
            {groups.map((g) => (
              <div key={g.cat.id}>
                {cat === "todas" && (
                  <div className="border-b border-bone/8 bg-bone/4 px-4.5 py-1.5 font-mono text-[10.5px] tracking-wider text-sand uppercase">{g.cat.name}</div>
                )}
                <Reorder.Group
                  as="div"
                  axis="y"
                  values={g.items.map((p) => p.id)}
                  onReorder={(ids) => canSort && reorder(g.cat.id, ids)}
                  className="m-0 list-none p-0"
                >
                  {g.items.map((p) => (
                    <ProductRow key={p.id} p={p} categoryName={g.cat.name} grid={grid} canSort={canSort} onDrop={() => saveOrder(g.cat.id)} onToggle={() => toggle(p)} />
                  ))}
                </Reorder.Group>
              </div>
            ))}
          </Card>
        )}
      </div>
    </>
  );
}

function ProductRow({ p, categoryName, grid, canSort, onDrop, onToggle }: { p: Product; categoryName: string; grid: string; canSort: boolean; onDrop: () => void; onToggle: () => void }) {
  const controls = useDragControls();
  return (
    <Reorder.Item
      as="div"
      value={p.id}
      dragListener={false}
      dragControls={controls}
      onDragEnd={onDrop}
      whileDrag={{ boxShadow: "0 8px 24px rgb(0 0 0 / .45)", zIndex: 10 }}
      className={cx(grid, "relative items-center border-b border-bone/6 bg-panel-surface py-2.5 last:border-b-0")}
    >
      <button
        type="button"
        aria-label={`Mover ${p.name}: mantené y arrastrá`}
        title={canSort ? "Mantené y arrastrá para ordenar" : "Quitá los filtros para ordenar"}
        disabled={!canSort}
        onPointerDown={(e) => canSort && controls.start(e)}
        className={cx("flex h-8 w-7 touch-none items-center justify-center rounded text-panel-muted", canSort ? "cursor-grab hover:text-panel-text active:cursor-grabbing" : "cursor-not-allowed opacity-30")}
      >
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" aria-hidden>
          <path d="M5 7h14M5 12h14M5 17h14" />
        </svg>
      </button>
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
      <span className="text-[13px] text-sand">{categoryName}</span>
      <span className="text-[13px] text-sand">{p.pieces ? (/^\d+$/.test(p.pieces) ? `${p.pieces} pzs` : p.pieces) : "—"}</span>
      <span className="font-display text-[17px]">{money(p.price)}</span>
      <span className={cx("text-[13px]", p.glutenFree ? "text-kraft" : "text-stone-6")}>{p.glutenFree ? "Sí" : "—"}</span>
      <span className="flex items-center gap-2">
        <Switch on={p.available} onChange={onToggle} label={`Disponible: ${p.name}`} />
        <span className={cx("text-[12.5px]", p.available ? "text-sand" : "text-sumeria-light")}>{p.available ? "Sí" : "Pausado"}</span>
      </span>
      <Link href={`/admin/productos/${p.id}`} className="text-[13px] text-sand underline">
        Editar
      </Link>
    </Reorder.Item>
  );
}
