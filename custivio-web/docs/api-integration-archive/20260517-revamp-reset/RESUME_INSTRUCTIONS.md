# Resume Instructions

If the Codex session is interrupted:

1. Work from `/Users/anuragkumar/Desktop/inventory-research`.
2. Read:
   - `custivio-web/docs/api-integration/API_INTEGRATION_TASK_BOARD.md`
   - `custivio-web/docs/api-integration/API_INTEGRATION_PROGRESS.md`
   - `custivio-web/docs/api-integration/TEST_RUN_LOG.md`
   - `custivio-web/docs/api-integration/BACKEND_CONTRACT_FINDINGS.md`
3. Continue from the first task not marked `COMPLETE`.
4. Before changing backend behavior, verify the issue against:
   - `custivio/docs/engineering/API_CONTRACT.md`
   - `custivio/apps/api/src/routes/**`
5. Do not delete mock files until the cleanup phase and after tests prove real API replacements.

## Current Resume Point

Frontend/API integration is ready for full product QA at 96% readiness.

No incomplete API integration task remains. The only intentional follow-up is post-QA cleanup:

1. After product QA signoff, quarantine or delete `src/lib/mock/data.ts` and update `CLEANUP_MANIFEST.md`.
2. Rerun `bun run format:check`, `bun run typecheck`, `bun run test`, `bun run lint`, `bun run build`, and `bun run test:e2e`.
3. Keep backend and frontend dev servers configured with matching CORS origins when running local full-system QA.
