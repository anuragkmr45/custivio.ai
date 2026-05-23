# Release Artifact Structure

Expected bundle:

```text
custivio-<version>.tar.gz
  manifest.json
  checksums.sha256
  frontend/
  api/
  worker/
  docs/
  migrations/
  scripts/
  env-templates/
```

The bundle must not contain `.env`, production secrets, local cookies, database dumps, MinIO objects, node_modules unless explicitly building an offline bundle, or private keys.
