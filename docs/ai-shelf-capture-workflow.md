# AI shelf capture workflow

1. Capture an image on the device.
2. Resize and compress the image locally.
3. Request an authenticated client upload token.
4. Upload directly to private object storage. Use multipart upload for larger images.
5. If offline, store the local image URI in the device queue and retry when connectivity returns.
6. Create a `shelf_scans` record with status `processing`.
7. If analysis fails, mark the scan as `failed` so it can be retried instead of remaining stuck.
8. Read the private Blob server-side and pass a temporary in-memory image representation to the AI Gateway through the AI SDK.
9. Require structured output containing product label, quantity, confidence, and optional batch or
   expiry observations.
10. Save output as `shelf_scan_lines` with status `pending`.
11. Present every line to a staff member for review and editing.
12. Convert accepted lines into inventory movements.
13. Mark the scan as `reviewed` and record the reviewer.
14. A scheduled cleanup removes reviewed photos after the configured retention period.

The AI prompt must state that it is estimating visible shelf stock and must not invent unreadable
values. Low-confidence lines should be highlighted for manual confirmation.
