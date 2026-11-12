# Security Review

Scope: protected routing, authentication, authorization, admin credentials, and quiz-answer disclosure. `node_modules` and generated `.next` files were excluded.

## Findings and remediation

| Severity | Finding | Remediation |
|---|---|---|
| High | The public admin login page displayed the username `admin` and password `admin123`. | Removed the credentials from the page. Rotate the admin password if these credentials were ever used in a deployed environment. |
| Medium | Public quiz submissions returned question objects containing correct answers, and attempt tokens could be replayed. | Submissions now return only the aggregate score and status. Quiz-attempt tokens are recorded and consumed once. |
| Medium | Admin JWTs remained valid for 24 hours and clearing the browser cookie did not revoke copied tokens. | Admin sessions are stored server-side, checked on protected requests, and revoked on logout. The token lifetime is now one hour. |

## Deployment

Run [`scripts/015-create-auth-sessions.sql`](./scripts/015-create-auth-sessions.sql) against the application database before deploying. It creates the session and one-time quiz-attempt tables required by the updated authentication and quiz routes.

## Verification

- `npm run build` passed.
- TypeScript and ESLint standalone checks could not complete: the project has existing TypeScript errors and the installed typescript-eslint does not support the project's TypeScript 7.0 version.
