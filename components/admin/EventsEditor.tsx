"use client";

import { useState, useTransition } from "react";
import { deleteEvent, saveEvent, type EventInput } from "@/app/admin/actions";
import { addDays, dayMonth } from "@/lib/dates";
import { eventEnded } from "@/lib/events";
import { cx } from "@/lib/format";
import { PLACEHOLDER_LABELS } from "@/lib/placeholders";
import { PLACEHOLDERS, type Category, type EventRow, type EventType, type Placeholder } from "@/lib/schema";
import { Photo } from "../Photo";
import { EventCard } from "../site/EventCard";
import { typeTag, TYPE_LABELS } from "../ui";
import { PhotoUpload } from "./PhotoUpload";
import { AButton, Card, ConfirmModal, DateField, Field, inputCls, Segmented, useRun } from "./ui";

type Draft = Omit<EventInput, "id"> & { id?: number };
type Errors = Partial<Record<"title" | "description" | "publishedAt" | "expiresAt", string>>;

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

function statusOf(e: Pick<EventRow, "publishedAt" | "expiresAt" | "eventDate">, today: string) {
  if (eventEnded(e, today)) return { label: "Terminado", cls: "border-stone-6 text-stone-6", ended: true };
  if (e.publishedAt > today) return { label: "Programado", cls: "border-kraft text-kraft", ended: false };
  return { label: "Publicado", cls: "border-bone/50 text-panel-text", ended: false };
}

