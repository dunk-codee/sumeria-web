import { XLoader } from "@/components/XMark";

export default function PanelLoading() {
  return (
    <div className="p-8">
      <XLoader label="Cargando…" />
    </div>
  );
}
