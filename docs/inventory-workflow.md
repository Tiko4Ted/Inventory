# Inventory workflow

## Item lifecycle

`draft -> active -> archived`

Archived products remain available in historical stock movements but are hidden from the default
active inventory list.

## Stock movement rules

Every quantity change is a movement. Supported movement types are:

- `received`
- `dispensed`
- `damaged`
- `expired`
- `adjustment`

Positive and negative movement values are allowed only when the movement type and reason are clear.
The API should reject a movement that would make current quantity negative.

## AI review rules

- AI output is always pending first.
- Each line has a confidence value and optional raw label.
- Product matching must be confirmed by a user.
- Rejected or edited lines remain in the scan audit record.
- No image analysis result can write to inventory without a review action.
