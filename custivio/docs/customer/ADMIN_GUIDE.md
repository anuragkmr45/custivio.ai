# Custivio Admin Guide

## Purpose

Administrators manage users, roles, assignments, master data, and system status for a tenant.

## Daily Tasks

1. Sign in with your tenant code, email, and password.
2. Use **Users** to invite users, edit profile status, reset temporary passwords, or disable access.
3. Use **Roles** to create roles and select permission keys.
4. Use **Assignments** to assign or remove roles for users.
5. Use **Catalog** and location setup before asking asset teams to register assets.
6. Use **Status** to check API readiness, ops status, and metrics access.

## Safety Rules

- Do not share admin credentials.
- Disable users who no longer need access.
- Use role assignments instead of giving every user admin access.
- Production bootstrap must use operator-provided credentials, not UAT demo accounts.

## Common Checks

| Task             | Where                      |
| ---------------- | -------------------------- |
| Add a user       | Users -> Invite user       |
| Reset a password | Users -> Reset             |
| Disable a user   | Users -> Disable           |
| Create a role    | Roles -> New role          |
| Assign a role    | Assignments -> Assign role |
| Check health     | Status                     |
