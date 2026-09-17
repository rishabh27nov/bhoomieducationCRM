# Student Chat

The sidebar opens a server-filtered list of allotted students, with WhatsApp history, replies and approved templates. Every list, history, send and mark-read request rechecks the current employee and allocation. A reassignment revokes access on the next request. Employees cannot delete conversations or change WhatsApp settings/automations. Their settings response contains template names only.

Allocation uses `counselorId` when present, otherwise a unique, exact normalized employee name in `counselor`. Partial names and duplicate employee names are denied. A phone shared by students with different counselors is denied for employees; administrators must resolve it. Admin and Institute accounts retain access across students.

## Run and verify

- Start `npm run dev`. Vite serves WhatsApp endpoints and the incoming webhook directly using the same Firebase handlers as Vercel; a separate port 5000 process is not needed for Student Chat. Other legacy API routes still use `npm run server` on port 5000.
- Run `node tests/student-chat.test.js` and `npm run build`.
- Configure WhatsApp credentials/templates in the existing admin setup screen and connect Meta's incoming webhook to `/api/webhooks/whatsapp`.
- Set a strong `CRON_SECRET` in Vercel for the existing automation cron. Unauthenticated automation execution is now rejected; Vercel supplies this secret as its bearer token. Admin requests can also run the endpoint.
- No live student messages were sent during verification. Meta delivery, configured templates and incoming replies still require a live integration test.

## Existing security boundary — production migration required

This implementation validates Google Firebase ID tokens with Firebase Auth and validates legacy username/password requests against the stored account. Client-supplied roles and employee names are not trusted. The universal `emp123` password override was removed.

However, the existing application downloads the entire CRM root and employee passwords into the browser, includes default admin credentials in its frontend, and writes CRM data directly from the browser. No deployed Firebase rules are present in this repository. Consequently these API checks alone do **not** provide tamper-proof isolation: a user who can read another account's credentials, change allocations directly, or read WhatsApp credentials/messages through Firebase can bypass the intended boundary.

Before treating employee isolation as a production security guarantee, migrate legacy login to Firebase Authentication, remove password/default-admin credentials from browser data, put role and allocation writes behind trusted authorization, move WhatsApp secrets out of client-readable Firebase data, and deploy scoped Firebase rules with authenticated server access. The existing root subscription must be replaced with authorized per-user queries before denying root reads; simply adding restrictive rules would break the current CRM. This migration and live Firebase-rule deployment are not included in this change.

Reference for Google token validation: https://firebase.google.com/docs/reference/rest/auth#section-get-account-info
