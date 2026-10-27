"use client";

import { useState, useTransition } from "react";
import { deleteEvent, saveEvent, type EventInput } from "@/app/admin/actions";
import { addDays, dayMonth } from "@/lib/dates";
import { cx } from "@/lib/format";
import { PLACEHOLDER_LABELS } from "@/lib/placeholders";
import { PLACEHOLDERS, type Category, type EventRow, type EventType, type Placeholder } from "@/lib/schema";
import { Photo } from "../Photo";
import { EventCard } from "../site/EventCard";
import { typeTag, TYPE_LABELS } from "../ui";
import { PhotoUpload } from "./PhotoUpload";
import { AButton, Card, Field, inputCls, Segmented, useRun } from "./ui";

type Draft = Omit<EventInput, "id"> & { id?: number };

const blank = (today: string): Draft => ({
  type: "promo",
  title: "",
  description: "",
  ctaLabel: "Armá tu pedido",
  ctaTarget: "carta",
  eventDate: null,
  whenLabel: "",
  publishedAt: today,
  expiresAt: addDays(today, 14),
  placeholder: "madera",
  photoPublicId: null,
  photoUrl: null,
});

const fromRow = (e: EventRow): Draft => ({ ...e, whenLabel: e.whenLabel ?? "" });

function statusOf(e: Pick<EventRow, "publishedAt" | "expiresAt">, today: string) {
  if (e.publishedAt > today) return { label: "Programado", cls: "border-kraft text-kraft" };
  if (e.expiresAt < today) return { label: "Vencido", cls: "border-stone-6 text-stone-6" };
  return { label: "Publicado", cls: "border-bone/50 text-panel-text" };
}

