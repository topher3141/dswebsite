"use client";
import Script from "next/script";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import {
  Claim,
  money,
  reference,
  STATUS_LABELS,
} from "../../lib/returns/policy";
const VerificationContext = createContext({ ready: false, failed: false });

export function VerificationProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  return (
    <VerificationContext.Provider value={{ ready, failed }}>
      <Script
        id="returns-turnstile"
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        onReady={() => { setReady(true); setFailed(false); }}
        onError={() => setFailed(true)}
      />
      {children}
    </VerificationContext.Provider>
  );
}

export function Turnstile({
  onToken,
  reset,
}: {
  onToken: (token: string) => void;
  reset: number;
}) {
  const container = useRef<HTMLDivElement>(null),
    widget = useRef<string | null>(null),
    callback = useRef(onToken);
  const { ready, failed } = useContext(VerificationContext);
  const [status, setStatus] = useState("Loading verification…");
  const [retry, setRetry] = useState(0);
  const [canRetry, setCanRetry] = useState(false);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  callback.current = onToken;
  useEffect(() => {
    const api = (window as any).turnstile;
    if (!ready || !api || !container.current || !siteKey) return;
    callback.current("");
    setStatus("Complete the verification below to continue.");
    setCanRetry(false);
    const interrupted = (message: string) => {
      callback.current("");
      setStatus(message);
      setCanRetry(true);
    };
    try {
      widget.current = api.render(container.current, {
        sitekey: siteKey,
        callback: (t: string) => {
          callback.current(t);
          setStatus("Verification complete.");
          setCanRetry(false);
        },
        "expired-callback": () => interrupted("Verification expired. Please try again."),
        "error-callback": () => interrupted("Verification could not finish. Please try again."),
        "timeout-callback": () => interrupted("Verification timed out. Please try again."),
      });
    } catch {
      interrupted("Verification could not load. Please try again.");
    }
    return () => {
      if (widget.current !== null) api.remove(widget.current);
      widget.current = null;
    };
  }, [ready, siteKey, reset, retry]);
  return (
    <>
      <div className="rp-token" ref={container} />
      {!siteKey ? (
        <p className="rp-notice warning">
          This portal is being configured. Bot verification is not available yet.
        </p>
      ) : failed ? (
        <p className="rp-notice warning" role="alert">
          Verification could not load. Refresh the page to try again.
        </p>
      ) : (
        <>
          <p className="rp-help" role="status">{status}</p>
          {canRetry && (
            <button type="button" className="rp-button secondary" onClick={() => setRetry((v) => v + 1)}>
              Retry verification
            </button>
          )}
        </>
      )}
    </>
  );
}
export async function api(path: string, init: RequestInit = {}, token = "") {
  const r = await fetch("/api/returns/" + path, {
    ...init,
    cache: "no-store",
    headers: {
      ...(token ? { Authorization: "Bearer " + token } : {}),
      ...init.headers,
    },
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || "Unable to complete this request.");
  return data;
}
export const post = (path: string, value: unknown) =>
  api(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(value),
  });
export function FileList({
  claim,
  token = "",
  staff = false,
}: {
  claim: Claim;
  token?: string;
  staff?: boolean;
}) {
  const [error, setError] = useState("");
  async function download(index: number) {
    try {
      setError("");
      const r = await fetch(
        `/api/returns/${staff ? "admin/" : ""}claims/${claim.id}/files/${index}`,
        { headers: token ? { Authorization: "Bearer " + token } : {} },
      );
      if (!r.ok)
        throw new Error("Could not download the attachment. Please try again.");
      const url = URL.createObjectURL(await r.blob());
      const a = document.createElement("a");
      a.href = url;
      a.download = claim.attachments[index].name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <>
      <div className="rp-files">
        {claim.attachments.map((f, i) => (
          <button type="button" key={i} onClick={() => download(i)}>
            {f.purpose === "receipt"
              ? "Receipt"
              : f.purpose === "item"
                ? "Item photo"
                : "Evidence"}{" "}
            · {f.name}
          </button>
        ))}
      </div>
      {error && <p role="alert">{error}</p>}
    </>
  );
}
export function History({ claim }: { claim: Claim }) {
  return (
    <div className="rp-history">
      {claim.events.map((event, i) => (
        <div
          className={"rp-event" + (event.internal ? " internal" : "")}
          key={i}
        >
          <small>
            {new Date(event.at).toLocaleString("en-US", {
              timeZone: "America/New_York",
            })}{" "}
            ET · {event.actor}
            {event.internal ? " · Staff only" : ""}
          </small>
          {event.text}
        </div>
      ))}
    </div>
  );
}
export function ClaimDetails({
  claim,
  staff = false,
}: {
  claim: Claim;
  staff?: boolean;
}) {
  return (
    <>
      <p className="rp-eyebrow">{reference(claim.id)}</p>
      <h2>{claim.itemName}</h2>
      <span className="rp-status">{STATUS_LABELS[claim.status]}</span>
      {claim.late && (
        <p className="rp-notice warning">
          Submitted outside the 7-day period.
          <br />
          <strong>Exception reason:</strong> {claim.exceptionReason}
        </p>
      )}
      <dl className="rp-detail-grid rp-field">
        <div>
          <dt>Item price before tax</dt>
          <dd>{money(claim.itemPrice)}</dd>
        </div>
        <div>
          <dt>Receipt total</dt>
          <dd>{money(claim.receiptTotal)}</dd>
        </div>
        <div>
          <dt>Receipt</dt>
          <dd>
            {claim.receiptNumber} · {claim.receiptDate}
          </dd>
        </div>
        <div>
          <dt>Eligibility date</dt>
          <dd>
            {claim.purchaseType === "online"
              ? "Online prepaid · pickup " + claim.pickupDate
              : "In person · paid " + claim.receiptDate}
          </dd>
        </div>
        {claim.approvedAmount !== undefined && (
          <div>
            <dt>Approved before tax</dt>
            <dd>
              <strong>{money(claim.approvedAmount)}</strong>
            </dd>
          </div>
        )}
        {claim.returnBy && (
          <div>
            <dt>Return by</dt>
            <dd>
              <strong>{claim.returnBy}</strong> (Eastern time)
            </dd>
          </div>
        )}
        {staff && (
          <>
            <div>
              <dt>Customer</dt>
              <dd>
                {claim.name}
                <br />
                {claim.email}
                <br />
                {claim.phone}
              </dd>
            </div>
            <div>
              <dt>Square match</dt>
              <dd>
                {claim.square
                  ? `${claim.square.product} · payment ${claim.square.paymentDate}`
                  : "Manual verification needed"}
              </dd>
            </div>
          </>
        )}
        {claim.status === "credited" && (
          <div>
            <dt>Credit recorded</dt>
            <dd>
              {claim.creditMethod === "next_order_discount"
                ? "Discount on next order"
                : "In-store credit"}{" "}
              · {claim.creditReference}
            </dd>
          </div>
        )}
      </dl>
      <h3>
        {claim.issue === "defective"
          ? "Defective item"
          : "Item not as described"}
      </h3>
      <p className="rp-pre">{claim.description}</p>
      {staff && claim.square && (
        <>
          <h3>Square receipt itemization</h3>
          <ul className="rp-small">
            {claim.square.items.map((i) => (
              <li key={i.uid}>
                {i.uid === claim.square?.selectedUid ? "Selected: " : ""}
                {i.name} · Qty {i.quantity} · {money(i.netAmount)} before tax
                for the line
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
