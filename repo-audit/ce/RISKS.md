# ce Risks

- License is not plain MIT; O'Saasy restriction blocks certain hosted/SaaS competition uses (`ce/LICENSE.md:1`, `ce/LICENSE.md:8`).
- Uses Redis image/client, not Valkey (`ce/docker-compose.yml:244`, `ce/apps/backend/package.json:72`); target should use Valkey.
- Includes cloud storage providers that are not required for the target (`ce/README.md:13`).
- Uses SuperTokens; target auth decision should be independent (`ce/README.md:32`).
- Product domain is artifact hosting, so data model should not be copied as inventory schema.

