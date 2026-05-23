# Custivio Proxmox Load Balancing

Default deployment is a single API instance for constrained on-prem environments. For staging or larger deployments, run two API LXCs behind a reverse proxy.

Requirements:

- Both API instances use the same PostgreSQL, Valkey, MinIO, and `SESSION_SECRET`.
- Health checks target `/api/health/ready`.
- Sticky sessions are not required when DB-backed sessions and shared cookies are configured.
- Keep workers separate from API scaling; start with one worker per queue unless staging proves multi-worker lock safety.
- Reverse proxy forwards `X-Forwarded-For`, `X-Forwarded-Proto`, cookies, and request IDs.
- Configure upload body limits consistently at proxy and API.

Nginx example:

```nginx
upstream custivio_api {
  server 10.20.0.21:3000;
  server 10.20.0.22:3000;
}

server {
  listen 443 ssl http2;
  server_name api.example.internal;

  client_max_body_size 50m;

  location / {
    proxy_pass http://custivio_api;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto https;
    proxy_read_timeout 60s;
  }
}
```

Caddy example:

```caddyfile
api.example.internal {
  reverse_proxy 10.20.0.21:3000 10.20.0.22:3000 {
    health_uri /api/health/ready
    health_interval 10s
  }
}
```
