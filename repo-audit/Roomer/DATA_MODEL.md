# Roomer Data Model

## Prisma Models And Enums Found

`Roomer/apps/api/prisma/schema.prisma` contains:

- Enterprise auth/enums: `AuthProvider`, `GlobalRole`, `ResourceRoleType`, account/session/token models (`Roomer/apps/api/prisma/schema.prisma:12`, `Roomer/apps/api/prisma/schema.prisma:25`, `Roomer/apps/api/prisma/schema.prisma:30`, `Roomer/apps/api/prisma/schema.prisma:674`, `Roomer/apps/api/prisma/schema.prisma:685`).
- Organization/location: `Organisation`, `Building`, `BuildingLease`, `LeaseDocument`, `Floor`, `FloorPlan`, zones (`Roomer/apps/api/prisma/schema.prisma:118`, `Roomer/apps/api/prisma/schema.prisma:138`, `Roomer/apps/api/prisma/schema.prisma:153`, `Roomer/apps/api/prisma/schema.prisma:171`, `Roomer/apps/api/prisma/schema.prisma:184`, `Roomer/apps/api/prisma/schema.prisma:202`, `Roomer/apps/api/prisma/schema.prisma:217`, `Roomer/apps/api/prisma/schema.prisma:227`).
- Assets and assignments: `AssetCategory`, `Asset`, `AssetAvailabilityWindow`, `AssetUserAssignment`, `AssetAssignment` (`Roomer/apps/api/prisma/schema.prisma:271`, `Roomer/apps/api/prisma/schema.prisma:289`, `Roomer/apps/api/prisma/schema.prisma:352`, `Roomer/apps/api/prisma/schema.prisma:369`, `Roomer/apps/api/prisma/schema.prisma:384`).
- Users/groups/RBAC: `Department`, `User`, `UserGroup`, group access and resource roles (`Roomer/apps/api/prisma/schema.prisma:399`, `Roomer/apps/api/prisma/schema.prisma:416`, `Roomer/apps/api/prisma/schema.prisma:449`, `Roomer/apps/api/prisma/schema.prisma:477`, `Roomer/apps/api/prisma/schema.prisma:497`).
- Workflow/observability: `Booking`, `RecurringBookingRule`, `QueueEntry`, `Notification`, `AuditLog`, `WebhookEndpoint`, `WebhookDelivery` (`Roomer/apps/api/prisma/schema.prisma:529`, `Roomer/apps/api/prisma/schema.prisma:553`, `Roomer/apps/api/prisma/schema.prisma:579`, `Roomer/apps/api/prisma/schema.prisma:601`, `Roomer/apps/api/prisma/schema.prisma:616`, `Roomer/apps/api/prisma/schema.prisma:697`, `Roomer/apps/api/prisma/schema.prisma:711`).

## Extraction Notes

Translate location, assignment, role-scope, import, webhook, and audit concepts into Drizzle. Do not copy Prisma schema.

