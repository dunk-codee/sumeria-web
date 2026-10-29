"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  changeReservationTable,
  createManualReservation,
  markArrived,
  setReservationStatus,
  setWalkin,
} from "@/app/admin/actions";
import type { AdminReservation } from "@/lib/admin-data";
import { longDate, todayISO } from "@/lib/dates";
import { cx, tablesLabel } from "@/lib/format";
import { reservationConfirmMessage, toWaNumber, waLink } from "@/lib/whatsapp";
import { XMark } from "../XMark";
import { AButton, abtn, Field, inputCls, Segmented, useRun } from "./ui";

export const SOURCE_LABEL = { web: "Sitio web", tel: "Teléfono", wa: "WhatsApp", walkin: "Sin reserva" } as const;

/** Acciones sobre una reserva. Confirmar abre WhatsApp con el mensaje y pasa a Confirmada. */
export function useResActions(address: string) {
  const run = useRun();
  const [pending, start] = useTransition();
  const act = (fn: () => Promise<unknown>) => start(async () => void (await fn()));
  return {
    pending,
    confirm: (r: AdminReservation) => {
      // Se abre antes del await para que el navegador no lo bloquee como pop-up.
      if (r.phone && r.phone !== "—") {
        const text = reservationConfirmMessage({ name: r.name, date: r.date, time: r.time, people: r.people, tables: r.tables, address });
        window.open(waLink(toWaNumber(r.phone), text), "_blank", "noopener");
      }
      act(() => run(setReservationStatus(r.id, "conf"), `Reserva de ${r.name} confirmada. Se abrió WhatsApp con el mensaje.`));
    },
    reject: (r: AdminReservation) => act(() => run(setReservationStatus(r.id, "canc"), `Reserva de ${r.name} rechazada. La mesa vuelve a estar libre.`)),
    cancel: (r: AdminReservation) => act(() => run(setReservationStatus(r.id, "canc"), `Reserva de ${r.name} cancelada.`)),
    restore: (r: AdminReservation) => act(() => run(setReservationStatus(r.id, "pend"), `Reserva de ${r.name} restaurada como pendiente.`)),
    seat: (r: AdminReservation) => act(() => run(markArrived(r.id), `${r.name} llegó. ${tablesLabel(r.tables)} ocupada${r.tables.length > 1 ? "s" : ""}.`)),
    move: (r: AdminReservation, n: number) => act(() => run(changeReservationTable(r.id, n), `${r.name} pasó a la mesa ${n}.`)),
    walkin: (date: string, n: number, on: boolean) =>
      act(() => run(setWalkin(date, n, on), on ? `Mesa ${n} marcada como ocupada.` : `Mesa ${n} liberada.`)),
  };
}

type FreeTable = { n: number; capacity: number };

