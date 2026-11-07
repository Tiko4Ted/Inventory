# Inventory workflow

## Item lifecycle

`draft -> active -> archived`

Archived products remain available in historical stock movements but are hidden from the default
active inventory list.

## Staff workflow

The Inventory tab provides a bottom-navigation entry point, search, risk filters, and an Actions
button. Staff can add a new product manually or capture a shelf photo for AI-assisted review. Each
product opens to a detail screen with current balance, metadata, movement history, movement entry,
physical reconciliation, edit, and archive actions.

Manual records capture the product name, SKU, category, unit, opening quantity, minimum quantity,
batch number, and optional expiry date. Opening quantity is stored as a `received` movement rather
than as an unexplained direct balance change.

## Stock movement rules

Every quantity change is a movement. Supported movement types are:

- `received`
- `dispensed`
- `damaged`
- `expired`
- `adjustment`

Positive and negative movement values are allowed only when the movement type and reason are clear.
The API should reject a movement that would make current quantity negative.
Stock movement writes update the item balance and insert the movement in one database transaction.
Physical counts create an `adjustment` movement for the difference, so the reason for every
reconciliation remains visible in history.

The mobile list can filter all products, low stock, out of stock, and products expiring within 90
days. The expiry filter is a convenience view; the API expiry endpoint accepts a configurable day
window for reporting and scheduled alerts.

## AI review rules

- AI output is always pending first.
- Each line has a confidence value and optional raw label.
- Product matching must be confirmed by a user.
- Rejected or edited lines remain in the scan audit record.
- No image analysis result can write to inventory without a review action.

## Verification checklist

- Confirm a received movement increases the balance and appears in history.
- Confirm a dispense, damage, or expiry movement decreases the balance.
- Confirm a movement that would make stock negative is rejected and leaves both balance and history
  unchanged.
- Confirm reconciliation creates an adjustment equal to counted quantity minus expected quantity.
- Confirm archive removes an item from the active list but does not remove movement history.
- Confirm AI suggestions remain editable and cannot affect stock until the review is approved.
- Confirm offline shelf photos survive app restart and retry after connectivity returns.
