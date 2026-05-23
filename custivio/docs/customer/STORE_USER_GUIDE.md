# Custivio Store User Guide

## Purpose

Store and inventory users manage stock items, stock movements, custody checkouts, and check-ins.

## Stock Workflow

1. Open **Stock**.
2. Create stock units and stock items when needed.
3. Use **Movement** to receive, issue, transfer, or adjust stock.
4. Enter quantity, location keys, and a clear reference.
5. Check balances and low-stock indicators after each movement.

## Custody Workflow

1. Open **Custody**.
2. Use **Check out asset** to assign an available asset to a user.
3. Use **Handover** to explicitly select a new custodian.
4. Use **Check in** when the asset returns.
5. Use **Request transfer** when manager approval is needed.

## Good Practice

- Do not double-click submit buttons; Custivio disables pending buttons and uses idempotency on retry-sensitive backend flows.
- Add useful references for stock movements.
- Verify the asset tag before custody changes.
