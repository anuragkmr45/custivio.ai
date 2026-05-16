# chittyassets Risks

- Neon serverless is core (`chittyassets/server/db.ts:1`, `chittyassets/server/db.ts:2`, `chittyassets/package.json:48`), rejected for final production.
- README targets Replit/Cloudflare/Vercel (`chittyassets/README.md:13`, `chittyassets/README.md:138`, `chittyassets/README.md:144`, `chittyassets/README.md:151`), not air-gapped on-prem by default.
- Auth depends on external identity/cloud integrations (`chittyassets/server/chittyAuth.ts:7`).
- Blockchain and AI concepts are outside target core operations (`chittyassets/README.md:3`, `chittyassets/shared/schema.ts:195`).
- Package says MIT but no license file was found; retain notice and verify before direct copying (`chittyassets/package.json:6`).

