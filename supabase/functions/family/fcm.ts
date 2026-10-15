// Sends push messages through Firebase Cloud Messaging (HTTP v1).
// The Firebase key is read from the Supabase Vault at run time; it is never in the code.

type ServiceAccount = { client_email: string; private_key: string; project_id: string; token_uri?: string };

let cached: { token: string; until: number; project: string } | null = null;

function b64url(data: Uint8Array | string) {
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function accessToken(sa: ServiceAccount) {
  const now = Math.floor(Date.now() / 1000);
  if (cached && cached.until > now + 60 && cached.project === sa.project_id) return cached.token;
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64url(
    JSON.stringify({
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/firebase.messaging",
      aud: sa.token_uri || "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  );
  const pem = sa.private_key.replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");
  const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey("pkcs8", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(`${header}.${claim}`)));
  const jwt = `${header}.${claim}.${b64url(sig)}`;
  const res = await fetch(sa.token_uri || "https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt }),
  });
  if (!res.ok) throw new Error(`token ${res.status} ${await res.text()}`);
  const out = (await res.json()) as { access_token: string; expires_in: number };
  cached = { token: out.access_token, until: now + (out.expires_in || 3600), project: sa.project_id };
  return out.access_token;
}

export type PushResult = "sent" | "no-token" | "bad-token" | "failed";

/**
 * Data-only, high-priority message: the Android app's own service shows the card,
 * wakes the fairy and speaks it, even when the app is closed.
 */
export async function push(saJson: string, token: string | null, data: Record<string, string>): Promise<PushResult> {
  if (!token) return "no-token";
  let sa: ServiceAccount;
  try {
    sa = JSON.parse(saJson) as ServiceAccount;
  } catch {
    return "failed";
  }
  try {
    const at = await accessToken(sa);
    const res = await fetch(`https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${at}` },
      body: JSON.stringify({
        message: {
          token,
          data,
          android: { priority: "HIGH", ttl: data.kind === "alert" ? "3600s" : "86400s" },
        },
      }),
    });
    if (res.ok) return "sent";
    const body = await res.text();
    if (res.status === 404 || body.includes("UNREGISTERED") || body.includes("INVALID_ARGUMENT")) return "bad-token";
    console.error("fcm", res.status, body.slice(0, 300));
    return "failed";
  } catch (e) {
    console.error("fcm error", String(e));
    return "failed";
  }
}