export function EventsEditor({ events, cats, today, instagram, startNew }: { events: EventRow[]; cats: Category[]; today: string; instagram: string; startNew: boolean }) {
  const run = useRun();
  const [saving, start] = useTransition();
  // Primero las vigentes y programadas; las terminadas al final.
  const ordered = [...events].sort((a, b) => Number(eventEnded(a, today)) - Number(eventEnded(b, today)));
  const first = ordered.find((e) => !eventEnded(e, today)) ?? ordered[0];
  const [sel, setSel] = useState<number | null>(startNew || !first ? null : first.id);
  const initial = startNew || !first ? blank(today) : fromRow(first);
  const [draft, setDraft] = useState<Draft>(initial);
  // Copia de lo último guardado o cargado: sirve para saber si hay cambios sin guardar.
  const [baseline, setBaseline] = useState(JSON.stringify(initial));
  const [errors, setErrors] = useState<Errors>({});
  const [askDelete, setAskDelete] = useState(false);
  const [discard, setDiscard] = useState<(() => void) | null>(null);
  const dirty = JSON.stringify(draft) !== baseline;

  const set = (p: Partial<Draft>) => setDraft((d) => ({ ...d, ...p }));
  const clear = (k: keyof Errors) => setErrors((e) => (e[k] ? { ...e, [k]: undefined } : e));
  const bad = (k: keyof Errors) => (errors[k] ? "border-sumeria" : "");

  const load = (id: number | null, d: Draft) => {
    setSel(id);
    setDraft(d);
    setBaseline(JSON.stringify(d));
    setErrors({});
  };
  // Cambiar de publicación con cambios sin guardar pide confirmación.
  const guard = (go: () => void) => (dirty ? setDiscard(() => go) : go());
  const pick = (e: EventRow) => guard(() => load(e.id, fromRow(e)));
  const startBlank = () => guard(() => load(null, blank(today)));

  const save = () => {
    const next: Errors = {};
    if (!draft.title.trim()) next.title = "Poné un título.";
    if (!draft.description.trim()) next.description = "Escribí una descripción.";
    if (!draft.publishedAt) next.publishedAt = "Elegí desde cuándo se publica.";
    if (!draft.expiresAt) next.expiresAt = "Elegí cuándo vence.";
    else if (draft.publishedAt && draft.expiresAt < draft.publishedAt) next.expiresAt = "Tiene que ser el mismo día o después de la publicación.";
    setErrors(next);
    const firstBad = (["title", "description", "publishedAt", "expiresAt"] as const).find((k) => next[k]);
    if (firstBad) {
      document.getElementById(`event-${firstBad}`)?.focus();
      return;
    }
    start(async () => {
      const r = await run(saveEvent({ ...draft, id: sel ?? undefined, whenLabel: draft.whenLabel || null }), sel ? "Publicación guardada." : "Publicación creada.");
      if (r?.ok) {
        if (r.id) setSel(r.id);
        setBaseline(JSON.stringify(draft));
      }
    });
  };
  const remove = () => {
    if (!sel) return;
    setAskDelete(false);
    start(async () => {
      const r = await run(deleteEvent(sel), "Publicación eliminada.");
      if (r?.ok) load(null, blank(today));
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
        {ordered.map((e) => {
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
                st.ended && "opacity-55",
              )}
            >
              <Photo placeholder={e.placeholder} publicId={e.photoPublicId} url={e.photoUrl} alt="" className="h-13.5 w-18 flex-none rounded" sizes="72px" />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className={cx(typeTag({ type: e.type }), "px-1.75! py-0.5! text-[11px]! tracking-[.12em]!")}>{TYPE_LABELS[e.type]}</span>
                  <span className="truncate text-sm font-semibold">{e.title}</span>
                </div>
                <span className="text-[12.5px] text-panel-muted">
                  Publicación {dayMonth(e.publishedAt)} · Vence {dayMonth(e.expiresAt)}
                  {e.eventDate && ` · Fecha ${dayMonth(e.eventDate)}`}
                </span>
              </div>
              <span className={cx("flex-none rounded border px-2 py-0.75 font-mono text-[10px] whitespace-nowrap uppercase", st.cls)}>{st.label}</span>
            </button>
          );
        })}
        <span className="pt-1 text-[12.5px] text-panel-muted">Las publicaciones terminadas (vencidas, o con la fecha del evento ya pasada) dejan de mostrarse en el sitio automáticamente.</span>
      </div>

      <Card className="flex max-w-140 flex-[1_1_380px] flex-col gap-3.5 p-4.5 md:sticky md:top-5">
        <span className="flex items-center justify-between font-mono text-[10.5px] text-panel-muted uppercase">
          {sel ? "Editar publicación" : "Nueva publicación"}
          {dirty && <span className="text-kraft">Cambios sin guardar</span>}
        </span>
        <PhotoUpload
          value={{ photoPublicId: draft.photoPublicId ?? null, photoUrl: draft.photoUrl ?? null, photoCutout: false }}
          placeholder={draft.placeholder ?? "madera"}
          folder="eventos"
          onChange={(v) => set({ photoPublicId: v.photoPublicId, photoUrl: v.photoUrl })}
          hint="Horizontal (16:10). Se recorta automáticamente."
          previewClass="h-18.75 w-30"
          ratio={[16, 10]}
        />
        <div className="flex flex-col gap-1.5">
          <span className="text-[13px] font-semibold text-sand">Tipo</span>
          <Segmented<EventType> value={draft.type} onChange={(type) => set({ type })} options={(Object.keys(TYPE_LABELS) as EventType[]).map((k) => [k, TYPE_LABELS[k]] as const)} />
        </div>
        <Field label="Título" error={errors.title}>
          <input
            id="event-title"
            value={draft.title}
            onChange={(e) => (set({ title: e.target.value }), clear("title"))}
            maxLength={90}
            aria-invalid={!!errors.title}
            className={cx(inputCls, bad("title"))}
          />
        </Field>
        <Field label="Descripción" error={errors.description}>
          <textarea
            id="event-description"
            value={draft.description}
            onChange={(e) => (set({ description: e.target.value }), clear("description"))}
            rows={3}
            maxLength={400}
            aria-invalid={!!errors.description}
            className={cx(inputCls, "h-auto resize-y py-2.5", bad("description"))}
          />
        </Field>
        <div className="grid grid-cols-2 gap-2.5">
          <Field label="Publicar desde" error={errors.publishedAt}>
            <DateField id="event-publishedAt" label="Publicar desde" value={draft.publishedAt} invalid={!!errors.publishedAt} onChange={(v) => (set({ publishedAt: v }), clear("publishedAt"))} />
          </Field>
          <Field label="Vence el" error={errors.expiresAt}>
            <DateField id="event-expiresAt" label="Vence el" value={draft.expiresAt} invalid={!!errors.expiresAt} onChange={(v) => (set({ expiresAt: v }), clear("expiresAt"))} />
          </Field>
          <Field label="Fecha destacada" hint="Opcional. Si no, se usa el vencimiento. Pasada esa fecha, la publicación termina.">
            <DateField label="Fecha destacada" value={draft.eventDate ?? ""} onChange={(v) => set({ eventDate: v || null })} />
            {draft.eventDate && (
              <button type="button" onClick={() => set({ eventDate: null })} className="self-start text-xs text-panel-muted underline">
                Quitar fecha
              </button>
            )}
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
            <AButton variant="danger" onClick={() => setAskDelete(true)} disabled={saving} className="text-[13px]">
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

      <ConfirmModal
        open={askDelete}
        title="¿Eliminar la publicación?"
        body={
          <>
            Vas a eliminar <strong className="text-panel-text">{draft.title || "esta publicación"}</strong> y no se puede deshacer.
          </>
        }
        confirmLabel="Sí, eliminar"
        busy={saving}
        onClose={() => setAskDelete(false)}
        onConfirm={remove}
      />
      <ConfirmModal
        open={discard !== null}
        title="Tenés cambios sin guardar"
        body="Si seguís, se pierde lo que escribiste en esta publicación."
        confirmLabel="Descartar cambios"
        onClose={() => setDiscard(null)}
        onConfirm={() => {
          const go = discard;
          setDiscard(null);
          go?.();
        }}
      />
    </div>
  );
}
