"use client";

import { useActionState } from "react";
import { abtn, inputCls } from "@/components/admin/ui";
import { cx } from "@/lib/format";
import { login } from "../actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);
  return (
    <form action={action} className="flex flex-col gap-3.5 rounded-md border border-bone/10 bg-panel-surface p-7">
      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-semibold text-sand">Email</span>
        <input name="email" type="email" required autoComplete="username" className={cx(inputCls, "h-11 text-[15px]")} />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-semibold text-sand">Contraseña</span>
        <input name="password" type="password" required autoComplete="current-password" className={cx(inputCls, "h-11 text-[15px]")} />
      </label>
      {state?.error && (
        <span className="text-[13px] text-sumeria-light" role="alert">
          {state.error}
        </span>
      )}
      <button type="submit" disabled={pending} className={cx(abtn({ variant: "primary" }), "mt-1 h-11.5 text-[15px]")}>
        {pending ? "Ingresando…" : "Ingresar"}
      </button>
      <span className="text-center text-[13px] text-panel-muted">¿Olvidaste la contraseña? Pedila a DunkCode.</span>
    </form>
  );
}
