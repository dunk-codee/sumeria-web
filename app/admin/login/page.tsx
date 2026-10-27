import type { Metadata } from "next";
import Image from "next/image";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Panel · Ingresar", robots: { index: false } };

export default function LoginPage() {
  return (
    <div className="grid min-h-dvh place-items-center bg-ink bg-[repeating-linear-gradient(135deg,rgba(255,255,255,.015)_0_1px,transparent_1px_10px)] p-6 text-panel-text">
      <div className="flex w-full max-w-[380px] flex-col gap-[22px]">
        <div className="flex flex-col items-center gap-3">
          <Image src="/brand/sumeria-logo.png" alt="Sumeria Sushi" width={1187} height={154} priority className="h-auto w-[200px]" />
          <span className="font-mono text-[11px] tracking-[.2em] text-panel-muted uppercase">Panel del local</span>
        </div>
        <LoginForm />
        <span className="text-center font-mono text-[10.5px] text-stone-6 uppercase">Desarrollado por DunkCode</span>
      </div>
    </div>
  );
}
