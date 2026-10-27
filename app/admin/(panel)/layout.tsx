import type { Metadata } from "next";
import { Suspense } from "react";
import { SidebarNav } from "@/components/admin/SidebarNav";
import { ToastProvider } from "@/components/admin/ui";
import { XLoader } from "@/components/XMark";
import { pendingCount } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/auth";

/** El panel depende de la sesión y de datos frescos: puede bloquear al navegar (con loading.tsx). */
export const instant = false;

export const metadata: Metadata = { title: { default: "Panel", template: "%s · Panel Sumeria" }, robots: { index: false } };

async function Sidebar() {
  const session = await requireAdmin();
  const pending = await pendingCount();
  return <SidebarNav email={session.email} pending={pending} />;
}

export default function PanelLayout({ children }: LayoutProps<"/admin">) {
  return (
    <ToastProvider>
      <div className="flex min-h-dvh flex-col bg-panel-bg text-panel-text md:h-dvh md:flex-row md:overflow-hidden">
        <Suspense fallback={<aside className="md:w-[236px] md:flex-none md:border-r md:border-bone/8 md:bg-panel-surface" />}>
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
