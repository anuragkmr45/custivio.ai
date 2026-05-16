# Roomer Risks

- Prisma is core (`Roomer/README.md:125`, `Roomer/apps/api/prisma/schema.prisma`), rejected for final project.
- Elastic License 2.0 blocks direct code copying for our purposes without legal approval (`Roomer/LICENSE:1`, `Roomer/LICENSE:12`, `Roomer/LICENSE:22`).
- README suggests managed PostgreSQL for production (`Roomer/README.md:233`), while target must support on-prem Compose operation.
- Uses local filesystem storage for uploads (`Roomer/apps/api/src/lib/storage.ts:21`), not MinIO.
- No tests found in scan.

