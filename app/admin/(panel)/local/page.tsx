import type { Metadata } from "next";
import { SettingsEditor } from "@/components/admin/SettingsEditor";
import { adminSettings } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Datos del local" };

export default async function LocalAdmin() {
  await requireAdmin();
  const s = await adminSettings();
  return <SettingsEditor initial={{ address: s.address, city: s.city, whatsapp: s.whatsapp, instagram: s.instagram, hours: s.hours, zones: s.zones }} />;
}
