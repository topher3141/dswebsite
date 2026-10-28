import "server-only";
import { createHash, createHmac, randomBytes } from "node:crypto";
import { NextRequest } from "next/server";
import { Claim } from "./policy";
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export function env(key: string) {
  const v = process.env[key];
  if (!v)
    throw new HttpError(
      503,
      "The returns portal is being configured. Please try again later.",
    );
  return v;
}
export const hash = (s: string) => createHash("sha256").update(s).digest("hex");
export const customerToken = (id: string) =>
  createHmac("sha256", env("RETURNS_LINK_SECRET"))
    .update("claim:" + id)
    .digest("hex");
export const secret = () => randomBytes(32).toString("hex");
export const siteUrl = () => env("RETURNS_SITE_URL").replace(/\/$/, "");
export async function database(path: string, init: RequestInit = {}) {
  const key = env("RETURNS_SUPABASE_SERVICE_ROLE_KEY");
  const r = await fetch(`${env("RETURNS_SUPABASE_URL")}/rest/v1/${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...init.headers,
    },
  });
  if (!r.ok)
    throw new HttpError(
      503,
      "We could not save or load the claim. Please try again.",
    );
  const t = await r.text();
  return t ? JSON.parse(t) : null;
}
export async function rate(key: string, limit: number, seconds: number) {
  const allowed = await database("rpc/returns_rate_limit", {
    method: "POST",
    body: JSON.stringify({
      p_key: hash(key),
      p_limit: limit,
      p_seconds: seconds,
    }),
  });
  if (!allowed)
    throw new HttpError(429, "Too many attempts. Please try again later.");
}
export async function guard(req: NextRequest) {
  if (req.headers.get("origin") !== new URL(siteUrl()).origin)
    throw new HttpError(
      403,
      "Please use the returns portal to submit this request.",
    );
}
export async function bot(token: string) {
  if (!token || token.length > 3000)
    throw new HttpError(400, "Please complete the bot verification.");
  const r = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret: env("TURNSTILE_SECRET_KEY"),
        response: token,
      }),
      signal: AbortSignal.timeout(10000),
    },
  );
  if (!r.ok || !(await r.json()).success)
    throw new HttpError(403, "Bot verification expired. Please try again.");
}
export async function admins(): Promise<string[]> {
  return (await database("returns_admins?active=eq.true&select=email")).map(
    (a: any) => a.email,
  );
}
export async function admin(req: NextRequest): Promise<string> {
  const token = req.cookies.get("ds_returns_session")?.value;
  if (!token) throw new HttpError(401, "Please sign in.");
  const rows = await database(
    `returns_sessions?token_hash=eq.${hash(token)}&expires_at=gt.${encodeURIComponent(new Date().toISOString())}&select=email`,
  );
  if (!rows[0] || !(await admins()).includes(rows[0].email))
    throw new HttpError(401, "Please sign in.");
  return rows[0].email;
}
export async function loadClaim(
  req: NextRequest,
  id: string,
  staff = false,
): Promise<Claim> {
  if (!/^[a-f0-9-]{36}$/.test(id)) throw new HttpError(404, "Claim not found.");
  const token = req.headers.get("authorization")?.replace(/^Bearer /, "") || "";
  const rows = await database(
    `returns_claims?id=eq.${id}${staff ? "" : "&token_hash=eq." + hash(token)}&select=data`,
  );
  if (!rows[0]) throw new HttpError(404, "Claim not found or link invalid.");
  return rows[0].data;
}
export function publicClaim(claim: Claim): Claim {
  return {
    ...claim,
    square: claim.square
      ? { ...claim.square, paymentId: "", orderId: "" }
      : undefined,
    events: claim.events.filter((e) => !e.internal),
    attachments: claim.attachments.map((a) => ({ ...a, path: "" })),
  };
}
export async function queueEmail(
  to: string,
  subject: string,
  text: string,
  key: string,
) {
  await database("returns_outbox?on_conflict=idempotency_key", {
    method: "POST",
    headers: { Prefer: "resolution=ignore-duplicates,return=minimal" },
    body: JSON.stringify({
      recipient: to,
      subject,
      body: text,
      idempotency_key: key,
    }),
  });
}
export async function flushEmails(onlyKey?: string) {
  const rows = await database(
    "returns_outbox?sent_at=is.null&order=created_at.asc&limit=10" +
      (onlyKey ? "&idempotency_key=eq." + encodeURIComponent(onlyKey) : ""),
  );
  const activeAdmins = await admins();
  let failed = 0;
  for (const row of rows) {
    try {
      if (
        row.idempotency_key.includes(":admin:") &&
        !activeAdmins.includes(row.recipient)
      ) {
        await database(`returns_outbox?id=eq.${row.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            sent_at: new Date().toISOString(),
            last_error: "Skipped: admin access removed.",
          }),
        });
        continue;
      }
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env("RESEND_API_KEY")}`,
          "Content-Type": "application/json",
          "Idempotency-Key": row.idempotency_key,
        },
        body: JSON.stringify({
          from: process.env.RETURNS_FROM_EMAIL || env("JOBS_FROM_EMAIL"),
          to: [row.recipient],
          reply_to: activeAdmins,
          subject: row.subject,
          text: row.body,
        }),
        signal: AbortSignal.timeout(5000),
      });
      if (!r.ok) throw new Error("Email delivery failed");
      await database(`returns_outbox?id=eq.${row.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          sent_at: new Date().toISOString(),
          last_error: null,
        }),
      });
    } catch {
      failed++;
      await database(`returns_outbox?id=eq.${row.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          last_error: "Delivery failed. Check Resend configuration and retry.",
        }),
      });
    }
  }
  return { failed };
}
export async function storage(path: string, init: RequestInit = {}) {
  const key = env("RETURNS_SUPABASE_SERVICE_ROLE_KEY");
  const r = await fetch(`${env("RETURNS_SUPABASE_URL")}/storage/v1/${path}`, {
    ...init,
    cache: "no-store",
    headers: { apikey: key, Authorization: `Bearer ${key}`, ...init.headers },
  });
  if (!r.ok)
    throw new HttpError(
      503,
      "We could not process the attachment. Please try again.",
    );
  return r;
}
export async function upload(file: File, claimId: string) {
  const data = Buffer.from(await file.arrayBuffer());
  const type = data.subarray(0, 3).equals(Buffer.from([255, 216, 255]))
    ? "image/jpeg"
    : data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
      ? "image/png"
      : data.subarray(0, 4).toString() === "RIFF" &&
          data.subarray(8, 12).toString() === "WEBP"
        ? "image/webp"
        : data.subarray(0, 5).toString() === "%PDF-"
          ? "application/pdf"
          : "";
  if (!type || file.type !== type || !file.size || file.size > 3 * 1024 * 1024)
    throw new HttpError(
      400,
      "Use JPG, PNG, WebP, or PDF files, up to 3 MB each.",
    );
  const ext = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "application/pdf": "pdf",
  }[type];
  const path = `${claimId}/${secret()}.${ext}`;
  await storage("object/returns-evidence/" + path, {
    method: "POST",
    headers: { "Content-Type": type },
    body: data,
  });
  return {
    path,
    type,
    name: file.name.replace(/[^a-zA-Z0-9._ -]/g, "_").slice(0, 150),
  };
}
