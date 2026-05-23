# Custivio App LXC

This folder contains the app LXC deployment assets. The app LXC runs frontend static files, Fastify API, worker, and reverse proxy. It does not run PostgreSQL, MinIO, Valkey, or observability databases.

Install paths follow `docs/DEPLOYMENT_PATH_STRATEGY.md`. API and worker run as non-root user `inventory` through systemd.
