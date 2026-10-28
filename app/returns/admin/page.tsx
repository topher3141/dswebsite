"use client";
import { useEffect, useState } from "react";
import {
  Claim,
  money,
  reference,
  STATUS_LABELS,
  Status,
  today,
} from "../../../lib/returns/policy";
import {
  api,
  post,
  Turnstile,
  ClaimDetails,
  FileList,
  History,
} from "../shared";
export default function AdminPage() {
  const [email, setEmail] = useState(""),
    [loginLink, setLoginLink] = useState(""),
    [authChecked, setAuthChecked] = useState(false);
  const [token, setToken] = useState(""),
    [reset, setReset] = useState(0),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const [claims, setClaims] = useState<Claim[]>([]),
    [claim, setClaim] = useState<Claim | null>(null),
    [offset, setOffset] = useState(0),
    [hasMore, setHasMore] = useState(false);
  const [filter, setFilter] = useState("open"),
    [search, setSearch] = useState(""),
    [tab, setTab] = useState("claims");
  const [adminList, setAdminList] = useState<
      { email: string; active: boolean }[]
    >([]),
    [mail, setMail] = useState({ pending: 0, failed: 0 });
  useEffect(() => {
    const link = new URLSearchParams(location.hash.slice(1)).get("login") || "";
    if (link) {
      setLoginLink(link);
      history.replaceState(null, "", location.pathname);
    }
    api("admin/me")
      .then((r) => setEmail(r.email))
      .catch(() => {})
      .finally(() => setAuthChecked(true));
  }, []);
  async function refresh() {
    const [list, team, outbox] = await Promise.all([
      api("admin/claims"),
      api("admin/admins"),
      api("admin/mail"),
    ]);
    setClaims(list.claims);
    setOffset(list.claims.length);
    setHasMore(list.hasMore);
    setAdminList(team.admins);
    setMail(outbox);
  }
  const [squareConnection, setSquareConnection] = useState<any>(null);
  useEffect(() => {
    if (!email) return;
    refresh().catch((e) => setError(e.message));
    const id = new URLSearchParams(location.search).get("claim");
    if (id && /^[a-f0-9-]{36}$/.test(id))
      api("admin/claims/" + id).then((r) => setClaim(r.claim)).catch((e) => setError(e.message));
  }, [email]);
  async function run(fn: () => Promise<void>) {
    setError("");
    setNotice("");
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function requestLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const values = Object.fromEntries(new FormData(e.currentTarget));
    await run(async () => {
      const r = await post("login", { ...values, turnstile: token });
      setNotice(r.message);
    });
    setToken("");
    setReset((n) => n + 1);
  }
  async function verifyLogin() {
    await run(async () => {
      const r = await post("login/verify", { token: loginLink });
      setEmail(r.email);
      setLoginLink("");
    });
  }
  async function select(id: string) {
    await run(async () => {
      setClaim((await api("admin/claims/" + id)).claim);
    });
  }
  async function addAdmin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget,
      newEmail = new FormData(form).get("email");
    await run(async () => {
      setAdminList(
        (await post("admin/admins", { email: newEmail, active: true })).admins,
      );
      form.reset();
      setNotice(
        "Admin added. They can sign in by email and will receive future claim alerts.",
      );
    });
  }
  if (!authChecked)
    return (
      <main className="rp-wrap">
        <p role="status">Checking staff access…</p>
      </main>
    );
  if (!email)
    return (
      <main className="rp-wrap" style={{ maxWidth: 550 }}>
        <p className="rp-eyebrow">Staff only</p>
        <h1>Returns desk</h1>
        <p className="rp-intro">
          Review requests, guide customers, and record store credit.
        </p>
        <section className="rp-card">
          {loginLink ? (
            <>
              <h2>Complete sign-in</h2>
              <p>
                Use this one-time link to open your staff dashboard. Links
                expire after 15 minutes.
              </p>
              <button
                className="rp-button"
                disabled={busy}
                onClick={verifyLogin}
              >
                {busy ? "Signing in…" : "Sign in securely →"}
              </button>
              <button
                className="rp-button secondary rp-field"
                onClick={() => setLoginLink("")}
              >
                Request a new link
              </button>
            </>
          ) : (
            <form onSubmit={requestLogin}>
              <label>
                Admin email
                <input
                  type="email"
                  name="email"
                  required
                  autoComplete="email"
                />
              </label>
              <Turnstile onToken={setToken} reset={reset} />
              <button className="rp-button" disabled={busy || !token}>
                {busy ? "Sending…" : "Email me a sign-in link →"}
              </button>
              <p className="rp-small rp-field">
                Access is limited to active admins. Sessions last 8 hours.
              </p>
            </form>
          )}
          {error && (
            <p className="rp-notice error" role="alert">
              {error}
            </p>
          )}
          {notice && (
            <p className="rp-notice" role="status">
              {notice}
            </p>
          )}
        </section>
      </main>
    );
  const filtered = claims.filter(
    (c) =>
      (filter === "all" || filter === "late"
        ? filter !== "late" || c.late
        : filter === "open"
          ? !["credited", "denied"].includes(c.status)
          : c.status === filter) &&
      `${c.itemName} ${c.name} ${c.email} ${c.receiptNumber} ${reference(c.id)}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <main className="rp-wrap wide">
      <div className="rp-toolbar">
        <div>
          <p className="rp-eyebrow">Staff dashboard</p>
          <h1>Returns desk</h1>
          <p className="rp-small">Signed in as {email}</p>
        </div>
        <div className="rp-actions">
          <button
            className="rp-button secondary"
            disabled={busy}
            onClick={() => run(refresh)}
          >
            Refresh
          </button>
          <button
            className="rp-button secondary"
            disabled={busy}
            onClick={() =>
              run(async () => {
                await post("admin/logout", {});
                setEmail("");
                setClaims([]);
                setClaim(null);
              })
            }
          >
            Sign out
          </button>
        </div>
      </div>
      <div className="rp-tabs">
        <button
          className={tab === "claims" ? "active" : ""}
          onClick={() => setTab("claims")}
        >
          Claims
        </button>
        <button
          className={tab === "team" ? "active" : ""}
          onClick={() => setTab("team")}
        >
          Admins & integrations
        </button>
      </div>
      {error && (
        <p className="rp-notice error" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="rp-notice" role="status">
          {notice}
        </p>
      )}
      {busy && (
        <p className="rp-busy" role="status">
          Working…
        </p>
      )}
      {mail.pending > 0 && (
        <p className="rp-notice warning">
          {mail.pending} email notification(s) pending
          {mail.failed
            ? `, including ${mail.failed} failed delivery attempt(s)`
            : ""}
          .{" "}
          <button type="button" onClick={() => setTab("team")}>
            <u>Manage email</u>
          </button>
        </p>
      )}
      {tab === "team" ? (
        <section className="rp-card">
          <h2>Admins & notifications</h2>
          <p className="rp-small">
            Every active admin can review claims, manage admins, and receives
            alerts for new claims, customer responses, and decisions. Removing
            access takes effect immediately.
          </p>
          {adminList.map((a) => (
            <div className="rp-admin-row" key={a.email}>
              <span>
                {a.email}
                <br />
                <small>
                  {a.active ? "Active · receives alerts" : "Inactive"}
                </small>
              </span>
              <button
                className="rp-button secondary"
                disabled={busy || a.email === email}
                onClick={() =>
                  run(async () => {
                    setAdminList(
                      (
                        await post("admin/admins", {
                          email: a.email,
                          active: !a.active,
                        })
                      ).admins,
                    );
                  })
                }
              >
                {a.active ? "Remove access" : "Restore access"}
              </button>
            </div>
          ))}
          <form className="rp-actions" onSubmit={addAdmin}>
            <label style={{ flex: 1 }}>
              Add an admin
              <input
                name="email"
                type="email"
                required
                placeholder="name@dealsandstealsmd.com"
              />
            </label>
            <button className="rp-button" disabled={busy}>
              Add admin
            </button>
          </form>
          <div className="rp-divider" />
          <h2>Square receipt lookup</h2>
          <p>Check that the connected Square account can read payments and orders for this store.</p>
          <button className="rp-button secondary" disabled={busy} onClick={() => run(async () => {
            setSquareConnection(await api("admin/square"));
          })}>
            Check Square connection
          </button>
          {squareConnection && (
            <div className="rp-notice" role="status">
              <strong>{squareConnection.connected ? "Square is connected" : "Square needs attention"}</strong>
              <p>{squareConnection.environment} · Location: {squareConnection.locationId || "Not configured"}</p>
              <ul>{squareConnection.checks.map((check: any) => (
                <li key={check.name}>{check.ok ? "✓" : "⚠"} {check.name}: {check.message}</li>
              ))}</ul>
            </div>
          )}
          <div className="rp-divider" />
          <h2>Email delivery</h2>
          <p>
            {mail.pending} pending notifications. {mail.failed} have a failed
            attempt.
          </p>
          <button
            className="rp-button secondary"
            disabled={busy}
            onClick={() =>
              run(async () => {
                const r = await post("admin/retry-mail", {});
                setMail(await api("admin/mail"));
                setNotice(
                  r.failed
                    ? "Some notifications still could not be sent. Check the email service configuration."
                    : "Queued notifications processed.",
                );
              })
            }
          >
            Retry queued email
          </button>
        </section>
      ) : (
        <div className="rp-queue">
          <aside>
            <label>
              Search loaded claims
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Name, receipt, item, claim…"
              />
            </label>
            <label className="rp-field">
              Show
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="open">Open claims</option>
                <option value="all">All claims</option>
                <option value="late">Late / exception requests</option>
                {Object.entries(STATUS_LABELS).map(([s, label]) => (
                  <option key={s} value={s}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <p className="rp-small rp-field">
              {claims.length} loaded · newest updates first
            </p>
            <div className="rp-list">
              {filtered.map((c) => (
                <button
                  className={claim?.id === c.id ? "active" : ""}
                  key={c.id}
                  disabled={busy}
                  onClick={() => select(c.id)}
                >
                  <span className="rp-small">
                    {reference(c.id)}{" "}
                    {c.late && <span className="rp-danger"> · LATE</span>}
                  </span>
                  <strong>{c.itemName}</strong>
                  <span className="rp-small">
                    {c.name} · {money(c.itemPrice)}
                  </span>
                  <br />
                  <span className="rp-status">{STATUS_LABELS[c.status]}</span>
                </button>
              ))}
              {!filtered.length && (
                <p className="rp-empty">No matching claims.</p>
              )}
            </div>
            {hasMore && (
              <button
                className="rp-button secondary rp-field"
                disabled={busy}
                onClick={() =>
                  run(async () => {
                    const r = await api("admin/claims?offset=" + offset);
                    setClaims((prev) => {
                      const all = new Map(prev.map((c) => [c.id, c]));
                      r.claims.forEach((c: Claim) => all.set(c.id, c));
                      return [...all.values()];
                    });
                    setOffset(offset + r.claims.length);
                    setHasMore(r.hasMore);
                  })
                }
              >
                Load more claims
              </button>
            )}
          </aside>
          <div>
            {claim ? (
              <>
                <section className="rp-card" style={{ marginTop: 0 }}>
                  <ClaimDetails claim={claim} staff />
                  <h3>Attachments</h3>
                  <FileList claim={claim} staff />
                  <h3>Activity & messages</h3>
                  <History claim={claim} />
                </section>
                <ReviewForm
                  key={claim.id + ":" + claim.version}
                  claim={claim}
                  busy={busy}
                  onSubmit={(input) =>
                    run(async () => {
                      const r = await post("admin/claims/" + claim.id, {
                        ...input,
                        version: claim.version,
                      });
                      setClaim(r.claim);
                      await refresh();
                      setNotice(
                        r.emailPending
                          ? "Saved. Email notifications are queued for retry."
                          : input.action === "note"
                            ? "Staff note saved."
                            : "Saved and customer email queued.",
                      );
                    })
                  }
                />
              </>
            ) : (
              <div className="rp-card rp-empty">
                Select a claim to review its receipt, photos, and history.
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
function ReviewForm({
  claim,
  busy,
  onSubmit,
}: {
  claim: Claim;
  busy: boolean;
  onSubmit: (input: Record<string, any>) => Promise<void>;
}) {
  const [action, setAction] = useState("request_info");
  if (claim.status === "credited")
    return (
      <section className="rp-card">
        <h2>Credit recorded</h2>
        <p>
          This claim is closed. The history above records the approval and
          in-person credit reference.
        </p>
      </section>
    );
  const approval = action.startsWith("approve");
  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    onSubmit({
      ...Object.fromEntries(form),
      requireEvidence: form.has("requireEvidence"),
      received: form.has("received"),
      verified: form.has("verified"),
      allowException: form.has("allowException"),
    });
  }
  return (
    <section className="rp-card">
      <h2>Review & next steps</h2>
      <form onSubmit={submit}>
        <label>
          Action
          <select
            name="action"
            value={action}
            onChange={(e) => setAction(e.target.value)}
          >
            <option value="request_info">
              Ask customer for more information
            </option>
            <option value="approve_return">
              Approve — item must be returned
            </option>
            <option value="approve_keep">
              Approve — customer may keep item
            </option>
            <option value="approve_destroy">
              Approve — authorize disposal
            </option>
            {["awaiting_destruction", "destruction_review"].includes(
              claim.status,
            ) && (
              <option value="request_evidence">
                Request destruction evidence / clearer photos
              </option>
            )}
            {claim.status === "destruction_review" && (
              <option value="accept_evidence">
                Accept destruction evidence
              </option>
            )}
            {claim.status === "approved_return" && (
              <option value="extend">Change return deadline</option>
            )}
            {["approved_return", "approved_keep", "approved_destroy"].includes(
              claim.status,
            ) && <option value="credit">Record credit issued in person</option>}
            <option value="deny">Deny claim</option>
            <option value="note">Add staff-only note</option>
          </select>
        </label>
        {approval && (
          <>
            <label className="rp-field">
              Approved amount before tax ($)
              <input
                name="amount"
                type="number"
                required
                min="0.01"
                max={(claim.itemPrice / 100).toFixed(2)}
                step="0.01"
                defaultValue={(
                  (claim.approvedAmount ?? claim.itemPrice) / 100
                ).toFixed(2)}
              />
              <span className="rp-help">
                Partial credit is allowed. Maximum {money(claim.itemPrice)}{" "}
                before tax.
              </span>
            </label>
            <label className="rp-check">
              <input name="verified" type="checkbox" required />
              <span>
                I verified the receipt, item, purchase channel, eligibility
                date, as-is exclusion, and any prior return/credit for this
                item.
              </span>
            </label>
            {claim.late && (
              <label className="rp-check">
                <input name="allowException" type="checkbox" required />
                <span>
                  I approve an exception to the 7-day notification period for
                  the reason documented in this claim.
                </span>
              </label>
            )}
            {action === "approve_return" && (
              <p className="rp-notice">
                The customer will have 14 days from this approval to return the
                item.
              </p>
            )}
            {action === "approve_destroy" && (
              <>
                <label className="rp-check">
                  <input
                    name="requireEvidence"
                    type="checkbox"
                    defaultChecked
                  />
                  <span>
                    Require photo evidence and staff acceptance before credit
                    can be issued.
                  </span>
                </label>
                <p className="rp-small">
                  Provide clear disposal instructions below. Do not request
                  hazardous destruction.
                </p>
              </>
            )}
          </>
        )}
        {action === "extend" && (
          <label className="rp-field">
            New return deadline
            <input
              name="returnBy"
              type="date"
              min={today()}
              required
              defaultValue={claim.returnBy}
            />
          </label>
        )}
        {action === "credit" && (
          <>
            <p className="rp-notice">
              Approved amount before tax:{" "}
              <strong>{money(claim.approvedAmount)}</strong>. Record credit only
              after you have processed it in person. This action does not issue
              credit through Square.
            </p>
            {claim.status === "approved_return" && (
              <label className="rp-check">
                <input type="checkbox" name="received" required />
                <span>The customer returned the item to the store.</span>
              </label>
            )}
            <label className="rp-field">
              How was credit processed?
              <select name="creditMethod" required>
                <option value="">Choose a method</option>
                <option value="next_order_discount">
                  Amount taken off the next order
                </option>
                <option value="in_store_credit">
                  In-store credit recorded manually
                </option>
              </select>
            </label>
            <label className="rp-field">
              Square transaction / credit reference
              <input name="creditReference" required maxLength={200} />
            </label>
            <p className="rp-small">
              Use the approved amount before tax. Handle tax through the actual
              redemption method. Automated gift cards are not part of this
              portal.
            </p>
          </>
        )}
        <label className="rp-field">
          {action === "note"
            ? "Internal staff note"
            : "Message / instructions emailed to the customer"}
          <textarea
            name="message"
            required
            maxLength={4000}
            placeholder={
              action === "approve_return"
                ? "Your return is approved. Please bring the item and claim reference to the store…"
                : action === "approve_destroy"
                  ? "Describe how the item should be disposed of and the evidence required…"
                  : "Add the details the customer needs for this next step…"
            }
          />
        </label>
        <button className="rp-button rp-field" disabled={busy}>
          {busy
            ? "Saving…"
            : action === "note"
              ? "Save staff note"
              : "Save & notify customer →"}
        </button>
      </form>
    </section>
  );
}