export function NewReservationDrawer({
  open,
  onClose,
  days,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  days: string[];
  initial: { date: string; tableN?: number };
}) {
  const run = useRun();
  const router = useRouter();
  const [source, setSource] = useState<"tel" | "wa">("tel");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [date, setDate] = useState(initial.date);
  const [people, setPeople] = useState("2");
  const [tableN, setTableN] = useState<number | "">(initial.tableN ?? "");
  const [note, setNote] = useState("");
  const [tried, setTried] = useState(false);
  const [free, setFree] = useState<FreeTable[] | null>(null);
  const [saving, start] = useTransition();

  useEffect(() => {
    if (!open) return;
    /* eslint-disable react-hooks/set-state-in-effect -- reinicia el formulario al abrir */
    setDate(initial.date);
    setTableN(initial.tableN ?? "");
    setName("");
    setPhone("");
    setNote("");
    setPeople("2");
    setTried(false);
    /* eslint-enable react-hooks/set-state-in-effect */
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const ctrl = new AbortController();
    fetch(`/api/admin/availability?date=${date}`, { signal: ctrl.signal, cache: "no-store" })
      .then((r) => r.json())
      .then((d: { tables: (FreeTable & { status: string })[] }) => setFree(d.tables.filter((t) => t.status === "free")))
      .catch(() => {});
    return () => ctrl.abort();
  }, [open, date]);

  if (!open) return null;
  const err = tried && (!name.trim() || !tableN);

  const save = () => {
    if (!name.trim() || !tableN) {
      setTried(true);
      return;
    }
    start(async () => {
      const r = await run(
        createManualReservation({ source, name, phone, date, people: Number(people) || 2, tableN: Number(tableN), note }),
        `Reserva de ${name.trim()} cargada en la mesa ${tableN}.`,
      );
      if (r?.ok) {
        onClose();
        router.push(`/admin/reservas?date=${date}`);
      }
    });
  };

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-60 bg-black/60" aria-hidden />
      <aside role="dialog" aria-modal="true" aria-labelledby="nr-title" className="fixed top-0 right-0 bottom-0 z-61 flex w-full max-w-105 flex-col border-l border-bone/10 bg-panel-surface">
        <div className="flex items-center justify-between border-b border-bone/8 px-5 py-4.5">
          <h2 id="nr-title" className="m-0 font-display text-2xl font-semibold uppercase">
            Cargar reserva
          </h2>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="flex h-9 w-9 items-center justify-center">
            <XMark size={14} stroke={3.2} className="text-panel-text" />
          </button>
        </div>
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-5 py-4.5">
          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] font-semibold text-sand">¿Por dónde llegó?</span>
            <Segmented value={source} onChange={setSource} options={[["tel", "Teléfono"], ["wa", "WhatsApp"]] as const} />
          </div>
          <Field label="Nombre">
            <input value={name} onChange={(e) => setName(e.target.value)} className={cx(inputCls, tried && !name.trim() && "border-sumeria-light")} />
          </Field>
          <Field label="Teléfono">
            <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" className={inputCls} />
          </Field>
          <div className="grid grid-cols-2 gap-2.5">
            <Field label="Día">
              <select value={date} onChange={(e) => (setDate(e.target.value), setTableN(""))} className={cx(inputCls, "px-2")}>
                {days.map((d, i) => (
                  <option key={d} value={d}>
                    {(i === 0 && d === todayISO() ? "Hoy · " : "") + longDate(d)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Personas">
              <input value={people} onChange={(e) => setPeople(e.target.value.replace(/\D/g, ""))} inputMode="numeric" className={inputCls} />
            </Field>
            <Field label="Mesa">
              <select
                value={tableN}
                onChange={(e) => setTableN(e.target.value ? Number(e.target.value) : "")}
                className={cx(inputCls, "px-2", tried && !tableN && "border-sumeria-light")}
              >
                <option value="">{free == null ? "Cargando…" : "Elegir mesa"}</option>
                {(free ?? []).map((t) => (
                  <option key={t.n} value={t.n}>
                    Mesa {t.n} · {t.capacity} lugares
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Nota">
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className={cx(inputCls, "h-auto resize-y py-2.5")} />
          </Field>
          {err && <span className="text-[13px] text-sumeria-light">Completá nombre y elegí una mesa libre.</span>}
        </div>
        <div className="flex flex-col gap-2 border-t border-bone/8 px-5 py-4">
          <button type="button" onClick={save} disabled={saving} className={cx(abtn({ variant: "primary" }), "h-11")}>
            {saving ? "Guardando…" : "Guardar como confirmada"}
          </button>
          <span className="text-center text-xs text-panel-muted">La mesa queda bloqueada en el sitio para ese día.</span>
        </div>
      </aside>
    </>
  );
}

export function NewReservationButton({ days, date, variant = "primary", label = "+ Cargar reserva" }: { days: string[]; date: string; variant?: "primary" | "outline"; label?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <AButton variant={variant} onClick={() => setOpen(true)}>
        {label}
      </AButton>
      <NewReservationDrawer open={open} onClose={() => setOpen(false)} days={days} initial={{ date }} />
    </>
  );
}
