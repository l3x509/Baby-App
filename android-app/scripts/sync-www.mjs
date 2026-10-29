// Copy the web app from the repo root into www/ for the Android build. Run with: npm run sync
import { cpSync, rmSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..", "..");
const app = path.resolve(here, "..");
const www = path.resolve(app, "www");
rmSync(www, { recursive: true, force: true });
mkdirSync(www);
for (const f of ["index.html", "config.js", "manifest.webmanifest", "privacy.html", "terms.html", "delete-account.html", "icons"]) {
  cpSync(path.join(root, f), path.join(www, f), { recursive: true });
}
// The app build loads Capacitor's JavaScript (vendor/capacitor.js), which connects the page to the native
// plugins: the Back button (App) and the system bars. The website never loads it.
// It also carries its own copy of the Supabase library, so the app doesn't depend on a CDN to start.
mkdirSync(path.join(www, "vendor"));
cpSync(path.join(app, "node_modules", "@capacitor", "core", "dist", "capacitor.js"), path.join(www, "vendor", "capacitor.js"));
cpSync(path.join(app, "node_modules", "@supabase", "supabase-js", "dist", "umd", "supabase.js"), path.join(www, "vendor", "supabase.js"));
const CDN = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js";
for (const name of ["index.html", "delete-account.html"]) {
  const page = path.join(www, name);
  let html = readFileSync(page, "utf8");
  if (!html.includes(CDN)) throw new Error(`${name} doesn't load the expected Supabase version (${CDN})`);
  html = html.replace(CDN, "vendor/supabase.js");
  if (name === "index.html") {
    if (!html.includes("</head>")) throw new Error("index.html has no </head>");
    html = html.replace("</head>", '<script src="vendor/capacitor.js"></script>\n</head>');
  }
  writeFileSync(page, html);
}
console.log("Copied the web app into", www);
