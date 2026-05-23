ALTER TABLE "asset_attachments" ADD COLUMN "content_length" integer;--> statement-breakpoint
ALTER TABLE "asset_attachments" ADD COLUMN "checksum_sha256" varchar(64);--> statement-breakpoint
ALTER TABLE "export_jobs" ADD COLUMN "content_length" integer;--> statement-breakpoint
ALTER TABLE "export_jobs" ADD COLUMN "checksum_sha256" varchar(64);