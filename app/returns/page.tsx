"use client";
import { useRef, useState } from "react";
import { isLate, POLICY, today } from "../../lib/returns/policy";
import { api, post, Turnstile } from "./shared";
export default function ReturnsPage() {
  const [type, setType] = useState<"pos" | "online">("pos"),
    [receiptDate, setReceiptDate] = useState(""),
    [pickupDate, setPickupDate] = useState("");
  const [receiptNumber, setReceiptNumber] = useState(""),
    [receiptTotal, setReceiptTotal] = useState("");
  const [match, setMatch] = useState<any>(null),
    [selected, setSelected] = useState(""),
    [asIs, setAsIs] = useState("");
  const [lookupToken, setLookupToken] = useState(""),
    [lookupReset, setLookupReset] = useState(0);
  const [token, setToken] = useState(""),
    [reset, setReset] = useState(0),
    [busy, setBusy] = useState(""),
    [error, setError] = useState(""),
    [result, setResult] = useState<any>(null);
  const form = useRef<HTMLFormElement>(null),
    submission = useRef<{ id: string; requestKey: string } | null>(null);
  let late = false;
  try {
    if (receiptDate && (type === "pos" || pickupDate))
      late = isLate(type, receiptDate, pickupDate);
  } catch {
    /* incomplete date */
  }
  function changeReceipt() {
    setMatch(null);
    setSelected("");
  }
  async function findReceipt() {
    if (!receiptDate || !receiptNumber || !receiptTotal) {
      setError("Enter the receipt date, number, and total first.");
      return;
    }
    setBusy("lookup");
    setError("");
    try {
      const found = await post("lookup", {
        receiptDate,
        receiptNumber,
        receiptTotal,
        turnstile: lookupToken,
      });
      setMatch(found);
      if (
        found.proof &&
        ["SQUARE_POS", "RETAIL", "RESTAURANTS", "TERMINAL_API"].includes(
          found.product,
        )
      )
        setType("pos");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
      setLookupToken("");
      setLookupReset((v) => v + 1);
    }
  }
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setBusy("submit");
    try {
      if (!submission.current)
        submission.current = {
          id: crypto.randomUUID(),
          requestKey: Array.from(
            crypto.getRandomValues(new Uint8Array(32)),
            (b) => b.toString(16).padStart(2, "0"),
          ).join(""),
        };
      const values = new FormData(e.currentTarget),
        payload = Object.fromEntries(values.entries());
      const data = new FormData();
      data.set(
        "payload",
        JSON.stringify({
          ...payload,
          ...submission.current,
          turnstile: token,
          proof: match?.proof,
          selectedUid: selected,
        }),
      );
      const receipt = values.get("receipt");
      if (receipt instanceof File) data.set("receipt", receipt);
      for (const file of values.getAll("photos"))
        if (file instanceof File) data.append("photos", file);
      setResult(await api("claims", { method: "POST", body: data }));
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy("");
      setToken("");
      setReset((v) => v + 1);
    }
  }
  if (result)
    return (
      <main className="rp-wrap">
        <div className="rp-card">
          <p className="rp-eyebrow">Claim received</p>
          <h1>We’ll take a look.</h1>
          <p>
            Your request has been saved. Our team will review it and send the
            next steps by email.
          </p>
          <p className="rp-notice">
            Please wait for approval before bringing the item back or disposing
            of it. Credit will be processed in person.
          </p>
          {result.emailPending && (
            <p className="rp-notice warning">
              Your confirmation email is queued. Save the claim link below so
              you can check its progress.
            </p>
          )}
          <a
            className="rp-button"
            href={`/returns/claim?id=${result.id}#key=${result.key}`}
          >
            View your claim →
          </a>
          <p className="rp-small rp-field">
            Keep your claim link private. Submit a separate claim for each
            additional item.
          </p>
          <a className="rp-back" href="/returns">
            Request credit for another item
          </a>
        </div>
      </main>
    );
  return (
    <main className="rp-wrap">
      <p className="rp-eyebrow">Customer care</p>
      <h1>
        A problem with your find?
        <br />
        Let’s take a look.
      </h1>
      <p className="rp-intro">
        Request store credit for an item that is defective or wasn’t as
        described. One item per claim.
      </p>
      <div className="rp-pills">
        <span className="rp-pill">Notify us within 7 days</span>
        <span className="rp-pill">Approval before return</span>
        <span className="rp-pill">Updates by email</span>
      </div>
      <details className="rp-notice">
        <summary>
          <strong>Our return policy</strong>
        </summary>
        <p>{POLICY}</p>
        <p>
          Online prepaid purchases: the clock starts on pickup. In-person
          purchases: it starts on the payment date. Late requests may be
          considered as an exception.
        </p>
      </details>
      <form ref={form} onSubmit={submit}>
        <section className="rp-card">
          <div className="rp-section-title">
            <span className="rp-number">01</span>
            <h2>Find your purchase</h2>
          </div>
          <label>
            How did you pay?
            <select
              name="purchaseType"
              value={type}
              onChange={(e) => setType(e.target.value as any)}
            >
              <option value="pos">Paid in person at the store</option>
              <option value="online">Prepaid online, then picked up</option>
            </select>
          </label>
          <div className="rp-grid rp-field">
            <label>
              Receipt / payment date
              <input
                name="receiptDate"
                type="date"
                required
                max={today()}
                value={receiptDate}
                onChange={(e) => {
                  setReceiptDate(e.target.value);
                  changeReceipt();
                }}
              />
            </label>
            {type === "online" && (
              <label>
                Date you picked up the item
                <input
                  name="pickupDate"
                  type="date"
                  required
                  min={receiptDate}
                  max={today()}
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                />
                <span className="rp-help">
                  Your 7-day notification period starts on this date.
                </span>
              </label>
            )}
            <label>
              Receipt number
              <input
                name="receiptNumber"
                required
                maxLength={80}
                value={receiptNumber}
                onChange={(e) => {
                  setReceiptNumber(e.target.value);
                  changeReceipt();
                }}
                autoCapitalize="characters"
              />
            </label>
            <label>
              Receipt total ($)
              <input
                name="receiptTotal"
                type="number"
                required
                min="0.01"
                step="0.01"
                value={receiptTotal}
                onChange={(e) => {
                  setReceiptTotal(e.target.value);
                  changeReceipt();
                }}
              />
              <span className="rp-help">
                The final total on the receipt, including tax.
              </span>
            </label>
          </div>
          <Turnstile onToken={setLookupToken} reset={lookupReset} />
          <div className="rp-actions">
            <button
              type="button"
              className="rp-button secondary"
              disabled={!!busy || !lookupToken}
              onClick={findReceipt}
            >
              {busy === "lookup"
                ? "Looking up receipt…"
                : "Look up my Square receipt"}
            </button>
            <span className="rp-help">
              Optional. You can submit for manual review.
            </span>
          </div>
          {match && (
            <p className="rp-notice">
              {match.proof
                ? "Receipt matched. Select your item below, or describe it if the receipt uses a generic name."
                : match.notice}
            </p>
          )}
          {late && (
            <div className="rp-notice warning">
              <strong>This is outside our 7-day notification period.</strong>
              <p>
                You can still request an exception. Approval is at the store’s
                discretion.
              </p>
              <label>
                Why should we consider an exception?
                <textarea name="exceptionReason" required maxLength={2000} />
              </label>
            </div>
          )}
        </section>
        <section className="rp-card">
          <div className="rp-section-title">
            <span className="rp-number">02</span>
            <h2>Tell us about the item</h2>
          </div>
          {match?.items?.length > 0 && (
            <label>
              Item shown on the receipt
              <select
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
              >
                <option value="">
                  Choose an item, or enter details manually
                </option>
                {match.items.map((i: any) => (
                  <option key={i.uid} value={i.uid}>
                    {i.name} · Qty {i.quantity}
                  </option>
                ))}
              </select>
              <span className="rp-help">
                Generic receipt entries are okay. Enter the actual item name and
                the amount paid for one item below.
              </span>
            </label>
          )}
          <div className="rp-grid rp-field">
            <label>
              Actual item name
              <input
                name="itemName"
                required
                maxLength={200}
                placeholder="e.g. Black & Decker coffee maker"
              />
            </label>
            <label>
              Price paid for this item, before tax ($)
              <input
                name="itemPrice"
                type="number"
                required
                min="0.01"
                step="0.01"
              />
              <span className="rp-help">
                Use the amount after any discounts. One item per claim.
              </span>
            </label>
          </div>
          <label className="rp-field">
            Was this item sold “as is”?
            <select
              name="asIs"
              required
              value={asIs}
              onChange={(e) => setAsIs(e.target.value)}
            >
              <option value="">Choose an answer</option>
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </label>
          {asIs === "yes" && (
            <p className="rp-notice warning">
              Items sold as is are excluded and cannot be submitted through this
              portal.
            </p>
          )}
          <label className="rp-field">
            What’s the issue?
            <select name="issue" required>
              <option value="">Choose a reason</option>
              <option value="defective">
                The item is defective / doesn’t work
              </option>
              <option value="not_as_described">
                The item is not as described
              </option>
            </select>
          </label>
          <label className="rp-field">
            Describe the problem
            <textarea
              name="description"
              required
              maxLength={4000}
              placeholder="Tell us what is wrong and what you expected. Include any troubleshooting you tried."
            />
          </label>
          <div className="rp-grid rp-field">
            <label>
              Receipt photo or PDF
              <input
                name="receipt"
                type="file"
                required
                accept="image/jpeg,image/png,image/webp,application/pdf"
              />
            </label>
            <label>
              Photos of the item and problem
              <input
                name="photos"
                type="file"
                multiple
                required
                accept="image/jpeg,image/png,image/webp"
              />
            </label>
          </div>
          <p className="rp-help rp-field">
            Up to five files total, combined size no more than 3 MB. JPG, PNG,
            WebP; PDF accepted for the receipt. Use smaller photos if needed.
          </p>
        </section>
        <section className="rp-card">
          <div className="rp-section-title">
            <span className="rp-number">03</span>
            <h2>How can we reach you?</h2>
          </div>
          <label>
            Your name
            <input name="name" autoComplete="name" required maxLength={120} />
          </label>
          <div className="rp-grid rp-field">
            <label>
              Email address
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={200}
              />
              <span className="rp-help">
                All claim updates will be sent here.
              </span>
            </label>
            <label>
              Phone number
              <input
                name="phone"
                type="tel"
                autoComplete="tel"
                required
                maxLength={40}
              />
              <span className="rp-help">
                For matching your purchase; updates use email.
              </span>
            </label>
          </div>
          <label className="rp-check">
            <input type="checkbox" name="consent" value="yes" required />
            <span>
              I confirm these details are accurate, the item was not sold as is,
              and I understand this is a request for store credit subject to
              review. I will wait for instructions before returning or disposing
              of the item.
            </span>
          </label>
          <Turnstile onToken={setToken} reset={reset} />
          <p className="rp-help">Complete verification to submit your claim.</p>
          {error && (
            <p className="rp-notice error" role="alert">
              {error}
            </p>
          )}
          <div className="rp-actions">
            <button
              className="rp-button pink"
              disabled={!!busy || !token || asIs === "yes"}
            >
              {busy === "submit"
                ? "Submitting your claim…"
                : "Submit credit request →"}
            </button>
            <span className="rp-help">
              We’ll email a private link to your claim.
            </span>
          </div>
        </section>
      </form>
    </main>
  );
}
