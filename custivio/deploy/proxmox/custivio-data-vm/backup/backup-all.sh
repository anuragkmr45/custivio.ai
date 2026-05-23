#!/usr/bin/env bash
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
bash "$DIR/backup-postgres.sh"
bash "$DIR/backup-minio.sh"
bash "$DIR/backup-valkey.sh"