export function EventsEditor({ events, cats, today, instagram, startNew }: { events: EventRow[]; cats: Category[]; today: string; instagram: string; startNew: boolean }) {
  const run = useRun();
  const [saving, start] = useTransition();
  const first = events.find((e) => e.expiresAt >= today) ?? events[0];
  const [sel, setSel] = useState<number | null>(startNew || !first ? null : first.id);
  const [draft, setDraft] = useState<Draft>(startNew || !first ? blank(today) : fromRow(first));
  const set = (p: Partial<Draft>) => setDraft((d) => ({ ...d, ...p }));

  const pick = (e: EventRow) => {
    setSel(e.id);
    setDraft(fromRow(e));
  };
  const startBlank = () => {
    setSel(null);
    setDraft(blank(today));
  };

  const save = () =>
    start(async () => {
      const r = await run(saveEvent({ ...draft, id: sel ?? undefined, whenLabel: draft.whenLabel || null }), sel ? "Publicación guardada." : "Publicación creada.");
      if (r?.ok && r.id) setSel(r.id);
    });
  const remove = () => {
    if (!sel || !confirm("¿Eliminar esta publicación?")) return;
    start(async () => {
      const r = await run(deleteEvent(sel), "Publicación eliminada.");
      if (r?.ok) startBlank();
    });
  };

  const targets: [string, string][] = [
    ["carta", "La carta"],
    ["reserva", "Reservas"],
    ["ig", "Instagram"],
    ...cats.map((c) => [`cat:${c.slug}`, `Carta · ${c.name}`] as [string, string]),
  ];

  return (
    <div className="flex flex-wrap items-start gap-6 px-5 pt-5 pb-12 md:px-8">
      <div className="flex min-w-0 flex-[1_1_440px] flex-col gap-2">
        <AButton variant="primary" onClick={startBlank} className="self-start">
          + Nueva publicación
        </AButton>
        {events.length === 0 && <span className="py-6 text-sm text-panel-muted">Todavía no hay publicaciones.</span>}
        {events.map((e) => {
          const st = statusOf(e, today);
          return (
            <button
              key={e.id}
              type="button"
              onClick={() => pick(e)}
              aria-pressed={sel === e.id}
              className={cx(
                "flex items-center gap-3.5 rounded-md border bg-panel-surface p-3 text-left",
                sel === e.id ? "border-panel-text" : "border-bone/8 hover:border-bone/20",
                st.label === "Vencido" && "opacity-55",
              )}
            >
              <Photo placeholder={e.placeholder} publicId={e.photoPublicId} url={e.photoUrl} alt="" className="h-[54px] w-[72px] flex-none rounded" sizes="72px" />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className={cx(typeTag({ type: e.type }), "px-[7px]! py-0.5! text-[11px]! tracking-[.12em]!")}>{TYPE_LABELS[e.type]}</span>
                  <span className="truncate text-sm font-semibold">{e.title}</span>
                </div>
                <span className="text-[12.5px] text-panel-muted">
                  Publicación {dayMonth(e.publishedAt)} · Vence {dayMonth(e.expiresAt)}
                </span>
              </div>
              <span className={cx("flex-none rounded border px-2 py-[3px] font-mono text-[10px] whitespace-nowrap uppercase", st.cls)}>{st.label}</span>
            </button>
          );
        })}
        <span className="pt-1 text-[12.5px] text-panel-muted">Las publicaciones vencidas dejan de mostrarse en el sitio automáticamente.</span>
      </div>

      <Card className="flex max-w-[560px] flex-[1_1_380px] flex-col gap-3.5 p-[18px] md:sticky md:top-5">
        <span className="font-mono text-[10.5px] text-panel-muted uppercase">{sel ? "Editar publicación" : "Nueva publicación"}</span>
        <PhotoUpload
          value={{ photoPublicId: draft.photoPublicId ?? null, photoUrl: draft.photoUrl ?? null, photoCutout: false }}
          placeholder={draft.placeholder ?? "madera"}
          folder="eventos"
          onChange={(v) => set({ photoPublicId: v.photoPublicId, photoUrl: v.photoUrl })}
          hint="Horizontal (16:10). Se recorta automáticamente."
          previewClass="h-[75px] w-[120px]"
          ratio={[16, 10]}
        />
        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold text-sand">Tipo</span>
          <Segmented<EventType> value={draft.type} onChange={(type) => set({ type })} options={(Object.keys(TYPE_LABELS) as EventType[]).map((k) => [k, TYPE_LABELS[k]] as const)} />
        </div>
        <Field label="Título">
          <input value={draft.title} onChange={(e) => set({ title: e.target.value })} maxLength={90} className={inputCls} />
        </Field>
        <Field label="Descripción">
          <textarea value={draft.description} onChange={(e) => set({ description: e.target.value })} rows={3} maxLength={400} className={cx(inputCls, "h-auto resize-y py-2.5")} />
        </Field>
        <div className="grid grid-cols-2 gap-2.5">
          <Field label="Publicar desde">
            <input type="date" value={draft.publishedAt} onChange={(e) => set({ publishedAt: e.target.value })} className={cx(inputCls, "px-2.5")} />
          </Field>
          <Field label="Vence el">
            <input type="date" value={draft.expiresAt} onChange={(e) => set({ expiresAt: e.target.value })} className={cx(inputCls, "px-2.5")} />
          </Field>
          <Field label="Fecha destacada" hint="Opcional. Si no, se usa el vencimiento.">
            <input type="date" value={draft.eventDate ?? ""} onChange={(e) => set({ eventDate: e.target.value || null })} className={cx(inputCls, "px-2.5")} />
          </Field>
          <Field label="Detalle de fecha" hint="Ej.: Viernes 31 · 21:00">
            <input value={draft.whenLabel ?? ""} onChange={(e) => set({ whenLabel: e.target.value })} maxLength={60} className={inputCls} />
          </Field>
          <Field label="Texto del botón">
            <input value={draft.ctaLabel} onChange={(e) => set({ ctaLabel: e.target.value })} maxLength={40} className={inputCls} />
          </Field>
          <Field label="Lleva a">
            <select value={draft.ctaTarget} onChange={(e) => set({ ctaTarget: e.target.value })} className={cx(inputCls, "px-2")}>
              {targets.map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Fondo mientras no haya foto">
          <select value={draft.placeholder} onChange={(e) => set({ placeholder: e.target.value as Placeholder })} className={cx(inputCls, "px-2")}>
            {PLACEHOLDERS.map((k) => (
              <option key={k} value={k}>
                {PLACEHOLDER_LABELS[k]}
              </option>
            ))}
          </select>
        </Field>
        <details className="text-[13px] text-panel-muted">
          <summary className="cursor-pointer select-none">Vista previa en el sitio</summary>
          <div className="mt-3">
            <EventCard
              preview
              instagram={instagram}
              e={{
                id: sel ?? 0,
                ...draft,
                description: draft.description ?? "",
                ctaLabel: draft.ctaLabel ?? "",
                ctaTarget: draft.ctaTarget ?? "carta",
                eventDate: draft.eventDate ?? null,
                whenLabel: draft.whenLabel || null,
                placeholder: draft.placeholder ?? "madera",
                photoPublicId: draft.photoPublicId ?? null,
                photoUrl: draft.photoUrl ?? null,
              }}
            />
          </div>
        </details>
        <div className="flex items-center justify-between gap-2 pt-1">
          {sel ? (
            <AButton variant="danger" onClick={remove} disabled={saving} className="text-[13px]">
              Eliminar
            </AButton>
          ) : (
            <span />
          )}
          <AButton variant="primary" onClick={save} disabled={saving}>
            {saving ? "Guardando…" : sel ? "Guardar cambios" : "Publicar"}
          </AButton>
        </div>
      </Card>
    </div>
  );
}
