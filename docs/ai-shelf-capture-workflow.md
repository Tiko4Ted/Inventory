# AI shelf capture workflow

1. Capture an image on the device.
2. Upload the image directly to private object storage.
3. Create a `shelf_scans` record with status `processing`.
4. Pass the image URL to the AI Gateway through the AI SDK.
5. Require structured output containing product label, quantity, confidence, and optional batch or
   expiry observations.
6. Save output as `shelf_scan_lines` with status `pending`.
7. Present every line to a staff member for review.
8. Convert accepted lines into inventory movements.
9. Mark the scan as `reviewed` and record the reviewer.

The AI prompt must state that it is estimating visible shelf stock and must not invent unreadable
values. Low-confidence lines should be highlighted for manual confirmation.
