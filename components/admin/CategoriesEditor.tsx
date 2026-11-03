"use client";

import { Reorder, useDragControls } from "framer-motion";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { addCategory, deleteCategory, reorderCategories, updateCategory } from "@/app/admin/actions";
import { CATEGORY_NAME_MAX, FEATURED_MAX } from "@/lib/categories";
import { cx } from "@/lib/format";
import type { Category } from "@/lib/schema";
import { AButton, Card, ConfirmModal, Switch, useRun } from "./ui";

type Row = Category & { count: number };
type Patch = { name?: string; visible?: boolean; featured?: boolean };

export function CategoriesEditor({ cats }: { cats: Row[] }) {
  const run = useRun();
  const [, start] = useTransition();
  // Copia local: muestra al instante el orden y los cambios; se resincroniza cuando llegan datos nuevos del servidor.
  const [list, setList] = useState(cats);
  const [seen, setSeen] = useState(cats);
  const [saves, setSaves] = useState(0);
  if (cats !== seen) {
    setSeen(cats);
    if (saves === 0) setList(cats);
  }
  const [errors, setErrors] = useState<Record<number, string>>({});
  const [toDelete, setToDelete] = useState<Row | null>(null);
  const [limitMsg, setLimitMsg] = useState<string | null>(null);
  const focusId = useRef<number | null>(null);

  // La categoría recién creada queda con el nombre seleccionado, lista para escribir.
  useEffect(() => {
    if (focusId.current == null) return;
    const el = document.getElementById(`cat-name-${focusId.current}`) as HTMLInputElement | null;
    if (el) {
      focusId.current = null;
      el.focus();
      el.select();
    }
  }, [list]);

  const featuredCount = list.filter((c) => c.featured).length;

  const saveOrder = (ids: number[]) => {
    setSaves((n) => n + 1);
    start(async () => {
      await run(reorderCategories(ids), "Orden guardado.");
      setSaves((n) => n - 1);
    });
  };

  const patch = (c: Row, p: Patch, msg?: string) =>
    start(async () => {
      setList((cur) => cur.map((x) => (x.id === c.id ? { ...x, ...p } : x)));
      const r = await run(updateCategory(c.id, p), msg);
      // Si el servidor lo rechazó (p. ej. tope del inicio), se deshace el cambio en pantalla.
      if (r && !r.ok) setList((cur) => cur.map((x) => (x.id === c.id ? c : x)));
    });

  const rename = (c: Row, input: HTMLInputElement) => {
    const v = input.value.trim();
    if (v === c.name) return setErrors((e) => ({ ...e, [c.id]: "" }));
    if (!v) return setErrors((e) => ({ ...e, [c.id]: "Poné un nombre para la categoría." }));
    if (list.some((x) => x.id !== c.id && x.name.trim().toLowerCase() === v.toLowerCase())) {
      return setErrors((e) => ({ ...e, [c.id]: "Ya hay una categoría con ese nombre." }));
    }
    setErrors((e) => ({ ...e, [c.id]: "" }));
    patch(c, { name: v }, "Categoría renombrada.");
  };

  const toggleFeatured = (c: Row, v: boolean) => {
    if (v && featuredCount >= FEATURED_MAX) {
      setLimitMsg(`En el inicio caben ${FEATURED_MAX} categorías. Sacá una para agregar otra.`);
      return;
    }
    setLimitMsg(null);
    patch(c, { featured: v }, v ? `${c.name} aparece en el inicio.` : `${c.name} sale del inicio.`);
  };

  const create = () =>
    start(async () => {
      const r = await run(addCategory(), "Categoría creada (oculta hasta que la actives).");
      if (r?.ok && "id" in r && typeof r.id === "number") focusId.current = r.id;
    });

  return (
    <div className="flex max-w-215 flex-col gap-2.5 px-5 pt-5 pb-12 md:px-8">
      <span className="text-[13px] text-panel-muted">
        El orden de esta lista es el orden de la barra de categorías en el sitio: mantené apretado el ícono ≡ y arrastrá. Las marcadas como “Inicio” aparecen como accesos
        directos en la portada.
      </span>
      <span className={cx("text-[13px]", limitMsg ? "font-semibold text-sumeria-light" : "text-panel-muted")} role={limitMsg ? "alert" : undefined}>
        {limitMsg ?? `${featuredCount} de ${FEATURED_MAX} en el inicio`}
      </span>
      <Card className="no-scrollbar overflow-x-auto">
        <Reorder.Group
          as="div"
          axis="y"
          values={list.map((c) => c.id)}
          onReorder={(ids) => setList((cur) => ids.map((id) => cur.find((c) => c.id === id)!))}
          className="m-0 list-none p-0"
        >
          {list.map((c, i) => (
            <CategoryRow
              key={c.id}
              c={c}
              index={i}
              error={errors[c.id]}
              onDrop={() => saveOrder(list.map((x) => x.id))}
              onRename={(input) => rename(c, input)}
              onClearError={() => errors[c.id] && setErrors((e) => ({ ...e, [c.id]: "" }))}
              onVisible={(v) => patch(c, { visible: v }, v ? `${c.name} visible en la carta.` : `${c.name} oculta en la carta.`)}
              onFeatured={(v) => toggleFeatured(c, v)}
              onDelete={() => setToDelete(c)}
            />
          ))}
        </Reorder.Group>
      </Card>
      <div>
        <AButton variant="outline" size="sm" onClick={create}>
          + Nueva categoría
        </AButton>
      </div>
      <ConfirmModal
        open={toDelete !== null}
        title="¿Eliminar la categoría?"
        body={
          <>
            Vas a eliminar <strong className="text-panel-text">{toDelete?.name}</strong> de la carta. Como no tiene productos, no se pierde nada más. Si solo querés
            esconderla, usá “Visible”.
          </>
        }
        confirmLabel="Sí, eliminar"
        onClose={() => setToDelete(null)}
        onConfirm={() => {
          const c = toDelete;
          setToDelete(null);
          if (c) start(async () => void (await run(deleteCategory(c.id), "Categoría eliminada.")));
        }}
      />
    </div>
  );
}

