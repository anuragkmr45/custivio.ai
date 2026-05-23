# MinIO Policy Notes

- Do not use default credentials.
- Create an application access key scoped to the Custivio bucket.
- Keep the bucket private.
- Do not expose the MinIO API or console publicly.
- Allow API access only from the app LXC private IP and backup/admin IPs.
