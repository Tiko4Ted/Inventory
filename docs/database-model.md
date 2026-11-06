# Database model

## Inventory item

Stores the product identity and fast current-stock read model.

Important fields include name, SKU, unit, category, current quantity, minimum quantity, batch number,
expiry date, and active status.

## Stock movement

Immutable operational event with quantity delta, movement type, reason, actor, source, and timestamp.

## Shelf scan

Stores the private image URL, scan status, raw AI output, and reviewer metadata.

## Shelf scan line

One AI observation. It is deliberately separate from inventory items so that suggestions can be
reviewed without corrupting official stock data.

## Audit log

Append-only record of important changes. Add pharmacy/tenant identifiers before production.
