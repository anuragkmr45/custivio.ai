# Firewall Template

Allow public or user CIDR traffic only to app HTTPS. Allow Grafana only from admin CIDR. Allow PostgreSQL, MinIO, Valkey, Prometheus, Loki, and OTel only on private networks according to `../docs/FIREWALL_RULES.md`. Enable Proxmox firewall and guest firewall rules.
