import test from "node:test";
import assert from "node:assert/strict";
import {
  addDays,
  cents,
  isLate,
  today,
  transition,
  validDate,
  validateClaim,
} from "../lib/returns/policy.ts";
const input = {
  name: "Test Customer",
  email: "TEST@example.com",
  phone: "555-555-0100",
  purchaseType: "pos",
  receiptDate: "2026-10-21",
  receiptNumber: "AB12",
  receiptTotal: "53.00",
  itemName: "Coffee maker",
  itemPrice: "50.00",
  issue: "defective",
  description: "Does not turn on.",
  asIs: "no",
  consent: "yes",
};
const at = new Date("2026-10-28T15:00:00Z");
function claim() {
  return {
    ...validateClaim(input, "2026-10-28"),
    id: "00000000-0000-4000-8000-000000000001",
    createdAt: at.toISOString(),
    updatedAt: at.toISOString(),
    version: 1,
    status: "submitted",
    events: [],
    attachments: [],
  };
}
test("POS clock starts on payment; day seven is eligible, day eight is late", () => {
  assert.equal(isLate("pos", "2026-10-21", "2026-10-27", "2026-10-28"), false);
  assert.equal(isLate("pos", "2026-10-20", "2026-10-27", "2026-10-28"), true);
});
test("online clock starts on actual pickup, even after much earlier prepayment", () => {
  assert.equal(
    isLate("online", "2026-09-01", "2026-10-23", "2026-10-28"),
    false,
  );
  assert.equal(
    isLate("online", "2026-09-01", "2026-10-20", "2026-10-28"),
    true,
  );
});
test("calendar dates and Eastern day boundaries survive DST", () => {
  assert.equal(today(new Date("2026-10-29T02:30:00Z")), "2026-10-28");
  assert.equal(addDays("2026-10-28", 14), "2026-11-11");
  assert.equal(validDate("2026-02-30"), false);
  assert.equal(validDate("not-a-date"), false);
});
test("late requests require an exception explanation and are accepted when supplied", () => {
  assert.throws(
    () => validateClaim({ ...input, receiptDate: "2026-10-01" }, "2026-10-28"),
    /exception reason/,
  );
  assert.equal(
    validateClaim(
      { ...input, receiptDate: "2026-10-01", exceptionReason: "Hospital stay" },
      "2026-10-28",
    ).late,
    true,
  );
});
test("as-is, future dates, impossible pickup dates, invalid money, and missing consent are rejected", () => {
  for (const patch of [
    { asIs: "yes" },
    { consent: "" },
    { receiptDate: "2026-10-29" },
    { purchaseType: "online", pickupDate: "2026-10-01" },
    { itemPrice: "53.01" },
    { itemPrice: "0" },
  ])
    assert.throws(() => validateClaim({ ...input, ...patch }, "2026-10-28"));
  for (const v of ["-1", "NaN", "1e3", "1.001", ""])
    assert.throws(() => cents(v));
  assert.equal(cents("19.99"), 1999);
});
test("partial approval gets a 14-day deadline and immutable audit event", () => {
  const original = claim(),
    next = transition(
      original,
      { action: "approve_return", amount: "25", message: "Bring it back." },
      "staff@example.com",
      at,
    );
  assert.equal(next.status, "approved_return");
  assert.equal(next.approvedAmount, 2500);
  assert.equal(next.returnBy, "2026-11-11");
  assert.equal(next.version, 2);
  assert.equal(original.events.length, 0);
  assert.equal(next.events[0].actor, "staff@example.com");
  assert.throws(
    () =>
      transition(
        original,
        { action: "approve_keep", amount: "50.01", message: "Test" },
        "staff",
        at,
      ),
    /item price/,
  );
});
test("credit requires approval, physical return confirmation, and transaction reference", () => {
  const payload = {
    action: "credit",
    message: "Credit processed.",
    creditMethod: "next_order_discount",
    creditReference: "Square-123",
    received: true,
  };
  assert.throws(() => transition(claim(), payload, "staff", at), /Approval/);
  const approved = transition(
    claim(),
    { action: "approve_return", amount: "50", message: "Return it." },
    "staff",
    at,
  );
  assert.throws(
    () => transition(approved, { ...payload, received: false }, "staff", at),
    /returned/,
  );
  assert.throws(
    () =>
      transition(approved, { ...payload, creditReference: "" }, "staff", at),
    /reference/,
  );
  assert.equal(transition(approved, payload, "staff", at).status, "credited");
});
test("expired returns need an extension before staff can record credit", () => {
  const approved = transition(
    claim(),
    { action: "approve_return", amount: "50", message: "Return it." },
    "staff",
    at,
  );
  const later = new Date("2026-11-12T15:00:00Z");
  const payload = {
    action: "credit",
    message: "Done",
    creditMethod: "in_store_credit",
    creditReference: "123",
    received: true,
  };
  assert.throws(
    () => transition(approved, payload, "staff", later),
    /deadline/,
  );
  const extended = transition(
    approved,
    {
      action: "extend",
      returnBy: "2026-11-14",
      message: "Extension approved.",
    },
    "staff",
    later,
  );
  assert.equal(
    transition(extended, payload, "staff", later).status,
    "credited",
  );
});
test("required destruction evidence blocks credit until staff accepts it", () => {
  const approved = transition(
    claim(),
    {
      action: "approve_destroy",
      amount: "50",
      message: "Dispose as instructed.",
      requireEvidence: true,
    },
    "staff",
    at,
  );
  assert.equal(approved.status, "awaiting_destruction");
  const payload = {
    action: "credit",
    message: "Done",
    creditMethod: "in_store_credit",
    creditReference: "123",
  };
  assert.throws(() => transition(approved, payload, "staff", at), /Approval/);
  assert.throws(
    () =>
      transition(
        approved,
        { action: "accept_evidence", message: "Accepted" },
        "staff",
        at,
      ),
    /submitted first/,
  );
  const accepted = transition(
    { ...approved, status: "destruction_review" },
    { action: "accept_evidence", message: "Evidence accepted." },
    "staff",
    at,
  );
  assert.equal(transition(accepted, payload, "staff", at).status, "credited");
});
test("keep and disposal without evidence can proceed to manual credit; credited claims cannot be credited again", () => {
  for (const action of ["approve_keep", "approve_destroy"]) {
    const approved = transition(
      claim(),
      { action, amount: "50", message: "Approved.", requireEvidence: false },
      "staff",
      at,
    );
    const credited = transition(
      approved,
      {
        action: "credit",
        creditMethod: "in_store_credit",
        creditReference: "123",
        message: "Done.",
      },
      "staff",
      at,
    );
    assert.throws(
      () =>
        transition(
          credited,
          { action: "credit", message: "Again" },
          "staff",
          at,
        ),
      /already closed/,
    );
  }
});
test("staff-only notes are marked private and do not change the claim status", () => {
  const next = transition(
    claim(),
    { action: "note", message: "Internal review note." },
    "staff",
    at,
  );
  assert.equal(next.status, "submitted");
  assert.equal(next.events[0].internal, true);
});
