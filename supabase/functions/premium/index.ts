// Bebenou Premium — Supabase Edge Function.
// Deploy from the Supabase dashboard: Edge Functions → Deploy a new function → Via Editor,
// name it "premium", paste this file, then Deploy.
// Secrets (Edge Functions → Secrets):
//   REVENUECAT_SECRET_KEY   RevenueCat → Project settings → API keys → Secret API key (v1, starts with sk_)
//   REVENUECAT_WEBHOOK_AUTH any long random text; paste the same value in RevenueCat → Integrations →
//                           Webhooks → Authorization header. Lets renewals and cancellations update by themselves.
//   PREMIUM_ENTITLEMENT     optional, defaults to "premium" (the entitlement identifier in RevenueCat)
//
// Two ways in:
//  1) The app calls it after a purchase or restore: POST { baby_id } with the user's sign-in token.
//     It asks RevenueCat whether this user has the entitlement and, if so, unlocks Premium on that
//     baby's log for every family member.
//  2) RevenueCat calls it on renewals, cancellations and expirations (webhook).
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const ENT = Deno.env.get("PREMIUM_ENTITLEMENT") || "premium";
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

const admin = () => createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

// Returns the entitlement expiry as ISO text, "lifetime", or null when not active.
async function entitlementFor(userId: string): Promise<string | null> {
  const key = Deno.env.get("REVENUECAT_SECRET_KEY");
  if (!key) throw new Error("Premium isn't set up yet (missing REVENUECAT_SECRET_KEY).");
  const r = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(userId)}`, {
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
  });
  if (!r.ok) throw new Error(`RevenueCat answered ${r.status}.`);
  const data = await r.json();
  const e = data?.subscriber?.entitlements?.[ENT];
  if (!e) return null;
  if (e.expires_date == null) return "lifetime";
  const exp = new Date(e.expires_date);
  // Keep a short grace period so a renewal that is a few minutes late doesn't lock anyone out.
  return exp.getTime() + 6 * 3600e3 > Date.now() ? exp.toISOString() : null;
}

const untilValue = (v: string | null) => v === "lifetime" ? "2999-12-31T00:00:00Z" : v;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "Use POST." }, 405);
  const auth = req.headers.get("Authorization") || "";

  // ---- RevenueCat webhook ----
  const hook = Deno.env.get("REVENUECAT_WEBHOOK_AUTH");
  if (hook && auth === hook) {
    let body: any; try { body = await req.json(); } catch { return json({ error: "Bad request." }, 400); }
    const userId = String(body?.event?.app_user_id || "");
    if (!/^[0-9a-f-]{36}$/i.test(userId)) return json({ ok: true, skipped: "not a Bebenou user" });
    try {
      const until = untilValue(await entitlementFor(userId));
      const db = admin();
      // Every log this person unlocked follows their subscription.
      await db.from("babies").update({ premium_until: until ?? new Date().toISOString() }).eq("premium_by", userId);
      return json({ ok: true, premium_until: until });
    } catch (e) { return json({ error: String((e as Error).message || e) }, 500); }
  }

  // ---- Called by the app ----
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: auth } },
  });
  const { data: u } = await supabase.auth.getUser();
  if (!u?.user) return json({ error: "Sign in first." }, 401);
  let body: { baby_id?: string };
  try { body = await req.json(); } catch { return json({ error: "Bad request." }, 400); }
  const babyId = String(body.baby_id || "");
  if (!/^[0-9a-f-]{36}$/i.test(babyId)) return json({ error: "Missing baby." }, 400);

  // Must be able to log on this baby (owner or parent), checked with the person's own access.
  const { data: canWrite } = await supabase.rpc("can_write", { b: babyId });
  if (!canWrite) return json({ error: "You can't change this log." }, 403);

  try {
    const until = untilValue(await entitlementFor(u.user.id));
    const db = admin();
    const { data: baby } = await db.from("babies").select("premium_until, premium_by").eq("id", babyId).single();
    if (until) {
      await db.from("babies").update({ premium_until: until, premium_by: u.user.id }).eq("id", babyId);
      return json({ premium: true, premium_until: until });
    }
    // Not subscribed: leave another family member's active subscription alone.
    const active = baby?.premium_until && new Date(baby.premium_until).getTime() > Date.now();
    return json({ premium: !!active, premium_until: baby?.premium_until ?? null });
  } catch (e) {
    return json({ error: String((e as Error).message || e) }, 500);
  }
});
