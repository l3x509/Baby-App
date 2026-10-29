# Nestling Baby Log

A baby tracker for feeds, sleep, diapers, growth, teeth and health, shared live between parents and caregivers. It's one HTML page backed by Supabase.

| File | What it is |
|---|---|
| `index.html` | The whole app |
| `config.js` | Your Supabase keys (the only file you edit) |
| `schema.sql` | Run once in Supabase to create the tables and access rules |
| `README.md` | This setup guide |

## Setup

Plan on about 20 minutes.

---

## 1. Create a Supabase project

1. Go to supabase.com and create a **new project**, for example `nestling`.
   Use a separate project from jemmyop so the two apps' tables never mix.
2. Wait for it to finish setting up.

## 2. Create the tables

1. In the project, open **SQL Editor** and click **New query**.
2. Paste all of `schema.sql` and click **Run**.
3. You should see "Success". It's safe to run again later; it won't delete anything.

This creates:

| Table | What it holds |
|---|---|
| `babies` | Name, birth date, units, teeth chart |
| `baby_members` | Who can see each baby's log: owner, parent or view only |
| `invites` | One-time invite codes (good for 7 days) |
| `entries` | Every feed, sleep, diaper, growth and health record |

Access rules are built in. People only see babies they belong to, and view-only members can't change anything.

## 3. Set up sign-in emails (required for your coparent)

Nestling signs people in with an emailed link instead of a password.
Supabase's built-in email sender only sends to members of your Supabase team, with a very low hourly limit. **Your coparent won't get their link until you connect your own email sender.**

1. Make a free account with an email service that offers SMTP, such as **Brevo** or **Resend**.
   If jemmyop already sends email through one, reuse it.
2. In Supabase, go to **Authentication → Emails → SMTP Settings** and turn on **Custom SMTP**.
3. Enter the host, port, username and password from that service. Set the sender to an address on a domain you've verified with it, like `hello@yourdomain.com`.

## 4. Tell Supabase your website address

1. Go to **Authentication → URL Configuration**.
2. Set **Site URL** to where Nestling will live, for example `https://nestling.yourdomain.com`.
3. Add the same address under **Redirect URLs**.

If the address isn't listed here, sign-in links won't open the app.

## 5. Add your keys to config.js

1. In Supabase, go to **Project Settings → API**.
2. Copy the **Project URL** and the **anon public** key.
3. Open `config.js` in this repo, click the pencil icon, and paste them in:

```js
window.NESTLING_CONFIG = {
  supabaseUrl: "https://abcdefgh.supabase.co",
  supabaseAnonKey: "eyJhbGciOi..."
};
```

The anon key is meant to be public. The access rules from step 2 keep each family's data private.
Never paste the `service_role` key here.

Click **Commit changes**. That's the only edit you make.

## 6. Put it online

Host this repo the same way you host jemmyop. `index.html` and `config.js` must sit side by side.

With GitHub Pages: **Settings → Pages → Deploy from a branch → main → / (root) → Save**. The site appears at `https://l3x509.github.io/Baby-App/` within a minute or two. Use that exact address in step 4.
Open the site, sign in with your email, and add your baby.

## 7. Invite your coparent

1. Go to **Settings → Family** and choose **Log entries**. Choose **Only view** for a grandparent who should only watch.
2. Click **Create invite code** and send the link.
3. Your coparent opens the link, signs in with their email, adds their name and taps **Join**.

Each code works once and expires after 7 days. Make a new one for each person.
To remove someone, use **Remove** next to their name in Family.

## Moving entries from the Claude version

1. In the Claude version, go to **Settings → Backup & restore → Save backup**.
2. On your website, after you've signed in, go to **Settings → Backup & restore → Import backup** and choose that file.

Import skips anything you already have, so running it twice is safe.

## Updating the app later

Your entries live in Supabase, and your keys live in `config.js`.
Replace `index.html` whenever there's a new version. Your log and your keys stay exactly as they are.

## If something goes wrong

| What you see | What to check |
|---|---|
| The sign-in email never arrives | Step 3 (Custom SMTP) and your spam folder |
| The link opens a "page not found" or the wrong site | Step 4 (Site URL and Redirect URLs) |
| "Couldn’t reach the sync service" | The keys in `config.js`, or your internet connection |
| A new entry doesn't show on the other phone right away | Database → Publications → `supabase_realtime` should include `entries`, `babies` and `baby_members`. The app also refreshes when you come back to it. |
| "Invite code was already used" | Make a new code. Each one works for one person. |
