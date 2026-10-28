import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve, dirname } from "node:path";
import ts from "typescript";
import { NextRequest } from "next/server.js";
const require = createRequire(import.meta.url);
function runtime(fetcher) {
  const cache = new Map();
  const environment = {
    env: {
      RETURNS_SITE_URL: "https://www.dealsandstealsmd.com",
      RETURNS_SUPABASE_URL: "https://db.example",
      RETURNS_SUPABASE_SERVICE_ROLE_KEY: "test-service-key",
      RETURNS_LINK_SECRET: "test-link-secret",
      RETURNS_CRON_SECRET: "test-cron-secret",
      TURNSTILE_SECRET_KEY: "test-turnstile-secret",
    },
  };
  function load(file) {
    file = resolve(file);
    if (cache.has(file)) return cache.get(file).exports;
    const module = { exports: {} };
    cache.set(file, module);
    const source = ts.transpileModule(readFileSync(file, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        esModuleInterop: true,
      },
    }).outputText;
    const localRequire = (name) =>
      name === "server-only"
        ? {}
        : name.startsWith(".")
          ? load(resolve(dirname(file), name + ".ts"))
          : require(name);
    new Function("require", "exports", "module", "process", "fetch", source)(
      localRequire,
      module.exports,
      module,
      environment,
      fetcher,
    );
    return module.exports;
  }
  return { load, route: load("app/api/returns/[...path]/route.ts") };
}
const id = "00000000-0000-4000-8000-000000000001";
const claim = {
  id,
  version: 1,
  status: "submitted",
  itemName: "Test",
  itemPrice: 1000,
  late: true,
  attachments: [],
  events: [
    { text: "Public", at: "2026-10-28", actor: "Customer" },
    {
      text: "SECRET STAFF NOTE",
      internal: true,
      at: "2026-10-28",
      actor: "Staff",
    },
  ],
  square: {
    paymentId: "SECRET_PAYMENT",
    orderId: "SECRET_ORDER",
    product: "RETAIL",
    items: [],
  },
};
const response = (value) =>
  new Response(JSON.stringify(value), {
    headers: { "Content-Type": "application/json" },
  });
function fakeDatabase() {
  const calls = [];
  return {
    calls,
    fetcher: async (url, init) => {
      const u = new URL(url);
      calls.push({ url: u, init });
      if (u.pathname.endsWith("/returns_admins"))
        return response([{ email: "chris@dealsandstealsmd.com" }]);
      if (u.pathname.endsWith("/returns_sessions"))
        return response([{ email: "chris@dealsandstealsmd.com" }]);
      if (u.pathname.endsWith("/returns_claims")) {
        const expected = require("node:crypto")
          .createHash("sha256")
          .update("valid-customer-key")
          .digest("hex");
        if (
          u.searchParams.has("token_hash") &&
          u.searchParams.get("token_hash") !== "eq." + expected
        )
          return response([]);
        return response([{ data: structuredClone(claim) }]);
      }
      throw new Error("Unexpected external call: " + u.pathname);
    },
  };
}
const context = (path) => ({ params: Promise.resolve({ path }) });
test("customer bearer authorization rejects missing/wrong keys and protects private events/payment identifiers", async () => {
  const mock = fakeDatabase(),
    app = runtime(mock.fetcher);
  for (const key of ["", "wrong-key"]) {
    const req = new NextRequest(
      "https://www.dealsandstealsmd.com/api/returns/claims/" + id,
      { headers: { Authorization: "Bearer " + key } },
    );
    assert.equal(
      (await app.route.GET(req, context(["claims", id]))).status,
      404,
    );
  }
  const req = new NextRequest(
    "https://www.dealsandstealsmd.com/api/returns/claims/" + id,
    { headers: { Authorization: "Bearer valid-customer-key" } },
  );
  const r = await app.route.GET(req, context(["claims", id])),
    text = await r.text();
  assert.equal(r.status, 200);
  assert.match(text, /Public/);
  for (const secret of ["SECRET STAFF NOTE", "SECRET_PAYMENT", "SECRET_ORDER"])
    assert.equal(text.includes(secret), false);
  assert.equal(r.headers.get("cache-control"), "no-store");
});
test("anonymous staff endpoints and file downloads deny access before touching the database", async () => {
  const mock = fakeDatabase(),
    app = runtime(mock.fetcher);
  for (const path of [
    ["admin", "claims"],
    ["admin", "admins"],
    ["admin", "claims", id, "files", "0"],
  ]) {
    const req = new NextRequest(
      "https://www.dealsandstealsmd.com/api/returns/" + path.join("/"),
    );
    assert.equal((await app.route.GET(req, context(path))).status, 401);
  }
  assert.equal(mock.calls.length, 0);
});
test("cross-origin mutation is rejected before any state changes", async () => {
  const mock = fakeDatabase(),
    app = runtime(mock.fetcher);
  const req = new NextRequest(
    "https://www.dealsandstealsmd.com/api/returns/admin/admins",
    {
      method: "POST",
      headers: {
        origin: "https://attacker.example",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: "attacker@example.com" }),
    },
  );
  assert.equal(
    (await app.route.POST(req, context(["admin", "admins"]))).status,
    403,
  );
  assert.equal(mock.calls.length, 0);
});
test("staff approval cannot bypass late exception or purchase verification checks", async () => {
  for (const extra of [{}, { allowException: true }]) {
    const mock = fakeDatabase(),
      app = runtime(mock.fetcher);
    const req = new NextRequest(
      "https://www.dealsandstealsmd.com/api/returns/admin/claims/" + id,
      {
        method: "POST",
        headers: {
          origin: "https://www.dealsandstealsmd.com",
          cookie: "ds_returns_session=test",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          version: 1,
          action: "approve_keep",
          amount: "10",
          message: "Approved",
          ...extra,
        }),
      },
    );
    const r = await app.route.POST(req, context(["admin", "claims", id]));
    assert.equal(r.status, 400);
    assert.match(
      (await r.json()).error,
      extra.allowException ? /verified/ : /late exception/,
    );
    assert.equal(
      mock.calls.some((c) => c.init?.method === "POST"),
      false,
    );
  }
});
test("stale reviewer cannot overwrite a newer decision", async () => {
  const mock = fakeDatabase(),
    app = runtime(mock.fetcher);
  const req = new NextRequest(
    "https://www.dealsandstealsmd.com/api/returns/admin/claims/" + id,
    {
      method: "POST",
      headers: {
        origin: "https://www.dealsandstealsmd.com",
        cookie: "ds_returns_session=test",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ version: 0, action: "deny", message: "No" }),
    },
  );
  assert.equal(
    (await app.route.POST(req, context(["admin", "claims", id]))).status,
    409,
  );
});
test("removed admins cannot use an existing session", async () => {
  const mock = fakeDatabase(),
    app = runtime(async (url, init) =>
      new URL(url).pathname.endsWith("/returns_admins")
        ? response([])
        : mock.fetcher(url, init),
    );
  const req = new NextRequest(
    "https://www.dealsandstealsmd.com/api/returns/admin/me",
    { headers: { cookie: "ds_returns_session=old-session" } },
  );
  assert.equal(
    (await app.route.GET(req, context(["admin", "me"]))).status,
    401,
  );
});
test("receipt proofs reject tampering, expiration and changed receipt fields", () => {
  const app = runtime(async () => {
    throw new Error("No network expected.");
  });
  const square = app.load("lib/returns/square.ts");
  const fields = {
    receiptDate: "2026-10-28",
    receiptNumber: "ABC",
    receiptTotal: 1060,
    match: { paymentId: "p", items: [] },
  };
  const proof = square.signLookup(fields);
  assert.equal(
    square.readLookup(proof, fields.receiptDate, "abc", 1060).paymentId,
    "p",
  );
  assert.equal(
    square.readLookup(proof, fields.receiptDate, "abc", 1000),
    undefined,
  );
  assert.equal(
    square.readLookup(proof + "0", fields.receiptDate, "abc", 1060),
    undefined,
  );
  assert.equal(square.readLookup(proof, "2026-10-27", "abc", 1060), undefined);
  const expired = Buffer.from(
    JSON.stringify({ ...fields, expires: Date.now() - 1000 }),
  ).toString("base64url");
  const signature = require("node:crypto")
    .createHmac("sha256", "test-service-key")
    .update(expired)
    .digest("hex");
  assert.equal(
    square.readLookup(
      expired + "." + signature,
      fields.receiptDate,
      "abc",
      1060,
    ),
    undefined,
  );
});

