ALTER TABLE "reservations" ADD COLUMN "group_id" text;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "booking_from" date;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "booking_to" date;--> statement-breakpoint
ALTER TABLE "settings" ADD COLUMN "blocked_dates" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
CREATE INDEX "reservations_group_idx" ON "reservations" USING btree ("group_id");