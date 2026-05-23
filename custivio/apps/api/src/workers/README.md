# API Workers

This folder contains Fastify-adjacent worker loops that consume Valkey queue primitives.

## Runtime

- `job-runner.ts`: shared queue claim, distributed lock, retry, and dead-letter handling.
- `import-worker.ts`: processes `import.process` jobs against existing PostgreSQL import-job rows.
- `export-worker.ts`: verifies generated export objects are present in MinIO.
- `worker.ts`: CLI entrypoint used by `pnpm worker`.

Run one worker tick locally:

```bash
pnpm worker -- --once --queue imports
```

Continuous process supervision is a deployment concern. The worker command exits after one tick in
Phase 3 so tests and on-prem schedulers can run deterministic units of work.
