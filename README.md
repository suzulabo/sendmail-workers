# sendmail-worker

Cloudflare Worker that exposes a simple `/sendmail` JSON API to send an email via Email Routing. Built with TypeScript, pnpm, Vitest, and ESLint (`@antfu/eslint-config`).

## Endpoints

- `POST /sendmail`
  - Headers: `Authorization: Bearer <SENDMAIL_API_KEY>`, `Content-Type: application/json`
  - Body: `{ "subject": "Hello", "body": "World" }`
  - Sends a plain-text email from `FROM_ADDRESS` to `TO_ADDRESS` using the `EMAIL` binding (Email Routing).

Non-matching paths return `404`. Non-POST requests return `405`. Invalid auth returns `401`. Invalid payload returns `400`.

## Quickstart

```sh
pnpm install
pnpm dev
```

Local test request (after `pnpm dev`):

```sh
curl -X POST http://localhost:8787/sendmail \
  -H "Authorization: Bearer <SENDMAIL_API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"subject":"Hello","body":"Body"}'
```

## Configuration

- Secrets:
  - `SENDMAIL_API_KEY`: Bearer token required by the API.
  - `FROM_ADDRESS`: Sender address (must be allowed by Email Routing).
  - `TO_ADDRESS`: Recipient address (must be allowed by Email Routing).
- Bindings:
  - `EMAIL`: Email send binding defined in `wrangler.jsonc`.

For local dev, use `.dev.vars`:

```txt
SENDMAIL_API_KEY=dev-secret
FROM_ADDRESS=no-reply@example.com
TO_ADDRESS=recipient@example.com
```

## Scripts

- `pnpm dev` — wrangler dev
- `pnpm deploy` — wrangler deploy
- `pnpm lint` — eslint
- `pnpm test` — vitest run
- `pnpm check` — tsc --noEmit

## Development Notes

- Routing is a simple map in `src/index.ts`; add new endpoints by extending the `routes` object.
- Emails are constructed with `mimetext` to match Cloudflare’s Email Workers example and sent via `EmailMessage`.
- Compatibility flags: `compatibility_date` and `nodejs_compat_v2` are set in `wrangler.jsonc`.