function CategoryRow({
  c,
  index,
  error,
  onDrop,
  onRename,
  onClearError,
  onVisible,
  onFeatured,
  onDelete,
}: {
  c: Row;
  index: number;
  error?: string;
  onDrop: () => void;
  onRename: (input: HTMLInputElement) => void;
  onClearError: () => void;
  onVisible: (v: boolean) => void;
  onFeatured: (v: boolean) => void;
  onDelete: () => void;
}) {
  const controls = useDragControls();
  return (
    <Reorder.Item
      as="div"
      value={c.id}
      dragListener={false}
      dragControls={controls}
      onDragEnd={onDrop}
      whileDrag={{ boxShadow: "0 8px 24px rgb(0 0 0 / .45)", zIndex: 10 }}
      className="relative flex min-w-160 items-start gap-3 border-b border-bone/6 bg-panel-surface px-3.5 py-2.5 last:border-b-0"
    >
      <span className="mt-2.5 w-5 font-mono text-xs text-stone-6">{index + 1}</span>
      <button
        type="button"
        aria-label={`Mover ${c.name}: mantené y arrastrá`}
        title="Mantené y arrastrá para ordenar"
        onPointerDown={(e) => controls.start(e)}
        className="mt-1 flex h-8 w-7 cursor-grab touch-none items-center justify-center rounded text-panel-muted hover:text-panel-text active:cursor-grabbing"
      >
        <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" aria-hidden>
          <path d="M5 7h14M5 12h14M5 17h14" />
        </svg>
      </button>
      <div className="flex flex-1 flex-col gap-1">
        <input
          id={`cat-name-${c.id}`}
          key={c.name}
          defaultValue={c.name}
          maxLength={CATEGORY_NAME_MAX}
          aria-label="Nombre de la categoría"
          aria-invalid={!!error}
          onChange={onClearError}
          onBlur={(e) => onRename(e.target)}
          onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
          className={cx(
            "h-9.5 w-full rounded border bg-transparent px-2.5 font-display text-lg tracking-[.04em] text-panel-text uppercase outline-none hover:border-bone/16 focus:border-panel-text focus:bg-panel-bg",
            error ? "border-sumeria" : "border-transparent",
          )}
        />
        {error && (
          <span role="alert" className="px-1 text-xs font-semibold text-sumeria-light">
            {error}
          </span>
        )}
      </div>
      <span className="mt-2.5 flex w-36 items-center gap-2 text-[13px]">
        <Link href={`/admin/productos?cat=${c.id}`} className="text-panel-muted hover:text-panel-text" title="Ver los productos de esta categoría">
          {c.count} productos
        </Link>
        <Link href={`/admin/productos/nuevo?cat=${c.id}`} className="font-semibold text-sand hover:text-panel-text" title="Agregar un producto en esta categoría" aria-label={`Agregar producto en ${c.name}`}>
          +
        </Link>
      </span>
      <span className="mt-2.5 flex w-27.5 items-center gap-2">
        <Switch on={c.visible} onChange={onVisible} label={`Visible: ${c.name}`} />
        <span className="text-[12.5px] text-sand">{c.visible ? "Visible" : "Oculta"}</span>
      </span>
      <span className="mt-2.5 flex w-22.5 items-center gap-2">
        <Switch on={c.featured} onChange={onFeatured} label={`En el inicio: ${c.name}`} />
        <span className="text-[12.5px] text-sand">Inicio</span>
      </span>
      <span className="mt-2.5 w-14 text-right">
        {c.count === 0 && (
          <AButton variant="danger" className="text-[12.5px]" onClick={onDelete}>
            Quitar
          </AButton>
        )}
      </span>
    </Reorder.Item>
  );
}
