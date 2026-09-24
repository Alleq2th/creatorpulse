# Contributing to CreatorPulse

Thanks for taking a look. CreatorPulse is pre-beta, so the priority right now is
stability and correctness over new surface area.

## Getting set up

```bash
npm install
cp .env.example .env    # then fill in what you need
npm start               # http://localhost:3000
```

Every integration is optional. With an empty `.env` the server still boots, and
`GET /api/health` tells you exactly which integrations are configured (booleans
only - it never echoes a secret).

## Before you open a pull request

1. **Run the tests.**

   ```bash
   npm test
   ```

   They run on Node's built-in test runner - no framework to install. CI runs
the same command on every push and pull request.

2. **Boot the app.** A change that passes unit tests but stops the server from
   starting is the most common way to break this project. Confirm `npm start`
   comes up clean and `curl localhost:3000/api/health` returns `ok: true`.

3. **Keep the diff small and focused.** One concern per PR.

## House rules

- **One definition per thing.** If you find the same logic in two files (a
  parser, a CSP block, a constants map), the fix is to delete one copy and
  import the other - not to edit both and hope they stay in step.
- **Never leave an empty `catch`.** A swallowed error is invisible in
  production. Log it with enough context to identify the caller.
- **No secrets in the repo.** Configure them in `render.yaml` / the Render
  dashboard. `.env` is gitignored; `.env.example` holds placeholders only.
- **New env var? Add it to `render.yaml` with `sync: false`** and to
  `.env.example`, and surface it in the `/api/health` `integrations` map. A
  deploy should be self-documenting.
- **Pure helper functions get a test.** Any function without I/O should have a
  case in `test/`.
- **Vanilla JS, no build step.** `public/` is served as-is; if you change
  `core.js` or `app.js`, bump the `?v=` query string in `public/index.html` so
  clients pick up the new file.

## Reporting a bug

Include what you did, what you expected, what happened, and anything from the
server logs. If it involves an integration, note what `/api/health` reports for
it - that answers "is it configured?" before anyone starts debugging.