test("matched receipts can submit without an upload, while missing or invalid matches require one", async () => {
  for (const matched of [true, false, "tampered"]) {
    let saved;
    const app = runtime(async (url, init) => {
      const u = new URL(url);
      if (u.hostname === "challenges.cloudflare.com")
        return response({ success: true });
      if (u.pathname.endsWith("/rpc/returns_rate_limit")) return response(true);
      if (u.pathname.endsWith("/returns_claims")) return response([]);
      if (u.pathname.endsWith("/returns_admins"))
        return response([{ email: "chris@dealsandstealsmd.com" }]);
      if (u.pathname.includes("/storage/v1/object/")) return response({});
      if (u.pathname.endsWith("/rpc/returns_save_claim")) {
        saved = JSON.parse(init.body);
        return response(true);
      }
      if (u.pathname.endsWith("/returns_outbox")) return response([]);
      throw new Error("Unexpected call: " + u.pathname);
    });
    const date = app.load("lib/returns/policy.ts").today();
    const square = app.load("lib/returns/square.ts");
    const input = {
      id,
      requestKey: "a".repeat(64),
      turnstile: "test",
      name: "Customer",
      email: "customer@example.com",
      phone: "555-555-0100",
      purchaseType: "pos",
      receiptDate: date,
      receiptNumber: "AB12",
      receiptTotal: "10.60",
      itemPrice: "10.00",
      itemName: "Test item",
      issue: "defective",
      description: "Broken item",
      asIs: "no",
      consent: "yes",
    };
    if (matched)
      input.proof =
        square.signLookup({
          receiptDate: date,
          receiptNumber: "AB12",
          receiptTotal: 1060,
          match: {
            paymentId: "test-payment",
            orderId: "test-order",
            paymentDate: date,
            product: "RETAIL",
            items: [],
          },
        }) + (matched === "tampered" ? "0" : "");
    const form = new FormData();
    form.set("payload", JSON.stringify(input));
    form.append(
      "photos",
      new File(
        [new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0])],
        "item.png",
        { type: "image/png" },
      ),
    );
    const req = new NextRequest(
      "https://www.dealsandstealsmd.com/api/returns/claims",
      {
        method: "POST",
        headers: { origin: "https://www.dealsandstealsmd.com" },
        body: form,
      },
    );
    const r = await app.route.POST(req, context(["claims"]));
    if (matched === true) {
      assert.equal(r.status, 201, await r.text());
      assert.equal(saved.p_data.square.paymentId, "test-payment");
      assert.deepEqual(
        saved.p_data.attachments.map((a) => a.purpose),
        ["item"],
      );
    } else {
      assert.equal(r.status, 400);
      assert.match((await r.json()).error, /receipt photo or PDF/);
      assert.equal(saved, undefined);
    }
  }
});
