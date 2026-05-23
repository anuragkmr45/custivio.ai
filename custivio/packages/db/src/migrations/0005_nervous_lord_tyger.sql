CREATE TABLE "audit_campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" varchar(180) NOT NULL,
	"scope" varchar(120) DEFAULT 'all_assets' NOT NULL,
	"status" varchar(40) DEFAULT 'planned' NOT NULL,
	"planned_at" timestamp with time zone,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_findings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"campaign_id" uuid NOT NULL,
	"scan_result_id" uuid,
	"asset_id" uuid,
	"severity" varchar(40) DEFAULT 'medium' NOT NULL,
	"status" varchar(40) DEFAULT 'open' NOT NULL,
	"description" varchar(500) NOT NULL,
	"resolution" varchar(500),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_scan_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"campaign_id" uuid NOT NULL,
	"asset_id" uuid,
	"scan_code" varchar(180) NOT NULL,
	"result_status" varchar(40) NOT NULL,
	"notes" varchar(500),
	"scanned_by_user_id" uuid,
	"scanned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "export_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"export_type" varchar(80) NOT NULL,
	"status" varchar(40) DEFAULT 'completed' NOT NULL,
	"filename" varchar(260) NOT NULL,
	"object_key" varchar(520) NOT NULL,
	"filters" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"idempotency_key" varchar(160),
	"created_by_user_id" uuid,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "import_job_rows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"import_job_id" uuid NOT NULL,
	"row_number" integer NOT NULL,
	"status" varchar(40) NOT NULL,
	"diagnostics" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "import_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"import_type" varchar(80) NOT NULL,
	"status" varchar(40) DEFAULT 'previewed' NOT NULL,
	"original_filename" varchar(260) NOT NULL,
	"total_rows" integer DEFAULT 0 NOT NULL,
	"processed_rows" integer DEFAULT 0 NOT NULL,
	"failed_rows" integer DEFAULT 0 NOT NULL,
	"idempotency_key" varchar(160),
	"locked_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"created_by_user_id" uuid,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_filters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"module" varchar(80) NOT NULL,
	"key" varchar(120) NOT NULL,
	"name" varchar(180) NOT NULL,
	"filters" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_campaigns" ADD CONSTRAINT "audit_campaigns_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_campaigns" ADD CONSTRAINT "audit_campaigns_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_findings" ADD CONSTRAINT "audit_findings_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_findings" ADD CONSTRAINT "audit_findings_campaign_id_audit_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."audit_campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_findings" ADD CONSTRAINT "audit_findings_scan_result_id_audit_scan_results_id_fk" FOREIGN KEY ("scan_result_id") REFERENCES "public"."audit_scan_results"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_findings" ADD CONSTRAINT "audit_findings_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_scan_results" ADD CONSTRAINT "audit_scan_results_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_scan_results" ADD CONSTRAINT "audit_scan_results_campaign_id_audit_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."audit_campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_scan_results" ADD CONSTRAINT "audit_scan_results_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_scan_results" ADD CONSTRAINT "audit_scan_results_scanned_by_user_id_users_id_fk" FOREIGN KEY ("scanned_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "export_jobs" ADD CONSTRAINT "export_jobs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "export_jobs" ADD CONSTRAINT "export_jobs_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_job_rows" ADD CONSTRAINT "import_job_rows_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_job_rows" ADD CONSTRAINT "import_job_rows_import_job_id_import_jobs_id_fk" FOREIGN KEY ("import_job_id") REFERENCES "public"."import_jobs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_jobs" ADD CONSTRAINT "import_jobs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import_jobs" ADD CONSTRAINT "import_jobs_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_filters" ADD CONSTRAINT "saved_filters_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_filters" ADD CONSTRAINT "saved_filters_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_campaigns_tenant_status_idx" ON "audit_campaigns" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "audit_campaigns_tenant_scope_idx" ON "audit_campaigns" USING btree ("tenant_id","scope");--> statement-breakpoint
CREATE INDEX "audit_findings_tenant_campaign_idx" ON "audit_findings" USING btree ("tenant_id","campaign_id");--> statement-breakpoint
CREATE INDEX "audit_findings_tenant_status_idx" ON "audit_findings" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "audit_findings_tenant_severity_idx" ON "audit_findings" USING btree ("tenant_id","severity");--> statement-breakpoint
CREATE INDEX "audit_scan_results_tenant_campaign_idx" ON "audit_scan_results" USING btree ("tenant_id","campaign_id");--> statement-breakpoint
CREATE INDEX "audit_scan_results_tenant_status_idx" ON "audit_scan_results" USING btree ("tenant_id","result_status");--> statement-breakpoint
CREATE UNIQUE INDEX "audit_scan_results_campaign_code_unique" ON "audit_scan_results" USING btree ("campaign_id","scan_code");--> statement-breakpoint
CREATE UNIQUE INDEX "export_jobs_object_key_unique" ON "export_jobs" USING btree ("object_key");--> statement-breakpoint
CREATE UNIQUE INDEX "export_jobs_tenant_idempotency_unique" ON "export_jobs" USING btree ("tenant_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "export_jobs_tenant_type_idx" ON "export_jobs" USING btree ("tenant_id","export_type");--> statement-breakpoint
CREATE UNIQUE INDEX "import_job_rows_job_row_unique" ON "import_job_rows" USING btree ("import_job_id","row_number");--> statement-breakpoint
CREATE INDEX "import_job_rows_tenant_job_idx" ON "import_job_rows" USING btree ("tenant_id","import_job_id");--> statement-breakpoint
CREATE INDEX "import_job_rows_tenant_status_idx" ON "import_job_rows" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE INDEX "import_jobs_tenant_status_idx" ON "import_jobs" USING btree ("tenant_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "import_jobs_tenant_idempotency_unique" ON "import_jobs" USING btree ("tenant_id","idempotency_key");--> statement-breakpoint
CREATE UNIQUE INDEX "saved_filters_tenant_module_key_unique" ON "saved_filters" USING btree ("tenant_id","module","key");--> statement-breakpoint
CREATE INDEX "saved_filters_tenant_module_idx" ON "saved_filters" USING btree ("tenant_id","module");