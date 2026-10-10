# Cloud Showcase Limitations

- Free tiers can sleep, throttle, or change limits.
- The embedded Render worker pauses whenever the free web service sleeps and can lose an in-flight execution on restart.
- Render-style ephemeral filesystems are not suitable for attachments.
- Supabase Storage is used only through its S3-compatible server-side endpoint and must be validated separately.
- Supabase Free projects can pause after inactivity and do not include production backup guarantees.
- Upstash free capacity and command quotas are appropriate only for a small demo.
- Showcase data should be seeded demo/UAT data only.
- Do not treat the free showcase deployment as the production security baseline.
