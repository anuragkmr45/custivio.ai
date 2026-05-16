# FinOpenPOS Risks

- PGLite is the default DB runtime (`FinOpenPOS/README.md:87`, `FinOpenPOS/README.md:458`), while the target must be PostgreSQL-only.
- Production Dockerfile embeds PostgreSQL into the app image (`FinOpenPOS/Dockerfile.production:2`, `FinOpenPOS/Dockerfile.production:42`), while the target should run services through Docker Compose.
- Demo credentials are documented (`FinOpenPOS/README.md:119`); seed/demo behavior must not be used in production defaults.
- No MinIO or Valkey evidence found.
- Domain model is POS/fiscal, not IT asset lifecycle.
- Fiscal module was ported from a PHP library (`FinOpenPOS/README.md:175`); any direct reuse needs separate license/provenance review.

