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
async function square(path: string) {
  const r = await fetch("https://connect.squareup.com" + path, {
    headers: {
      Authorization: `Bearer ${env("SQUARE_ACCESS_TOKEN")}`,
      "Square-Version": process.env.SQUARE_API_VERSION || "2026-05-20",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });
  if (!r.ok)
    throw new HttpError(
      503,
      "Square lookup is unavailable. You can still submit your receipt for manual review.",
    );
  return r.json();
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
  let cursor = "";
  for (let page = 0; page < 20; page++) {
    const params = new URLSearchParams({
      begin_time: begin,
      end_time: end,
      location_id: env("SQUARE_LOCATION_ID"),
      limit: "100",
      ...(cursor ? { cursor } : {}),
    });
    const data = await square("/v2/payments?" + params);
    for (const payment of data.payments || []) {
      if (
        today(new Date(payment.created_at)) !== receiptDate ||
        payment.status !== "COMPLETED" ||
        String(payment.receipt_number).toUpperCase() !==
          receiptNumber.toUpperCase()
      )
        continue;
      const order = payment.order_id
        ? (await square("/v2/orders/" + encodeURIComponent(payment.order_id)))
            .order
        : null;
      if (
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
  return {
    items: [],
    notice:
      "We could not match this receipt. You can still submit it for staff review.",
  };
}
