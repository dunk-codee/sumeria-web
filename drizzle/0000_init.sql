CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"visible" boolean DEFAULT true NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "delivery_zones" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"price" integer NOT NULL,
	"position" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"cta_label" text DEFAULT '' NOT NULL,
	"cta_target" text DEFAULT 'carta' NOT NULL,
	"event_date" date,
	"when_label" text,
	"published_at" date NOT NULL,
	"expires_at" date NOT NULL,
	"placeholder" text DEFAULT 'madera' NOT NULL,
	"photo_public_id" text,
	"photo_url" text
);
--> statement-breakpoint
CREATE TABLE "fixtures" (
	"id" serial PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"x" real NOT NULL,
	"y" real NOT NULL,
	"w" real NOT NULL,
	"h" real NOT NULL,
	"label" text
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"category_id" integer NOT NULL,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"pieces" text,
	"price" integer NOT NULL,
	"gluten_free" boolean DEFAULT false NOT NULL,
	"available" boolean DEFAULT true NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"placeholder" text DEFAULT 'madera' NOT NULL,
	"photo_public_id" text,
	"photo_url" text,
	"photo_cutout" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reservations" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"turn" integer NOT NULL,
	"time" text NOT NULL,
	"name" text NOT NULL,
	"phone" text DEFAULT '' NOT NULL,
	"people" integer NOT NULL,
	"table_n" integer NOT NULL,
	"status" text DEFAULT 'pend' NOT NULL,
	"source" text DEFAULT 'web' NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"arrived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"whatsapp" text NOT NULL,
	"address" text NOT NULL,
	"city" text NOT NULL,
	"instagram" text NOT NULL,
	"hours" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tables" (
	"n" integer PRIMARY KEY NOT NULL,
	"capacity" integer NOT NULL,
	"shape" text NOT NULL,
	"x" real NOT NULL,
	"y" real NOT NULL,
	"w" real NOT NULL,
	"h" real NOT NULL,
	"location" text DEFAULT 'Salón' NOT NULL
);
--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "products_category_idx" ON "products" USING btree ("category_id");--> statement-breakpoint
CREATE UNIQUE INDEX "reservations_slot_unique" ON "reservations" USING btree ("date","turn","table_n") WHERE "reservations"."status" <> 'canc';--> statement-breakpoint
CREATE INDEX "reservations_date_idx" ON "reservations" USING btree ("date","turn");