# Nestling Baby Log

A baby tracker for feeds, sleep, diapers, growth, teeth and health, shared live between parents and caregivers. It's one HTML page backed by Supabase.

| File | What it is |
|---|---|
| `index.html` | The whole app |
| `config.js` | Your Supabase keys (the only file you edit) |
| `schema.sql` | Run once in Supabase to create the tables and access rules |
| `manifest.webmanifest`, `sw.js`, `icons/` | Let you add Nestling to your home screen as an app |
| `privacy.html`, `terms.html`, `delete-account.html` | Privacy policy, terms of use, and the web page for deleting an account (required by Google Play) |
| `migrations/` | Database changes to run in Supabase after the first setup |
| `android-app/` | The Google Play app: the same web app packaged with Capacitor. Build steps in `android-app/README.md` |
| `README.md` | This setup guide |

## Setup

Plan on about 10 minutes.

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

## 3. Turn off email confirmation

Nestling uses email and password, so no email service is needed. Each parent creates their own account.

1. In Supabase, go to **Authentication → Sign In / Providers → Email**.
2. Turn **Confirm email** off and click **Save**.

With this off, Supabase never sends an email. Creating an account signs you in right away.

## 4. Add your keys to config.js

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

## 5. Put it online

Host this repo the same way you host jemmyop. `index.html` and `config.js` must sit side by side.

With GitHub Pages: **Settings → Pages → Deploy from a branch → main → / (root) → Save**. The site appears at `https://l3x509.github.io/Baby-App/` within a minute or two.
Open the site, tap **Sign in**, choose **Create account**, and add your baby.

## 6. Invite your coparent

1. Go to **Settings → Family** and choose **Log entries**. Choose **Only view** for a grandparent who should only watch.
2. Click **Create invite code** and send the link.
3. Your coparent opens the link, chooses **Create account**, adds their name and taps **Join**.

Each code works once and expires after 7 days. Make a new one for each person.
To remove someone, use **Remove** next to their name in Family.

## Add it to your home screen

Nestling installs like an app, opening full screen with its own icon.

- **iPhone (Safari):** tap **⋯** next to the address bar, then **Share**, then **Add to Home Screen**. Keep **Open as Web App** on and tap **Add**. On older iPhones, the Share button is at the bottom of the screen.
- **Android (Chrome):** tap **⋮**, then **Add to Home screen** or **Install app**.

Settings → **Add to home screen** in the app shows the same steps, plus a one-tap **Install app** button where the phone supports it.
Entries always come live from Supabase. If you're offline, the app still opens, but it can't save new entries until you're back online.

## Moving entries from the Claude version

1. In the Claude version, go to **Settings → Backup & restore → Save backup**.
2. On your website, after you've signed in, go to **Settings → Backup & restore → Import backup** and choose that file.

Import skips anything you already have, so running it twice is safe.

## Database updates

If you set up Supabase before October 29, 2026, run `migrations/002-account-deletion.sql` once in the SQL Editor. It adds account deletion (Settings → Account → Delete my account). A new setup gets it from `schema.sql` automatically.

## Android app

The Google Play app is the same web app packaged with Capacitor, following the same setup as Paskle. Build steps, store listing text and graphics are in `android-app/`.

## Updating the app later

Your entries live in Supabase, and your keys live in `config.js`.
Replace `index.html` whenever there's a new version. Your log and your keys stay exactly as they are.

## If something goes wrong

| What you see | What to check |
|---|---|
| "Couldn’t reach the sync service" | The keys in `config.js`, or your internet connection |
| A new entry doesn't show on the other phone right away | Database → Publications → `supabase_realtime` should include `entries`, `babies` and `baby_members`. The app also refreshes when you come back to it. |
| "Supabase is still set to confirm emails" | Step 3: turn off Confirm email |
| Forgot your password | There's no reset email. In Supabase, go to **Authentication → Users**, find the account, and use **Send password recovery** if it's your own email, or ask me to add a reset option. Don't delete the account; that also deletes the baby's log it created. |
| "Invite code was already used" | Make a new code. Each one works for one person. |
