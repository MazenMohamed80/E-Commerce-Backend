# e-commerce-final-project

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.js
```

This project was created using `bun init` in bun v1.1.38. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.

## Testimonials API

Testimonials are now configured under `/api/v1/testimonial`.

- `GET /api/v1/testimonial` — public approved testimonials.
- `POST /api/v1/testimonial` — authenticated user submits `{ message, rating }`.
- `GET /api/v1/testimonial/my` — authenticated user gets their own testimonials and statuses.
- `GET /api/v1/testimonial/admin` — admin gets all testimonials for moderation.
- `GET /api/v1/testimonial/admin/notifications` — admin gets new testimonial notifications (`isNew=true`) and a count.
- `PATCH /api/v1/testimonial/admin/notifications/read` — admin marks new testimonial notifications as read.
- `PATCH /api/v1/testimonial/admin/:id/status` — admin changes status to `pending`, `approved`, or `declined`.

Only approved testimonials are exposed publicly. No WebSocket/live notification system was added, matching the project requirement for non-live admin notifications.
