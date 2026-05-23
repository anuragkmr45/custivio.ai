CREATE TABLE "asset_custody_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"asset_id" uuid NOT NULL,
	"assigned_to_user_id" uuid NOT NULL,
	"assigned_by_user_id" uuid,
	"checked_out_at" timestamp with time zone DEFAULT now() NOT NULL,
	"due_at" timestamp with time zone,
	"checked_in_at" timestamp with time zone,
	"status" varchar(40) DEFAULT 'active' NOT NULL,
	"notes" varchar(500),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "asset_transfer_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"asset_id" uuid NOT NULL,
	"from_custodian_user_id" uuid,
	"to_custodian_user_id" uuid NOT NULL,
	"requested_by_user_id" uuid,
	"decided_by_user_id" uuid,
	"status" varchar(40) DEFAULT 'pending' NOT NULL,
	"reason" varchar(500),
	"decision_note" varchar(500),
	"decided_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "asset_maintenance_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"ticket_id" uuid NOT NULL,
	"actor_user_id" uuid,
	"event_type" varchar(100) NOT NULL,
	"note" varchar(500),
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "asset_maintenance_tickets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"asset_id" uuid NOT NULL,
	"opened_by_user_id" uuid,
	"assigned_to_user_id" uuid,
	"status" varchar(40) DEFAULT 'open' NOT NULL,
	"priority" varchar(40) DEFAULT 'medium' NOT NULL,
	"issue_summary" varchar(500) NOT NULL,
	"resolution_summary" varchar(500),
	"opened_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone,
	"downtime_minutes" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "asset_warranties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"asset_id" uuid NOT NULL,
	"provider" varchar(180) NOT NULL,
	"contract_number" varchar(160),
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"status" varchar(40) DEFAULT 'active' NOT NULL,
	"notes" varchar(500),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "asset_custody_assignments" ADD CONSTRAINT "asset_custody_assignments_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_custody_assignments" ADD CONSTRAINT "asset_custody_assignments_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_custody_assignments" ADD CONSTRAINT "asset_custody_assignments_assigned_to_user_id_users_id_fk" FOREIGN KEY ("assigned_to_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_custody_assignments" ADD CONSTRAINT "asset_custody_assignments_assigned_by_user_id_users_id_fk" FOREIGN KEY ("assigned_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_transfer_requests" ADD CONSTRAINT "asset_transfer_requests_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_transfer_requests" ADD CONSTRAINT "asset_transfer_requests_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_transfer_requests" ADD CONSTRAINT "asset_transfer_requests_from_custodian_user_id_users_id_fk" FOREIGN KEY ("from_custodian_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_transfer_requests" ADD CONSTRAINT "asset_transfer_requests_to_custodian_user_id_users_id_fk" FOREIGN KEY ("to_custodian_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_transfer_requests" ADD CONSTRAINT "asset_transfer_requests_requested_by_user_id_users_id_fk" FOREIGN KEY ("requested_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_transfer_requests" ADD CONSTRAINT "asset_transfer_requests_decided_by_user_id_users_id_fk" FOREIGN KEY ("decided_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_maintenance_events" ADD CONSTRAINT "asset_maintenance_events_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_maintenance_events" ADD CONSTRAINT "asset_maintenance_events_ticket_id_asset_maintenance_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."asset_maintenance_tickets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_maintenance_events" ADD CONSTRAINT "asset_maintenance_events_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_maintenance_tickets" ADD CONSTRAINT "asset_maintenance_tickets_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_maintenance_tickets" ADD CONSTRAINT "asset_maintenance_tickets_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_maintenance_tickets" ADD CONSTRAINT "asset_maintenance_tickets_opened_by_user_id_users_id_fk" FOREIGN KEY ("opened_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_maintenance_tickets" ADD CONSTRAINT "asset_maintenance_tickets_assigned_to_user_id_users_id_fk" FOREIGN KEY ("assigned_to_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_warranties" ADD CONSTRAINT "asset_warranties_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_warranties" ADD CONSTRAINT "asset_warranties_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "asset_custody_tenant_asset_idx" ON "asset_custody_assignments" USING btree ("tenant_id","asset_id");--> statement-breakpoint
CREATE INDEX "asset_custody_tenant_user_idx" ON "asset_custody_assignments" USING btree ("tenant_id","assigned_to_user_id");--> statement-breakpoint
CREATE INDEX "asset_custody_tenant_status_idx" ON "asset_custody_assignments" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "asset_transfers_tenant_asset_idx" ON "asset_transfer_requests" USING btree ("tenant_id","asset_id");--> statement-breakpoint
CREATE INDEX "asset_transfers_tenant_status_idx" ON "asset_transfer_requests" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "asset_transfers_tenant_to_user_idx" ON "asset_transfer_requests" USING btree ("tenant_id","to_custodian_user_id");--> statement-breakpoint
CREATE INDEX "asset_maintenance_events_tenant_ticket_idx" ON "asset_maintenance_events" USING btree ("tenant_id","ticket_id");--> statement-breakpoint
CREATE INDEX "asset_maintenance_events_tenant_type_idx" ON "asset_maintenance_events" USING btree ("tenant_id","event_type");--> statement-breakpoint
CREATE INDEX "asset_maintenance_tickets_tenant_asset_idx" ON "asset_maintenance_tickets" USING btree ("tenant_id","asset_id");--> statement-breakpoint
CREATE INDEX "asset_maintenance_tickets_tenant_status_idx" ON "asset_maintenance_tickets" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "asset_maintenance_tickets_tenant_priority_idx" ON "asset_maintenance_tickets" USING btree ("tenant_id","priority");--> statement-breakpoint
CREATE INDEX "asset_warranties_tenant_asset_idx" ON "asset_warranties" USING btree ("tenant_id","asset_id");--> statement-breakpoint
CREATE INDEX "asset_warranties_tenant_status_idx" ON "asset_warranties" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "asset_warranties_tenant_ends_at_idx" ON "asset_warranties" USING btree ("tenant_id","ends_at");