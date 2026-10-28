import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { Claim, cents, today, validDate } from "./policy";
import { env, HttpError } from "./server";
export function signLookup(value: object) {
  const payload = Buffer.from(
    JSON.stringify({ ...value, expires: Date.now() + 30 * 60000 }),
  ).toString("base64url");
  return (
    payload +
    "." +
    createHmac("sha256", env("RETURNS_SUPABASE_SERVICE_ROLE_KEY"))
      .update(payload)
      .digest("hex")
  );
}
export function readLookup(
  proof: string,
  receiptDate: string,
  receiptNumber: string,
  receiptTotal: number,
) {
  try {
    const [payload, signature] = proof.split(".");
    const expected = createHmac(
      "sha256",
      env("RETURNS_SUPABASE_SERVICE_ROLE_KEY"),
    )
      .update(payload)
      .digest("hex");
    if (
      !signature ||
      signature.length !== expected.length ||
      !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
    )
      return undefined;
    const value = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (
      value.expires < Date.now() ||
      value.receiptDate !== receiptDate ||
      value.receiptNumber.toUpperCase() !== receiptNumber.toUpperCase() ||
      value.receiptTotal !== receiptTotal
    )
      return undefined;
    return value.match as Claim["square"];
  } catch {
    return undefined;
  }
}
const LOOKUP_UNAVAILABLE = "Square lookup is unavailable. You can still submit your receipt for manual review.";
class SquareError extends HttpError {
  constructor(public staffMessage: string) { super(503, LOOKUP_UNAVAILABLE); }
}
function squareEnvironment() {
  const value = process.env.RETURNS_SQUARE_ENVIRONMENT || "production";
  if (!["production", "sandbox"].includes(value))
    throw new SquareError("RETURNS_SQUARE_ENVIRONMENT must be production or sandbox.");
  return value;
}
async function square(path: string, init: RequestInit = {}, deadline = Date.now() + 12000) {
  if (!process.env.SQUARE_ACCESS_TOKEN || !process.env.SQUARE_LOCATION_ID)
    throw new SquareError("Set SQUARE_ACCESS_TOKEN and SQUARE_LOCATION_ID for this deployment.");
  const base = squareEnvironment() === "sandbox" ? "https://connect.squareupsandbox.com" : "https://connect.squareup.com";
  let r: Response;
  try {
    r = await fetch(base + path, {
      ...init,
      headers: {
        Authorization: `Bearer ${env("SQUARE_ACCESS_TOKEN")}`,
        "Square-Version": process.env.SQUARE_API_VERSION || "2026-05-20",
        "Content-Type": "application/json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(Math.max(1, Math.min(12000, deadline - Date.now()))),
    });
  } catch {
    throw new SquareError("Square did not respond in time. Try the connection check again.");
  }
  if (!r.ok) {
    const message = r.status === 401 ? "Square rejected the access token. Check the token and production/sandbox environment."
      : r.status === 403 ? "The Square token lacks permission for this check. Enable PAYMENTS_READ and ORDERS_READ."
      : r.status === 404 || r.status === 400 ? "Square could not use this location or request. Check SQUARE_LOCATION_ID and SQUARE_API_VERSION."
      : r.status === 429 ? "Square is rate limiting requests. Try again shortly."
      : "Square is temporarily unavailable. Try again later.";
    throw new SquareError(message);
  }
  try { return await r.json(); }
  catch { throw new SquareError("Square returned an invalid response. Try again later."); }
}
export async function checkSquare() {
  const environment = process.env.RETURNS_SQUARE_ENVIRONMENT || "production";
  const locationId = process.env.SQUARE_LOCATION_ID || "";
  const configuration = ["SQUARE_ACCESS_TOKEN", "SQUARE_LOCATION_ID"].filter((key) => !process.env[key]);
  if (configuration.length || !["production", "sandbox"].includes(environment))
    return { connected: false, environment, locationId, checks: [{ name: "Configuration", ok: false, message: configuration.length ? `Missing: ${configuration.join(", ")}` : "RETURNS_SQUARE_ENVIRONMENT must be production or sandbox." }] };
  const checks = await Promise.all([
    { name: "Payments", path: "/v2/payments?" + new URLSearchParams({ location_id: locationId, limit: "1" }), init: {} },
    { name: "Orders", path: "/v2/orders/search", init: { method: "POST", body: JSON.stringify({ location_ids: [locationId], limit: 1, return_entries: true }) } },
  ].map(async ({ name, path, init }) => {
    try {
      await square(path, init);
      return { name, ok: true, message: "Read access confirmed." };
    } catch (error) {
      return { name, ok: false, message: error instanceof SquareError ? error.staffMessage : "Connection check failed. Please try again." };
    }
  }));
  return { connected: checks.every((check) => check.ok), environment, locationId, checks };
}
export async function lookup(input: Record<string, any>) {
  const receiptDate = String(input.receiptDate || ""),
    receiptNumber = String(input.receiptNumber || "").trim();
  if (
    !validDate(receiptDate) ||
    receiptDate > today() ||
    !receiptNumber ||
    receiptNumber.length > 80
  )
    throw new HttpError(
      400,
      "Enter the receipt date, number, and total first.",
    );
  const receiptTotal = cents(input.receiptTotal);
  const begin = new Date(
    Date.parse(receiptDate + "T00:00:00Z") - 86400000,
  ).toISOString();
  const end = new Date(
    Date.parse(receiptDate + "T00:00:00Z") + 2 * 86400000,
  ).toISOString();
  const deadline = Date.now() + 40000;
  let cursor = "";
  for (let page = 0; page < 20; page++) {
    if (Date.now() >= deadline) throw new SquareError("The receipt search took too long. Try again or use manual review.");
    const params = new URLSearchParams({
      begin_time: begin,
      end_time: end,
      location_id: env("SQUARE_LOCATION_ID"),
      limit: "100",
      ...(cursor ? { cursor } : {}),
    });
    const data = await square("/v2/payments?" + params, {}, deadline);
    for (const payment of data.payments || []) {
      if (
        today(new Date(payment.created_at)) !== receiptDate ||
        payment.status !== "COMPLETED" ||
        payment.location_id !== env("SQUARE_LOCATION_ID") ||
        String(payment.receipt_number).toUpperCase() !==
          receiptNumber.toUpperCase()
      )
        continue;
      const order = payment.order_id
        ? (await square("/v2/orders/" + encodeURIComponent(payment.order_id), {}, deadline))
            .order
        : null;
      if (
        (order && order.location_id !== env("SQUARE_LOCATION_ID")) ||
        (order?.total_money?.amount ?? payment.total_money?.amount) !==
          receiptTotal ||
        (order?.total_money?.currency ?? payment.total_money?.currency) !==
          "USD"
      )
        continue;
      const match: Claim["square"] = {
        paymentId: payment.id,
        orderId: payment.order_id || "",
        paymentDate: today(new Date(payment.created_at)),
        product: payment.application_details?.square_product || "UNKNOWN",
        items: (order?.line_items || []).map((item: any) => ({
          uid: item.uid,
          name: item.name || "Generic item",
          quantity: item.quantity,
          netAmount:
            (item.total_money?.amount || 0) -
            (item.total_tax_money?.amount || 0),
        })),
      };
      // Return only receipt itemization; never customer/card/loyalty data.
      return {
        items: match.items,
        product: match.product,
        paymentDate: match.paymentDate,
        proof: signLookup({ receiptDate, receiptNumber, receiptTotal, match }),
      };
    }
    cursor = data.cursor;
    if (!cursor) break;
  }
  if (cursor) throw new SquareError("The receipt search reached its limit. Use manual review or contact the store.");
  return {
    items: [],
    notice:
      "We could not match this receipt. You can still submit it for staff review.",
  };
}
