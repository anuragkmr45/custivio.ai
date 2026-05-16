# Sanchay Data Model

## Prisma Models And Enums Found

`Sanchay/prisma/schema.prisma` contains:

- Auth/user: `User`, `Account`, tokens, two-factor models (`Sanchay/prisma/schema.prisma:30`, `Sanchay/prisma/schema.prisma:58`, `Sanchay/prisma/schema.prisma:78`, `Sanchay/prisma/schema.prisma:87`, `Sanchay/prisma/schema.prisma:96`, `Sanchay/prisma/schema.prisma:105`).
- Core inventory: `InventoryItem` and `Category` enum (`Sanchay/prisma/schema.prisma:11`, `Sanchay/prisma/schema.prisma:118`).
- Issuance and maintenance: `IssuanceRequest`, `MaintenanceRequest`, status enums (`Sanchay/prisma/schema.prisma:165`, `Sanchay/prisma/schema.prisma:189`, `Sanchay/prisma/schema.prisma:195`, `Sanchay/prisma/schema.prisma:213`).
- Hardware subtypes: communication devices, computers/IT, networking, surveillance, vehicles, protective gear, firearms, forensic, medical, office supplies (`Sanchay/prisma/schema.prisma:221`, `Sanchay/prisma/schema.prisma:231`, `Sanchay/prisma/schema.prisma:242`, `Sanchay/prisma/schema.prisma:252`, `Sanchay/prisma/schema.prisma:262`, `Sanchay/prisma/schema.prisma:274`, `Sanchay/prisma/schema.prisma:284`, `Sanchay/prisma/schema.prisma:295`, `Sanchay/prisma/schema.prisma:305`, `Sanchay/prisma/schema.prisma:315`).
- History/reporting/stock: `ItemLocationHistory`, `ItemAssignmentHistory`, `Stock`, `AuditReport`, `ReportLogs` (`Sanchay/prisma/schema.prisma:342`, `Sanchay/prisma/schema.prisma:356`, `Sanchay/prisma/schema.prisma:399`, `Sanchay/prisma/schema.prisma:408`, `Sanchay/prisma/schema.prisma:466`).

## Extraction Notes

Do not copy Prisma code. Rebuild selected concepts as normalized Drizzle schema modules with tenant isolation, constraints, and audit logs.

