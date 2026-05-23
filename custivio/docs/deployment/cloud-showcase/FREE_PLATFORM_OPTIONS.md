# Free Platform Options

| Area                    | Recommended           | Notes                                                                                        |
| ----------------------- | --------------------- | -------------------------------------------------------------------------------------------- |
| Frontend                | Netlify Free          | Static/Vite build with `VITE_API_BASE_URL`.                                                  |
| Frontend                | Vercel Hobby          | Suitable for personal demo; check plan limits.                                               |
| Backend/data            | Oracle Always Free VM | Best fit because Docker Compose can run PostgreSQL, Valkey, MinIO, API, and worker together. |
| Backend demo            | Render Free           | May sleep and may not preserve local filesystem. Use only for temporary demos.               |
| Object storage          | MinIO on VM           | Closest to on-prem production behavior.                                                      |
| Optional object storage | Cloudflare R2         | S3-compatible cloud object store; not MinIO, but acceptable for demo if configured.          |
