import { NextRequest, NextResponse } from "next/server";
import {
  Claim,
  reference,
  today,
  transition,
  validateClaim,
  money,
} from "../../../../lib/returns/policy";
import {
  admin,
  admins,
  bot,
  customerToken,
  database,
  env,
  flushEmails,
  guard,
  hash,
  HttpError,
  loadClaim,
  publicClaim,
  queueEmail,
  rate,
  secret,
  siteUrl,
  storage,
  upload,
} from "../../../../lib/returns/server";
import { lookup, readLookup } from "../../../../lib/returns/square";
export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";
const headers = {
  "Cache-Control": "no-store",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
};
const json = (data: unknown, status = 200) =>
  NextResponse.json(data, { status, headers });
type Context = { params: Promise<{ path: string[] }> };
function fail(error: unknown) {
  return json(
    {
      error:
        error instanceof HttpError
          ? error.message
          : error instanceof Error &&
              !/fetch|JSON|Unexpected|network|timeout/i.test(error.message)
            ? error.message
            : "Something went wrong. Please try again.",
    },
    error instanceof HttpError ? error.status : 400,
  );
}
async function body(req: NextRequest, multipart = false) {
  const max = multipart ? 3.5 * 1024 * 1024 : 24 * 1024;
  if (Number(req.headers.get("content-length")) > max)
    throw new HttpError(413, "Files must total less than 3 MB.");
  const reader = req.body?.getReader();
  if (!reader) throw new HttpError(400, "Request body required.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > max) {
      await reader.cancel();
      throw new HttpError(413, "Files must total less than 3 MB.");
    }
    chunks.push(value);
  }
  const data = Buffer.concat(chunks);
  return multipart
    ? new Response(data, {
        headers: { "Content-Type": req.headers.get("content-type") || "" },
      }).formData()
    : JSON.parse(data.toString());
}
function claimLink(id: string) {
  return siteUrl() + "/returns/claim?id=" + id + "#key=" + customerToken(id);
}
async function emails(claim: Claim, text: string, includeCustomer = true) {
  const subject = `Deals & Steals ${reference(claim.id)}`;
  const list = (await admins()).map((email) => ({
    recipient: email,
    subject,
    body: `${text}\n\n${claim.name}: ${claim.itemName}\n${claim.late ? "Late claim — exception requested.\n" : ""}${siteUrl()}/returns/admin`,
    key: `${claim.id}:${claim.version}:admin:${email}`,
  }));
  if (includeCustomer)
    list.push({
      recipient: claim.email,
      subject,
      body: `${text}\n\nClaim: ${reference(claim.id)}\nItem: ${claim.itemName}\n${claim.approvedAmount !== undefined ? "Approved credit before tax: " + money(claim.approvedAmount) + "\n" : ""}${claim.returnBy ? "Return deadline: " + claim.returnBy + "\n" : ""}\nView your claim, reply, or upload evidence:\n${claimLink(claim.id)}\n\nKeep this link private. Credit is processed in person. Please follow staff instructions before returning or disposing of an item.`,
      key: `${claim.id}:${claim.version}:customer`,
    });
  return list;
}
async function persist(
  claim: Claim,
  previous: number,
  notifications: unknown[],
  requestHash = "",
) {
  const ok = await database("rpc/returns_save_claim", {
    method: "POST",
    body: JSON.stringify({
      p_data: claim,
      p_previous: previous,
      p_token_hash: hash(customerToken(claim.id)),
      p_request_hash: requestHash,
      p_emails: notifications,
    }),
  });
  if (!ok)
    throw new HttpError(
      409,
      "This claim changed or was already submitted. Refresh before trying again.",
    );
}
async function delivery(key?: string) {
  try {
    return await flushEmails(key);
  } catch {
    return { failed: 1 };
  }
}
async function attachmentList(
  form: FormData,
  id: string,
  initial = false,
  requireReceipt = true,
) {
  const result: Claim["attachments"] = [];
  const receipt = form.get("receipt"),
    items = form
      .getAll("photos")
      .filter((f) => f instanceof File && f.size > 0) as File[];
  if (
    initial &&
    requireReceipt &&
    (!(receipt instanceof File) || !receipt.size)
  )
    throw new HttpError(
      400,
      "Look up your receipt again or attach a receipt photo or PDF for manual review.",
    );
  if (initial && !items.length)
    throw new HttpError(
      400,
      "Attach at least one photo of the item and problem.",
    );
  const files: { file: File; purpose: "receipt" | "item" | "evidence" }[] = [
    ...(initial && receipt instanceof File && receipt.size
      ? [{ file: receipt, purpose: "receipt" as const }]
      : []),
    ...items.map((file) => ({
      file,
      purpose: initial ? ("item" as const) : ("evidence" as const),
    })),
  ];
  if (
    files.length > 5 ||
    files.reduce((n, f) => n + f.file.size, 0) > 3 * 1024 * 1024
  )
    throw new HttpError(
      400,
      "Attach up to five files totaling no more than 3 MB.",
    );
  try {
    for (const { file, purpose } of files) {
      if (purpose !== "receipt" && !file.type.startsWith("image/"))
        throw new HttpError(
          400,
          "Item and evidence files must be JPG, PNG, or WebP photos.",
        );
      result.push({ ...(await upload(file, id)), purpose });
    }
    return result;
  } catch (error) {
    await cleanup(result);
    throw error;
  }
}
async function cleanup(files: Claim["attachments"]) {
  if (files.length)
    try {
      await storage("object/returns-evidence", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prefixes: files.map((f) => f.path) }),
      });
    } catch {
      /* orphan cleanup documented in setup */
    }
}
export async function GET(req: NextRequest, context: Context) {
  try {
    const { path } = await context.params;
    if (path[0] === "admin") {
      const email = await admin(req);
      if (path[1] === "me") return json({ email });
      if (path[1] === "admins")
        return json({
          admins: await database(
            "returns_admins?select=email,active&order=email",
          ),
        });
      if (path[1] === "mail") {
        const rows = await database(
          "returns_outbox?sent_at=is.null&select=id,last_error&limit=100",
        );
        return json({
          pending: rows.length,
          failed: rows.filter((r: any) => r.last_error).length,
        });
      }
      if (path[1] === "claims" && !path[2]) {
        const offset = Math.max(
          0,
          Math.floor(Number(req.nextUrl.searchParams.get("offset")) || 0),
        );
        const rows = await database(
          `returns_claims?select=data&order=updated_at.desc&limit=50&offset=${offset}`,
        );
        return json({
          claims: rows.map((r: any) => r.data),
          hasMore: rows.length === 50,
        });
      }
      if (path[1] === "claims" && path[2]) {
        const claim = await loadClaim(req, path[2], true);
        if (path[3] === "files") return download(claim, path[4]);
        return json({ claim });
      }
    }
    if (path[0] === "claims" && path[1]) {
      const claim = await loadClaim(req, path[1]);
      if (path[2] === "files") return download(claim, path[3]);
      return json({ claim: publicClaim(claim) });
    }
    // External scheduler can retry queued email independently of visits.
    if (
      path[0] === "mail-retry" &&
      req.headers.get("authorization") ===
        `Bearer ${env("RETURNS_CRON_SECRET")}`
    )
      return json(await flushEmails());
    return json({ error: "Not found." }, 404);
  } catch (error) {
    return fail(error);
  }
}
async function download(claim: Claim, index: string) {
  if (!/^\d+$/.test(index || ""))
    throw new HttpError(404, "Attachment not found.");
  const file = claim.attachments[Number(index)];
  if (!file) throw new HttpError(404, "Attachment not found.");
  const r = await storage("object/returns-evidence/" + file.path);
  return new NextResponse(r.body, {
    headers: {
      ...headers,
      "Content-Type": file.type,
      "Content-Disposition": `attachment; filename="${file.name.replace(/["\r\n]/g, "_")}"`,
      "Content-Security-Policy": "default-src 'none'; sandbox",
    },
  });
}
export async function POST(req: NextRequest, context: Context) {
  try {
    await guard(req);
    const { path } = await context.params;
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (path[0] === "login") {
      const input = await body(req);
      if (path[1] === "verify") {
        await rate("login-verify:" + ip, 30, 900);
        const token = String(input.token || "");
        if (!/^[a-f0-9]{64}$/.test(token))
          throw new HttpError(401, "Invalid or expired sign-in link.");
        const email = await database("rpc/returns_consume_login", {
          method: "POST",
          body: JSON.stringify({ p_hash: hash(token) }),
        });
        if (!email || !(await admins()).includes(email))
          throw new HttpError(401, "Invalid or expired sign-in link.");
        const session = secret();
        await database("returns_sessions", {
          method: "POST",
          body: JSON.stringify({
            token_hash: hash(session),
            email,
            expires_at: new Date(Date.now() + 8 * 3600000).toISOString(),
          }),
        });
        const response = json({ email });
        response.cookies.set("ds_returns_session", session, {
          httpOnly: true,
          secure: new URL(siteUrl()).protocol === "https:",
          sameSite: "strict",
          path: "/api/returns",
          maxAge: 8 * 3600,
        });
        return response;
      }
      await rate("login:" + ip, 10, 3600);
      await bot(String(input.turnstile || ""));
      const email = String(input.email || "")
        .trim()
        .toLowerCase();
      await rate("login-email:" + email, 5, 3600);
      if ((await admins()).includes(email)) {
        const token = secret();
        await database("returns_login_tokens", {
          method: "POST",
          body: JSON.stringify({
            token_hash: hash(token),
            email,
            expires_at: new Date(Date.now() + 15 * 60000).toISOString(),
          }),
        });
        await queueEmail(
          email,
          "Sign in to Deals & Steals returns",
          `Sign in within 15 minutes:\n${siteUrl()}/returns/admin#login=${token}\n\nThis link works once. If you did not request it, ignore this email.`,
          "login:" + hash(token),
        );
        await delivery("login:" + hash(token));
      }
      return json({
        ok: true,
        message:
          "If your email has admin access, a sign-in link is on its way.",
      });
    }
    if (path[0] === "lookup") {
      const input = await body(req);
      await rate("lookup:" + ip, 15, 3600);
      await bot(String(input.turnstile || ""));
      return json(await lookup(input));
    }
    if (path[0] === "claims" && !path[1]) {
      const form = (await body(req, true)) as FormData;
      const input = JSON.parse(String(form.get("payload") || "{}"));
      await rate("submit:" + ip, 12, 3600);
      await bot(String(input.turnstile || ""));
      let valid = validateClaim(input);
      const id = String(input.id || ""),
        requestKey = String(input.requestKey || "");
      if (!/^[a-f0-9-]{36}$/.test(id) || !/^[a-f0-9]{64}$/.test(requestKey))
        throw new HttpError(400, "Please refresh the form.");
      const existing = await database(
        `returns_claims?id=eq.${id}&request_hash=eq.${hash(requestKey)}&select=id`,
      );
      if (existing.length)
        return json({ id, key: customerToken(id), duplicate: true });
      const square = input.proof
        ? readLookup(
            String(input.proof),
            valid.receiptDate,
            valid.receiptNumber,
            valid.receiptTotal,
          )
        : undefined;
      if (square) {
        const pos = [
          "SQUARE_POS",
          "RETAIL",
          "RESTAURANTS",
          "TERMINAL_API",
        ].includes(square.product);
        valid = validateClaim({
          ...input,
          receiptDate: square.paymentDate,
          purchaseType: pos ? "pos" : input.purchaseType,
        });
      }
      if (square && input.selectedUid) {
        if (!square.items.some((i) => i.uid === input.selectedUid))
          throw new HttpError(400, "Select an item from the matched receipt.");
        square.selectedUid = input.selectedUid;
      }
      const at = new Date().toISOString();
      const claim: Claim = {
        ...valid,
        id,
        version: 1,
        createdAt: at,
        updatedAt: at,
        status: "submitted",
        attachments: [],
        square,
        events: [
          {
            at,
            actor: "Customer",
            text: "Claim submitted. Please wait for approval before returning or disposing of the item.",
          },
          {
            at,
            actor: "System",
            text: square
              ? `Square receipt matched. Payment date: ${square.paymentDate}. Source: ${square.product}. Verify item, purchase channel, pickup date, and any previous credit before approval.`
              : "Receipt not matched automatically. Verify purchase and pickup/payment dates before approval.",
            internal: true,
          },
        ],
      };
      claim.attachments = await attachmentList(form, id, true, !square);
      try {
        await persist(
          claim,
          0,
          await emails(
            claim,
            "We received your claim. Our team will review it and email you with the next steps.",
          ),
          hash(requestKey),
        );
      } catch (error) {
        await cleanup(claim.attachments);
        throw error;
      }
      const mail = await delivery();
      return json(
        { id, key: customerToken(id), emailPending: mail.failed > 0 },
        201,
      );
    }
    if (path[0] === "claims" && path[1]) {
      let claim = await loadClaim(req, path[1]);
      if (["credited", "denied"].includes(claim.status))
        throw new HttpError(
          400,
          "This claim is closed. Reply to your claim email for help.",
        );
      await rate("reply:" + claim.id, 15, 3600);
      const form = (await body(req, true)) as FormData;
      const message = String(form.get("message") || "").trim();
      if (!message || message.length > 4000)
        throw new HttpError(400, "Enter a message of up to 4,000 characters.");
      if (claim.attachments.length >= 25)
        throw new HttpError(
          400,
          "Attachment limit reached. Reply to your claim email for help.",
        );
      const files = await attachmentList(form, claim.id);
      if (claim.status === "awaiting_destruction" && !files.length)
        throw new HttpError(
          400,
          "Attach destruction evidence photos for review.",
        );
      const previous = claim.version;
      claim = {
        ...claim,
        version: previous + 1,
        updatedAt: new Date().toISOString(),
        attachments: [...claim.attachments, ...files],
      };
      if (claim.status === "awaiting_destruction")
        claim.status = "destruction_review";
      else if (claim.status === "information_requested")
        claim.status = "submitted";
      claim.events.push({
        at: claim.updatedAt,
        actor: "Customer",
        text: message,
      });
      try {
        await persist(
          claim,
          previous,
          await emails(claim, "New customer response received.", false),
        );
      } catch (error) {
        await cleanup(files);
        throw error;
      }
      await delivery();
      return json({ claim: publicClaim(claim) });
    }
    if (path[0] === "admin") {
      const actor = await admin(req);
      if (path[1] === "logout") {
        const token = req.cookies.get("ds_returns_session")?.value || "";
        await database("returns_sessions?token_hash=eq." + hash(token), {
          method: "DELETE",
        });
        const response = json({ ok: true });
        response.cookies.set("ds_returns_session", "", {
          path: "/api/returns",
          maxAge: 0,
        });
        return response;
      }
      if (path[1] === "retry-mail") return json(await flushEmails());
      const input = await body(req);
      if (path[1] === "admins") {
        const email = String(input.email || "")
          .trim()
          .toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200)
          throw new HttpError(400, "Enter a valid admin email.");
        if (email === actor && input.active === false)
          throw new HttpError(400, "Another admin must remove your access.");
        await database("returns_admins?on_conflict=email", {
          method: "POST",
          headers: {
            Prefer: "resolution=merge-duplicates,return=representation",
          },
          body: JSON.stringify({ email, active: input.active !== false }),
        });
        // Revocation invalidates existing sessions and unused sign-in links.
        if (input.active === false)
          for (const table of ["returns_sessions", "returns_login_tokens"])
            await database(`${table}?email=eq.${encodeURIComponent(email)}`, {
              method: "DELETE",
            });
        return json({
          admins: await database(
            "returns_admins?select=email,active&order=email",
          ),
        });
      }
      if (path[1] === "claims" && path[2]) {
        const claim = await loadClaim(req, path[2], true);
        if (input.version !== claim.version)
          throw new HttpError(
            409,
            "This claim changed. Refresh it before trying again.",
          );
        if (
          claim.late &&
          input.action?.startsWith("approve") &&
          input.allowException !== true
        )
          throw new HttpError(
            400,
            "Confirm the late exception before approving.",
          );
        if (input.action?.startsWith("approve") && input.verified !== true)
          throw new HttpError(
            400,
            "Confirm that you verified the purchase, item, eligibility, and any prior credit.",
          );
        const next = transition(claim, input, actor);
        const notifications =
          input.action === "note" ? [] : await emails(next, input.message);
        await persist(next, claim.version, notifications);
        const mail = await delivery();
        return json({ claim: next, emailPending: mail.failed > 0 });
      }
    }
    return json({ error: "Not found." }, 404);
  } catch (error) {
    return fail(error);
  }
}
