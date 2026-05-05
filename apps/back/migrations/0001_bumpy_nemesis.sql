CREATE TABLE "album" (
	"organization_id" text PRIMARY KEY NOT NULL,
	"catalog_id" text DEFAULT 'WC2026' NOT NULL,
	"visibility" text DEFAULT 'public' NOT NULL,
	"description" text,
	"cover_image_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "album_sticker" (
	"album_id" text NOT NULL,
	"sticker_id" text NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "album_sticker_album_id_sticker_id_pk" PRIMARY KEY("album_id","sticker_id")
);
--> statement-breakpoint
CREATE TABLE "sticker" (
	"id" text PRIMARY KEY NOT NULL,
	"catalog_id" text NOT NULL,
	"number" text NOT NULL,
	"player_name" text NOT NULL,
	"team" text NOT NULL,
	"type" text NOT NULL,
	"image_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "album" ADD CONSTRAINT "album_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "album_sticker" ADD CONSTRAINT "album_sticker_album_id_album_organization_id_fk" FOREIGN KEY ("album_id") REFERENCES "public"."album"("organization_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "album_sticker" ADD CONSTRAINT "album_sticker_sticker_id_sticker_id_fk" FOREIGN KEY ("sticker_id") REFERENCES "public"."sticker"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "album_sticker_stickerId_count_idx" ON "album_sticker" USING btree ("sticker_id","count");--> statement-breakpoint
CREATE INDEX "sticker_catalogId_idx" ON "sticker" USING btree ("catalog_id");--> statement-breakpoint
CREATE INDEX "sticker_team_idx" ON "sticker" USING btree ("team");--> statement-breakpoint
CREATE UNIQUE INDEX "sticker_catalog_number_uidx" ON "sticker" USING btree ("catalog_id","number");