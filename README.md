# CMU Bulletin ✨

Your one-stop shop for everything happening at Carnegie Mellon. Never miss an event on campus again.

**Live at [cmubulletin.com](https://cmubulletin.com)** 

---

### Features

- **Discover:** A beautiful, filterable grid of event posters.
- **Share:** Upload your own posters in seconds.
- **Save:** Like events to keep them on your personal profile.
- **Admin:** Signed-in admins can edit/delete any poster at `/admin` (demo tooling).

### Tech Stack

- **Frontend:** React & Vite
- **Backend & Hosting:** Firebase (Auth, Firestore, Storage, Hosting)
- **Styling:** Pure CSS

---

### Admin access (`admins/<email>`)

Admins are identified by **lowercase email** document IDs in Firestore collection `admins` (not Firebase UIDs), so membership can follow CMU SSO/OIDC emails later.

**Create an admin (Firebase console):**

1. Open Firestore → create collection `admins` if needed.
2. Add a document whose **Document ID** is the admin’s email in **lowercase** (must match the Auth user’s email; email/password Auth stores lowercase).
3. Fields are optional for now (an empty doc is enough). Example: `{ "role": "admin", "addedAt": "<iso-timestamp>" }`.
4. Ensure that Auth user has a **verified email** — security rules require `email_verified`.

There are **no client writes** to `admins`. Manage membership only in the Firebase console (or Admin SDK).

After signing in, admins see an **Admin** link in the navbar and can open `/admin`.

### Hard delete warning

Admin (and profile) poster deletes are **hard deletes**. Documents are removed from Firestore permanently. Recovery needs project **PITR** or a backup if those are enabled — the app cannot undo a delete.
