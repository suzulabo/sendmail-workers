# AGENT GUIDE

English-only notes for developers and automation agents working on this repo.

## Stack

- Cloudflare Worker (TypeScript, `nodejs_compat_v2` flag)
- Email Routing `send_email` binding named `EMAIL`
- MIME creation: `mimetext`
- Tooling: pnpm, Vitest, ESLint (`@antfu/eslint-config`), TypeScript strict

## Project layout

- `src/index.ts`: Worker entrypoint. Routes are dispatched from the `routes` map. `/sendmail` handler:
  - POST-only
  - Auth: `Authorization: Bearer <SENDMAIL_API_KEY>`
  - Body: JSON `{ subject, body }`
  - Builds MIME with `mimetext`, sends via `env.EMAIL.send`.
- `tests/sendmail.test.ts`: Vitest coverage for path, method, auth, payload, and happy-path send.
- `wrangler.jsonc`: Worker config, compatibility flags, and `send_email` binding.

## Local development

```sh
pnpm install
pnpm dev
```

Set `.dev.vars` for local secrets/vars:

```txt
SENDMAIL_API_KEY=dev-secret
FROM_ADDRESS=no-reply@example.com
TO_ADDRESS=recipient@example.com
```

Smoke test while `wrangler dev` is running:

```sh
curl -X POST http://localhost:8787/sendmail \
  -H "Authorization: Bearer <SENDMAIL_API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"subject":"Hello","body":"Body"}'
```

## Quality checks

- `pnpm lint`
- `pnpm test`
- `pnpm check`

## Extending

- Add new HTTP endpoints by extending the `routes` map in `src/index.ts`.
- Keep MIME building via `mimetext` for consistency with Cloudflare Email Workers guidance.
- Ensure new handlers enforce auth if they should remain private.

## Deployment

- Ensure `SENDMAIL_API_KEY`, `FROM_ADDRESS`, `TO_ADDRESS` are set as secrets in the target environment.
- Deploy with `pnpm deploy` (wrangler).***
