export const POLICY =
  "All sales are final unless an item is defective or not as described. Notify Deals & Steals within 7 days of purchase for in-person sales, or within 7 days of pickup for prepaid online purchases. Items sold as is are excluded. Approved returns must be brought back within 14 days after approval. Eligible claims receive store credit.";
export type PurchaseType = "pos" | "online";
export type Status =
  | "submitted"
  | "information_requested"
  | "approved_return"
  | "approved_keep"
  | "awaiting_destruction"
  | "destruction_review"
  | "approved_destroy"
  | "denied"
  | "credited";
export const STATUS_LABELS: Record<Status, string> = {
  submitted: "Awaiting review",
  information_requested: "More information needed",
  approved_return: "Approved — return item",
  approved_keep: "Approved — keep item",
  awaiting_destruction: "Destruction evidence needed",
  destruction_review: "Evidence awaiting review",
  approved_destroy: "Approved — disposal authorized",
  denied: "Not approved",
  credited: "Credit issued",
};
export type Attachment = {
  path: string;
  name: string;
  type: string;
  purpose: "receipt" | "item" | "evidence";
};
export type ClaimEvent = {
  at: string;
  actor: string;
  text: string;
  internal?: boolean;
};
export type Claim = {
  id: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  status: Status;
  name: string;
  email: string;
  phone: string;
  purchaseType: PurchaseType;
  receiptDate: string;
  pickupDate: string;
  receiptNumber: string;
  receiptTotal: number;
  itemName: string;
  itemPrice: number;
  issue: "defective" | "not_as_described";
  description: string;
  late: boolean;
  exceptionReason: string;
  square?: {
    paymentId: string;
    orderId: string;
    paymentDate: string;
    product: string;
    items: { uid: string; name: string; quantity: string; netAmount: number }[];
    selectedUid?: string;
  };
  attachments: Attachment[];
  events: ClaimEvent[];
  approvedAmount?: number;
  returnBy?: string;
  creditMethod?: string;
  creditReference?: string;
  creditedAt?: string;
};
export function today(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}
export function validDate(value: string): boolean {
  const date = new Date(value + "T12:00:00Z");
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(date.getTime()) &&
    date.toISOString().slice(0, 10) === value
  );
}
export function addDays(date: string, days: number): string {
  return new Date(Date.parse(date + "T12:00:00Z") + days * 86400000)
    .toISOString()
    .slice(0, 10);
}
export function isLate(
  type: PurchaseType,
  receiptDate: string,
  pickupDate: string,
  now = today(),
): boolean {
  return now > addDays(type === "online" ? pickupDate : receiptDate, 7);
}
export function cents(value: unknown): number {
  const s = String(value ?? "").trim();
  if (!/^\d{1,6}(\.\d{1,2})?$/.test(s))
    throw new Error("Enter an amount with up to two decimal places.");
  return Math.round(Number(s) * 100);
}
export function money(value = 0): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value / 100);
}
export function reference(id: string) {
  return "DS-" + id.slice(0, 8).toUpperCase();
}
export function validateClaim(input: Record<string, any>, now = today()) {
  const text = (key: string, max: number, required = true) => {
    const value = typeof input[key] === "string" ? input[key].trim() : "";
    if ((required && !value) || value.length > max)
      throw new Error(
        `Please check ${key.replace(/([A-Z])/g, " $1").toLowerCase()}.`,
      );
    return value;
  };
  const name = text("name", 120),
    email = text("email", 200).toLowerCase(),
    phone = text("phone", 40);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new Error("Enter a valid email address.");
  if (!["pos", "online"].includes(input.purchaseType))
    throw new Error("Choose how you paid.");
  const purchaseType = input.purchaseType as PurchaseType,
    receiptDate = text("receiptDate", 10);
  const pickupDate =
    purchaseType === "online" ? text("pickupDate", 10) : receiptDate;
  if (
    !validDate(receiptDate) ||
    !validDate(pickupDate) ||
    receiptDate > now ||
    pickupDate > now ||
    pickupDate < receiptDate
  )
    throw new Error(
      "Check the receipt and pickup dates. Pickup cannot precede payment, and dates cannot be in the future.",
    );
  const receiptTotal = cents(input.receiptTotal),
    itemPrice = cents(input.itemPrice);
  if (!itemPrice || itemPrice > receiptTotal)
    throw new Error(
      "Item price must be greater than zero and no more than the receipt total.",
    );
  if (!["defective", "not_as_described"].includes(input.issue))
    throw new Error("Select the reason for your claim.");
  if (input.asIs !== "no")
    throw new Error("Items sold as is are excluded from this policy.");
  if (input.consent !== "yes")
    throw new Error("Please acknowledge the return policy.");
  const late = isLate(purchaseType, receiptDate, pickupDate, now),
    exceptionReason = text("exceptionReason", 2000, late);
  return {
    name,
    email,
    phone,
    purchaseType,
    receiptDate,
    pickupDate,
    receiptNumber: text("receiptNumber", 80),
    receiptTotal,
    itemName: text("itemName", 200),
    itemPrice,
    issue: input.issue as Claim["issue"],
    description: text("description", 4000),
    late,
    exceptionReason,
  };
}
export function transition(
  claim: Claim,
  input: Record<string, any>,
  actor: string,
  now = new Date(),
): Claim {
  if (claim.status === "credited")
    throw new Error("This claim is already closed with credit issued.");
  const text = String(input.message || "").trim();
  if (!text || text.length > 4000)
    throw new Error("Enter a message or instruction (up to 4,000 characters).");
  const result = structuredClone(claim);
  const approval = [
    "approve_return",
    "approve_keep",
    "approve_destroy",
  ].includes(input.action);
  if (approval) {
    if (
      ![
        "submitted",
        "information_requested",
        "denied",
        "approved_return",
        "approved_keep",
        "awaiting_destruction",
        "destruction_review",
        "approved_destroy",
      ].includes(claim.status)
    )
      throw new Error("This claim cannot be approved.");
    const amount = cents(input.amount);
    if (!amount || amount > claim.itemPrice)
      throw new Error(
        "Approve an amount greater than zero and no more than the item price before tax.",
      );
    result.approvedAmount = amount;
    result.returnBy =
      input.action === "approve_return" ? addDays(today(now), 14) : undefined;
    result.status =
      input.action === "approve_return"
        ? "approved_return"
        : input.action === "approve_keep"
          ? "approved_keep"
          : input.requireEvidence === true
            ? "awaiting_destruction"
            : "approved_destroy";
  } else if (input.action === "accept_evidence") {
    if (claim.status !== "destruction_review")
      throw new Error("Destruction evidence must be submitted first.");
    result.status = "approved_destroy";
  } else if (input.action === "request_info")
    result.status = "information_requested";
  else if (input.action === "request_evidence") {
    if (!["awaiting_destruction", "destruction_review"].includes(claim.status))
      throw new Error("This claim is not awaiting destruction evidence.");
    result.status = "awaiting_destruction";
  } else if (input.action === "deny") result.status = "denied";
  else if (input.action === "extend") {
    if (
      claim.status !== "approved_return" ||
      !validDate(input.returnBy || "") ||
      input.returnBy < today(now)
    )
      throw new Error("Choose a valid return deadline for an approved return.");
    result.returnBy = input.returnBy;
  } else if (input.action === "credit") {
    if (
      !["approved_return", "approved_keep", "approved_destroy"].includes(
        claim.status,
      )
    )
      throw new Error(
        "Approval and any required evidence review must be complete before credit is issued.",
      );
    if (claim.status === "approved_return" && input.received !== true)
      throw new Error("Confirm that the item was returned.");
    if (claim.status === "approved_return" && today(now) > claim.returnBy!)
      throw new Error(
        "The return deadline has passed. Extend it before recording credit.",
      );
    if (
      !["next_order_discount", "in_store_credit"].includes(input.creditMethod)
    )
      throw new Error("Choose how credit was issued.");
    const ref = String(input.creditReference || "").trim();
    if (!ref || ref.length > 200)
      throw new Error("Enter the Square transaction or credit reference.");
    result.status = "credited";
    result.creditMethod = input.creditMethod;
    result.creditReference = ref;
    result.creditedAt = now.toISOString();
  } else if (input.action !== "note") throw new Error("Unknown action.");
  result.updatedAt = now.toISOString();
  result.version++;
  result.events.push({
    at: result.updatedAt,
    actor,
    text,
    internal: input.action === "note",
  });
  return result;
}
