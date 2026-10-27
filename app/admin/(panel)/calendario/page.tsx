import type { Metadata } from "next";
import { BookingCalendar } from "@/components/admin/BookingCalendar";
import { adminSettings } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/auth";
import { todayISO } from "@/lib/dates";

export const metadata: Metadata = { title: "Calendario de reservas" };

export default async function CalendarioAdmin() {
  await requireAdmin();
  const s = await adminSettings();
  return <BookingCalendar initial={{ from: s.bookingFrom, to: s.bookingTo, blocked: s.blockedDates }} today={todayISO()} />;
}
