# panthora Data Model

## Prisma Models And Enums Found

`panthora/packages/app/prisma/schema.prisma` contains:

- Auth: `Account`, `Session`, `VerificationToken`, `User` (`panthora/packages/app/prisma/schema.prisma:18`, `panthora/packages/app/prisma/schema.prisma:38`, `panthora/packages/app/prisma/schema.prisma:48`, `panthora/packages/app/prisma/schema.prisma:110`).
- Collaboration: `Team`, `TeamInvite`, `UserTeamMembership`, role enum (`panthora/packages/app/prisma/schema.prisma:77`, `panthora/packages/app/prisma/schema.prisma:92`, `panthora/packages/app/prisma/schema.prisma:65`, `panthora/packages/app/prisma/schema.prisma:58`).
- Inventory: `Tag`, `AssetType`, `CustomField`, `Asset`, `FieldValue` (`panthora/packages/app/prisma/schema.prisma:128`, `panthora/packages/app/prisma/schema.prisma:142`, `panthora/packages/app/prisma/schema.prisma:156`, `panthora/packages/app/prisma/schema.prisma:188`, `panthora/packages/app/prisma/schema.prisma:199`).
- Labels/rate limit: `LabelTemplate`, `RateLimit` (`panthora/packages/app/prisma/schema.prisma:223`, `panthora/packages/app/prisma/schema.prisma:239`).

## Extraction Notes

Strong reference for dynamic asset type fields, teams, tags, and labels. Convert concepts into Drizzle JSON/relational design with validation and tenant isolation.

