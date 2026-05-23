#!/usr/bin/env bash
set -euo pipefail
ORG="${1:-example-org}"
echo "Render step is file-based. Review orgs/$ORG/org.env and targets before restarting Prometheus."
