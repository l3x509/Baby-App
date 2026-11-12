# Bebenou

A baby tracker for feeds, sleep, diapers, growth, teeth and health, shared live between parents and caregivers. It's one HTML page backed by Supabase.

| File | What it is |
|---|---|
| `index.html` | The whole app |
| `config.js` | Your Supabase keys (the only file you edit) |
| `schema.sql` | Run once in Supabase to create the tables and access rules |
| `manifest.webmanifest`, `sw.js`, `icons/` | Let you add Bebenou to your home screen as an app |
| `privacy.html`, `terms.html`, `delete-account.html` | Privacy policy, terms of use, and the web page for deleting an account (required by Google Play) |
| `migrations/` | Database changes to run in Supabase after the first setup |
| `supabase/functions/ask/` | The server code for Ask Bebenou's personal answers |
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

Bebenou uses email and password, so no email service is needed. Each parent creates their own account.

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

Bebenou installs like an app, opening full screen with its own icon.

- **iPhone (Safari):** tap **⋯** next to the address bar, then **Share**, then **Add to Home Screen**. Keep **Open as Web App** on and tap **Add**. On older iPhones, the Share button is at the bottom of the screen.
- **Android (Chrome):** tap **⋮**, then **Add to Home screen** or **Install app**.

Settings → **Add to home screen** in the app shows the same steps, plus a one-tap **Install app** button where the phone supports it.
Entries always come live from Supabase. If you're offline, the app still opens, but it can't save new entries until you're back online.

## Moving entries from the Claude version

1. In the Claude version, go to **Settings → Backup & restore → Save backup**.
2. On your website, after you've signed in, go to **Settings → Backup & restore → Import backup** and choose that file.

Import skips anything you already have, so running it twice is safe.

## Ask Bebenou (AI answers)

Common questions are answered from guides built into the app, with no setup. Personal answers that look at your baby's log use Claude through a Supabase Edge Function, so your Anthropic key never reaches the app or this repo.

1. **Get an API key:** console.anthropic.com → API keys → Create key. Add a few dollars of credit and set a monthly spend limit there.
2. **Run `migrations/003-ask.sql`** in the SQL Editor (daily limits and answer reports). A new setup gets it from `schema.sql`.
3. **Create the function:** Supabase → Edge Functions → Deploy a new function → Via Editor. Name it `ask`, replace the code with `supabase/functions/ask/index.ts`, and click Deploy.
4. **Add the key:** Edge Functions → Secrets → add `ANTHROPIC_API_KEY` with your key. Optional: `ASK_DAILY_LIMIT` (questions per person per day, default 20) and `ANTHROPIC_MODEL` (default `claude-haiku-5-5`).

Reported answers appear in Table Editor → `ask_reports`. Review them now and then; Google Play expects reports to be used to improve answers.

## Password reset emails

Accounts use email and password, and Premium belongs to the account, so people must be able to get back in. Supabase's built-in email only sends to members of your Supabase team, so connect your own sender once:

1. **Email sender:** create a free account with an email service such as Resend or Brevo, verify your domain (for example `lexcellentsolutions.com`), and copy its SMTP details.
2. **Supabase → Authentication → Emails → SMTP Settings:** turn on Custom SMTP and paste the host, port, username and password. Sender: `Bebenou <no-reply@yourdomain>`.
3. **Supabase → Authentication → URL Configuration:** set Site URL to `https://l3x509.github.io/Baby-App/` and add the same address under Redirect URLs. It must match `webUrl` in `config.js`.
4. Optional: in Emails → Templates → Reset Password, change the subject to "Reset your Bebenou password".

The reset link opens the web app, which asks for a new password. The new password then works in the Android app too.

## Premium and photos

Premium is one subscription per baby log: whoever subscribes unlocks it for everyone on that log. Billing runs through Google Play, managed by RevenueCat. Photos are stored in a private Supabase Storage bucket that only family members of that log can see.

Free: tracking, sharing with one coparent, safety alerts, 7-day trends, common questions. Premium: photos on entries, doctor report PDF, pattern alerts, weight gain and WHO percentiles, 14/30-day trends and typical day, health trend charts, quick and voice add, personal Ask answers, unlimited caregivers and babies, milestone timeline and monthly recap, upright timer, milk stash pro, home-screen widget, all themes, CSV export.

Sample data and self-hosted logs show every feature. To open everything for everyone during testing, add `premiumOpen: true` to `config.js`.

1. **Run `migrations/004-premium-photos.sql`** in the SQL Editor. It adds the premium fields (only the server can change them) and creates the private `photos` bucket with its access rules.
2. **Google Play Console** → your app → Monetize → Subscriptions: create a subscription (for example `bebenou_premium`) with a monthly and a yearly base plan, and add a 7-day free trial offer. Play needs an uploaded build with the billing permission first (the current Android project has it).
3. **RevenueCat** (app.revenuecat.com): create a project, add the Android app (package `app.lexcellent.bebenou`) and connect it to Play with a service account (RevenueCat walks you through it).
   - Products: import the Play subscription.
   - Entitlements: create `premium` and attach the products.
   - Offerings: make the default offering with a Monthly and an Annual package.
4. **Public key in the app:** RevenueCat → Project settings → API keys → the Google Play key (starts with `goog_`). Put it in `config.js` as `rcAndroidKey`. That key is safe to publish.
5. **Server function:** Supabase → Edge Functions → Deploy a new function → Via Editor, name it `premium`, paste `supabase/functions/premium/index.ts`, Deploy. Then under Edge Functions → Secrets add:
   - `REVENUECAT_SECRET_KEY`: RevenueCat secret API key (starts with `sk_`). Never put it in `config.js`.
   - `REVENUECAT_WEBHOOK_AUTH`: any long random text.
6. **Webhook:** RevenueCat → Integrations → Webhooks → URL `https://<your-project>.supabase.co/functions/v1/premium`, Authorization header = the same text as `REVENUECAT_WEBHOOK_AUTH`. Renewals, cancellations and expirations then update the log on their own.
7. **Rebuild the Android app:** in `android-app/`, run `npm install`, then `npm run sync`, then build the release bundle as usual. Test with a Play license tester account (Play Console → Settings → License testing) so purchases aren't charged.

Subscribing happens in the Android app. On the web, Premium works once someone in the family has subscribed. If you later sell on the web through RevenueCat, put the purchase link in `rcWebPurchaseLink` (`{uid}` is replaced with the account id).

## Database updates

If you set up Supabase before November 1, 2026, run the migrations you haven't run yet in the SQL Editor, in order: `migrations/002-account-deletion.sql` (account deletion), `migrations/003-ask.sql` (Ask Bebenou), then `migrations/004-premium-photos.sql` (Premium and photos). A new setup gets all of them from `schema.sql` automatically.

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
| Forgot your password | Tap **Forgot your password?** on the sign-in screen. If no email arrives, finish the "Password reset emails" steps in this guide. |
| "Invite code was already used" | Make a new code. Each one works for one person. |
