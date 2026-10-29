# Nestling Android app

The Android app is the same web app from the repo root, packaged with [Capacitor](https://capacitorjs.com) 8. Package name: `app.lexcellent.nestling`.

Store listing text, graphics and Play Console answers are in `store-assets/LISTING.md`.

## What you need on your computer

- Node.js 22 or newer
- Android Studio (current stable), with the Android SDK it installs

## Build the app bundle (.aab) for Google Play

From this `android-app` folder:

```
npm install          # first time only
npm run sync         # copies the web app into www/ and updates the Android project
npm run open         # opens the project in Android Studio
```

In Android Studio:

1. Wait for Gradle to finish syncing.
2. **Build → Generate Signed App Bundle or APK → Android App Bundle**.
3. First time: **Create new…** keystore. Save it as `~/nestling-release.keystore`, write down both passwords, and keep a backup copy somewhere safe (e.g. Documents and a USB drive). You need this same key for every future update.
4. Choose **release**, then **Create**. The file is `android/app/release/app-release.aab`.
5. In Play Console, create the app, then upload the .aab to **Testing → Internal testing** first.

Let Play App Signing manage the app signing key (the default). Your keystore then serves as the upload key.

## Every update

1. Make the change in the web app (repo root) and push. The website updates by itself.
2. In `android/app/build.gradle`, raise `versionCode` by 1 (1 → 2 → 3…) and set `versionName` (e.g. "1.1").
3. Set `APP_VERSION` near the top of the script in `index.html` to the same `versionName`.
4. `npm run sync`, then build a new signed bundle with the same keystore and upload it.

## Icons and splash screen

The source images are in `assets/` (peach tile with the Nestling mark; light and dark splash). After changing them:

```
npm run icons        # rebuilds the Android icon and splash files
```

## How the app build differs from the website

`npm run sync` copies the web app into `www/` and:

- adds `vendor/capacitor.js`, which only the app build loads;
- swaps the Supabase library from the CDN for a copy inside the app (`vendor/supabase.js`), so the app starts even when the CDN is slow. It's the same version as the website (2.45.4); if you change the version in `index.html`, change it in `package.json` and `scripts/sync-www.mjs` too.

Inside the app:

- the phone's Back button closes an open form, then goes back to Today, and closes the app from Today (`@capacitor/app`);
- the status bar and navigation bar icons follow the app's light or dark theme;
- the website's offline service worker and the "Add to home screen" section are not used, since the app is already installed.

Your Supabase keys come from `config.js` in the repo root, so the app and the website share the same family logs.

## Before you submit

- **Run `migrations/002-account-deletion.sql` in Supabase** (SQL Editor → New query → Run). Google Play requires account deletion in the app and on the web; the app's **Settings → Account → Delete my account** and `delete-account.html` both use it.
- **Premium is switched off** for now (`CONFIG={payments:false}` near the top of the script in `index.html`). Google Play requires Google Play Billing for selling digital features in an app, so turn it on only after billing is built.
- **Create the privacy@lexcellentsolutions.com mailbox.** It is the contact on the privacy, terms and deletion pages and in the listing.
- **Check the app name.** Other baby trackers already use "Nestling"; pick a distinct store name before the first upload (see LISTING.md). The package name `app.lexcellent.nestling` can't be changed after the first upload.
- **Test on a real phone** (sign in, invite, Back button, dark mode, delete account with a test account) with an internal-testing build before production.
