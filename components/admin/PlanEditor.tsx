"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { savePlan } from "@/app/admin/actions";
import type { PlanData } from "@/lib/data";
import { cx } from "@/lib/format";
import { PLAN_H, SHAPE_LABELS, sizeFor } from "@/lib/plan";
import { TABLE_SHAPES, type TableShape } from "@/lib/schema";
import { FloorPlan, type PlanTable } from "../FloorPlan";
import { AButton, Card, Field, inputCls, Segmented, useRun } from "./ui";

type T = PlanData["tables"][number];
type Drag = { n: number; sx: number; sy: number; ox: number; oy: number; rect: DOMRect; moved: boolean };

export function PlanEditor({ initial, withUpcoming }: { initial: PlanData; withUpcoming: number[] }) {
  const run = useRun();
  const [saving, start] = useTransition();
  const [tables, setTables] = useState<T[]>(initial.tables);
  const [sel, setSel] = useState<number | null>(null);
  const [dirty, setDirty] = useState(false);
  const planRef = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const upd = (n: number, patch: Partial<T>) => {
    setDirty(true);
    setTables((ts) =>
      ts.map((t) => {
        if (t.n !== n) return t;
        const nt = { ...t, ...patch };
        const s = sizeFor(nt.capacity, nt.shape);
        return { ...nt, ...s, x: Math.min(nt.x, 100 - s.w), y: Math.min(nt.y, PLAN_H - s.h) };
      }),
    );
  };

  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = ((e.clientX - d.sx) / d.rect.width) * 100;
    const dy = ((e.clientY - d.sy) / d.rect.height) * PLAN_H;
    if (Math.abs(dx) + Math.abs(dy) > 0.5) d.moved = true;
    setTables((ts) =>
      ts.map((t) =>
        t.n === d.n
          ? { ...t, x: Math.max(0, Math.min(100 - t.w, Math.round(d.ox + dx))), y: Math.max(0, Math.min(PLAN_H - t.h, Math.round(d.oy + dy))) }
          : t,
      ),
    );
    if (d.moved) setDirty(true);
  };
  const onUp = () => {
    drag.current = null;
  };

  const add = (capacity: number, shape: TableShape) => {
    const n = Math.max(0, ...tables.map((t) => t.n)) + 1;
    setTables((ts) => [...ts, { n, capacity, shape, x: 26, y: 46, location: "Salón", ...sizeFor(capacity, shape) }]);
    setSel(n);
    setDirty(true);
  };

  const es = tables.find((t) => t.n === sel);
  const nudge = (e: React.KeyboardEvent, t: T) => {
    const step = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
    if (!step) return;
    e.preventDefault();
    upd(t.n, { x: Math.max(0, Math.min(100 - t.w, t.x + step[0])), y: Math.max(0, Math.min(PLAN_H - t.h, t.y + step[1])) });
  };

  const planList: PlanTable[] = tables.map((t) => ({
    ...t,
    round: t.shape === "round",
    className: cx(
      "cursor-grab touch-none select-none active:cursor-grabbing",
      sel === t.n ? "border-2 border-sumeria bg-sumeria/15 shadow-[0_6px_20px_rgba(0,0,0,.5)]" : "border-[1.5px] border-bone/85 bg-panel-surface",
    ),
    aria: `Mesa ${t.n}, ${t.capacity} lugares. Arrastrá o usá las flechas para moverla.`,
    onClick: () => setSel(t.n),
    onPointerDown: (e) => {
      e.preventDefault();
      const rect = planRef.current!.getBoundingClientRect();
      drag.current = { n: t.n, sx: e.clientX, sy: e.clientY, ox: t.x, oy: t.y, rect, moved: false };
      setSel(t.n);
    },
    style: { touchAction: "none" },
    content: (
      <span className="pointer-events-none flex flex-col items-center gap-0.5">
        <span className="font-display text-[15px] leading-none font-semibold">M{t.n}</span>
        <span className="font-mono text-[9px]">{t.capacity} lug.</span>
      </span>
    ),
  }));

  const save = () =>
    start(async () => {
      const r = await run(
        savePlan(tables.map(({ n, capacity, shape, x, y, location }) => ({ n, capacity, shape, x, y, location }))),
        "Plano guardado. Las reservas del sitio ya usan esta distribución.",
      );
      if (r?.ok) setDirty(false);
    });

  const renumber = (from: number, raw: string) => {
    const to = Number(raw);
    if (!Number.isInteger(to) || to < 1 || to > 999 || to === from) return;
    if (tables.some((t) => t.n === to)) return;
    setTables((ts) => ts.map((t) => (t.n === from ? { ...t, n: to } : t)));
    setSel(to);
    setDirty(true);
  };

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-bone/8 px-5 pt-7 pb-[18px] md:px-8">
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[11px] tracking-[.08em] text-panel-muted uppercase">Reservas</span>
          <h1 className="m-0 font-display text-[34px] leading-[1.05] font-semibold uppercase">Plano del local</h1>
        </div>
        <div className="flex items-center gap-2.5">
          <span className={cx("text-[13px]", dirty ? "text-kraft" : "text-panel-muted")}>{dirty ? "Cambios sin guardar" : "Guardado · se ve igual en el sitio"}</span>
          <AButton variant="primary" onClick={save} disabled={saving || !dirty}>
            {saving ? "Guardando…" : "Guardar plano"}
          </AButton>
        </div>
      </div>
      <div className="flex flex-wrap items-start gap-5 px-5 pt-5 pb-12 md:px-8">
        <div className="flex min-w-0 flex-[1_1_620px] flex-col gap-2.5">
          <span className="text-[13px] text-panel-muted">
            Arrastrá las mesas para ubicarlas (o seleccionala y usá las flechas). Tocá una para cambiar su capacidad o forma. Cocina, barra y baños son fijos.
          </span>
          <FloorPlan
            fixtures={initial.fixtures}
            tables={planList}
            grid="lines"
            fixtureTone="panel"
            containerRef={planRef}
            containerProps={{
              onPointerMove: onMove,
              onPointerUp: onUp,
              onPointerLeave: onUp,
              onKeyDown: (e) => es && nudge(e, es),
              style: { touchAction: "none", userSelect: "none" },
            }}
          />
          <span className="text-[12.5px] text-panel-muted">
            {tables.length} mesas · {tables.reduce((a, t) => a + t.capacity, 0)} lugares en total
          </span>
        </div>
        <div className="flex min-w-[260px] flex-[0_1_300px] flex-col gap-3.5">
          <Card className="flex flex-col gap-2.5 p-4">
            <span className="text-sm font-semibold">Agregar mesa</span>
            <div className="grid grid-cols-4 gap-1.5">
              {(
                [
                  [2, "round"],
                  [4, "square"],
                  [6, "long"],
                  [8, "long"],
                ] as const
              ).map(([cap, shape]) => (
                <button
                  key={cap}
                  type="button"
                  onClick={() => add(cap, shape)}
                  className="flex h-14 flex-col items-center justify-center gap-0.5 rounded border border-bone/20 hover:border-panel-text"
                >
                  <span className="font-display text-xl leading-none font-semibold">{cap}</span>
                  <span className="text-[11px] text-panel-muted">lugares</span>
                </button>
              ))}
            </div>
          </Card>
          <Card className={cx("flex flex-col gap-3 p-4", es && "border-sumeria!")}>
            {!es ? (
              <span className="text-[13.5px] text-panel-muted">Seleccioná una mesa del plano para editarla.</span>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <span className="font-display text-[26px] font-semibold uppercase">Mesa</span>
                  <input
                    key={es.n}
                    defaultValue={es.n}
                    inputMode="numeric"
                    aria-label="Número de mesa"
                    onBlur={(e) => {
                      renumber(es.n, e.target.value);
                      e.target.value = String(es.n);
                    }}
                    className={cx(inputCls, "h-10 w-16 font-display text-xl")}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[13px] font-semibold text-sand">Capacidad</span>
                  <div className="flex items-center justify-between rounded border border-bone/20 p-1">
                    <button type="button" aria-label="Menos lugares" onClick={() => upd(es.n, { capacity: Math.max(1, es.capacity - 1) })} className="h-9 w-9 text-xl">
                      −
                    </button>
                    <span className="font-display text-[22px] font-semibold">{es.capacity} lugares</span>
                    <button type="button" aria-label="Más lugares" onClick={() => upd(es.n, { capacity: Math.min(12, es.capacity + 1) })} className="h-9 w-9 text-xl">
                      +
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[13px] font-semibold text-sand">Forma</span>
                  <Segmented<TableShape> value={es.shape} onChange={(shape) => upd(es.n, { shape })} options={TABLE_SHAPES.map((k) => [k, SHAPE_LABELS[k]] as const)} />
                </div>
                <Field label="Ubicación (se muestra al reservar)">
                  <input value={es.location} onChange={(e) => upd(es.n, { location: e.target.value })} maxLength={60} className={inputCls} />
                </Field>
                {withUpcoming.includes(es.n) && <span className="text-xs text-kraft">Tiene reservas próximas: no se puede quitar hasta moverlas.</span>}
                <AButton
                  variant="danger"
                  className="self-start text-[13px]"
                  onClick={() => {
                    setTables((ts) => ts.filter((t) => t.n !== es.n));
                    setSel(null);
                    setDirty(true);
                  }}
                >
                  Quitar mesa
                </AButton>
              </>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
