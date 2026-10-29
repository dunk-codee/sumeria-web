import type { Metadata } from "next";
import { Suspense } from "react";
import { SidebarNav } from "@/components/admin/SidebarNav";
import { ToastProvider } from "@/components/admin/ui";
import { XLoader } from "@/components/XMark";
import { pendingCount } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/auth";
import { dbConfigured } from "@/lib/db";

/** El panel depende de la sesión y de datos frescos: puede bloquear al navegar (con loading.tsx). */
export const instant = false;

export const metadata: Metadata = { title: { default: "Panel", template: "%s · Panel Sumeria" }, robots: { index: false } };

async function Sidebar() {
  const session = await requireAdmin();
  const pending = await pendingCount();
  return <SidebarNav email={session.email} pending={pending} />;
}

/** Modo sin base: el panel no puede funcionar sin DATABASE_URL. */
function NoDatabase() {
  return (
    <div className="grid min-h-dvh place-items-center bg-panel-bg p-6 text-panel-text">
      <div className="flex max-w-115 flex-col gap-3 rounded-md border border-bone/10 bg-panel-surface p-7">
        <span className="font-mono text-[11px] tracking-[.08em] text-panel-muted uppercase">Panel del local</span>
        <h1 className="m-0 font-display text-[28px] leading-[1.05] font-semibold uppercase">Falta conectar la base de datos</h1>
        <p className="m-0 text-sm leading-relaxed text-panel-soft">
          El sitio está publicado con la carta incluida en el proyecto. Para editar productos, recibir reservas online y usar el
          panel hay que configurar <code className="font-mono text-sand">DATABASE_URL</code> (Neon) y volver a desplegar.
        </p>
      </div>
    </div>
  );
}

export default function PanelLayout({ children }: LayoutProps<"/admin">) {
  if (!dbConfigured()) return <NoDatabase />;
  return (
    <ToastProvider>
      <div className="flex min-h-dvh flex-col bg-panel-bg text-panel-text md:h-dvh md:flex-row md:overflow-hidden">
        <Suspense fallback={<aside className="md:w-59 md:flex-none md:border-r md:border-bone/8 md:bg-panel-surface" />}>
          <Sidebar />
        </Suspense>
        <main className="min-w-0 flex-1 md:overflow-y-auto">
          <Suspense
            fallback={
              <div className="p-8">
                <XLoader label="Cargando…" />
              </div>
            }
          >
            {children}
          </Suspense>
        </main>
      </div>
    </ToastProvider>
  );
}
