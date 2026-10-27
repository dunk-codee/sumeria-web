"use client";

import Link from "next/link";
import { useOptimistic, useTransition } from "react";
import { addCategory, deleteCategory, reorderCategories, updateCategory } from "@/app/admin/actions";
import { cx } from "@/lib/format";
import type { Category } from "@/lib/schema";
import { AButton, Card, Switch, useRun } from "./ui";

type Row = Category & { count: number };

export function CategoriesEditor({ cats }: { cats: Row[] }) {
  const run = useRun();
  const [, start] = useTransition();
  const [list, setList] = useOptimistic(cats, (_cur, next: Row[]) => next);

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    const next = list.slice();
    [next[i], next[j]] = [next[j], next[i]];
    start(async () => {
      setList(next);
      await run(reorderCategories(next.map((c) => c.id)), "Orden guardado. La carta ya usa este orden.");
    });
  };
  const patch = (c: Row, p: { name?: string; visible?: boolean; featured?: boolean }, msg?: string) =>
    start(async () => {
      setList(list.map((x) => (x.id === c.id ? { ...x, ...p } : x)));
      await run(updateCategory(c.id, p), msg);
    });

  return (
    <div className="flex max-w-[860px] flex-col gap-2.5 px-5 pt-5 pb-12 md:px-8">
      <span className="text-[13px] text-panel-muted">
        El orden de esta lista es el orden de la barra de categorías en el sitio. Las marcadas como “Inicio” aparecen como accesos directos en la portada.
      </span>
      <Card className="overflow-x-auto">
        {list.map((c, i) => (
          <div key={c.id} className="flex min-w-[640px] items-center gap-3 border-b border-bone/6 px-3.5 py-2.5 last:border-b-0">
            <span className="w-5 font-mono text-xs text-stone-6">{i + 1}</span>
            <div className="flex flex-col">
              <button type="button" aria-label={`Subir ${c.name}`} disabled={i === 0} onClick={() => move(i, -1)} className={cx("h-[18px] w-7 text-[11px]", i === 0 ? "text-smoke-3" : "text-panel-soft")}>
                ▲
              </button>
              <button
                type="button"
                aria-label={`Bajar ${c.name}`}
                disabled={i === list.length - 1}
                onClick={() => move(i, 1)}
                className={cx("h-[18px] w-7 text-[11px]", i === list.length - 1 ? "text-smoke-3" : "text-panel-soft")}
              >
                ▼
              </button>
            </div>
            <input
              defaultValue={c.name}
              aria-label="Nombre de la categoría"
              onBlur={(e) => {
                const v = e.target.value.trim();
                if (v && v !== c.name) patch(c, { name: v }, "Categoría renombrada.");
                else e.target.value = c.name;
              }}
              onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
              className="h-[38px] flex-1 rounded border border-transparent bg-transparent px-2.5 font-display text-lg tracking-[.04em] text-panel-text uppercase outline-none hover:border-bone/16 focus:border-panel-text focus:bg-panel-bg"
            />
            <Link href={`/admin/productos/nuevo?cat=${c.id}`} className="w-[100px] text-[13px] text-panel-muted hover:text-panel-text" title="Agregar producto en esta categoría">
              {c.count} productos
            </Link>
            <span className="flex w-[110px] items-center gap-2">
              <Switch on={c.visible} onChange={(v) => patch(c, { visible: v }, v ? `${c.name} visible en la carta.` : `${c.name} oculta en la carta.`)} label={`Visible: ${c.name}`} />
              <span className="text-[12.5px] text-sand">{c.visible ? "Visible" : "Oculta"}</span>
            </span>
            <span className="flex w-[90px] items-center gap-2">
              <Switch on={c.featured} onChange={(v) => patch(c, { featured: v }, v ? `${c.name} aparece en el inicio.` : `${c.name} sale del inicio.`)} label={`En el inicio: ${c.name}`} />
              <span className="text-[12.5px] text-sand">Inicio</span>
            </span>
            <span className="w-14 text-right">
              {c.count === 0 && (
                <AButton
                  variant="danger"
                  className="text-[12.5px]"
                  onClick={() => confirm(`¿Eliminar la categoría "${c.name}"?`) && start(async () => void (await run(deleteCategory(c.id), "Categoría eliminada.")))}
                >
                  Quitar
                </AButton>
              )}
            </span>
          </div>
        ))}
      </Card>
      <div>
        <AButton variant="outline" size="sm" onClick={() => start(async () => void (await run(addCategory(), "Categoría creada (oculta hasta que la actives).")))}>
          + Nueva categoría
        </AButton>
      </div>
    </div>
  );
}
