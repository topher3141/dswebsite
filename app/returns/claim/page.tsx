"use client";
import { useEffect, useState } from "react";
import { Claim } from "../../../lib/returns/policy";
import { api, ClaimDetails, FileList, History } from "../shared";
export default function ClaimPage() {
  const [claim, setClaim] = useState<Claim | null>(null),
    [token, setToken] = useState(""),
    [id, setId] = useState("");
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  useEffect(() => {
    const claimId = new URLSearchParams(location.search).get("id") || "";
    const key =
      new URLSearchParams(location.hash.slice(1)).get("key") ||
      sessionStorage.getItem("ds-claim:" + claimId) ||
      "";
    if (!key || !claimId) {
      setError("Open the private claim link in your confirmation email.");
      return;
    }
    sessionStorage.setItem("ds-claim:" + claimId, key);
    history.replaceState(null, "", location.pathname + location.search);
    setToken(key);
    setId(claimId);
    api("claims/" + claimId, {}, key)
      .then((r) => setClaim(r.claim))
      .catch((e) => setError(e.message));
  }, []);
  async function respond(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    const form = e.currentTarget;
    try {
      const data = await api(
        "claims/" + id,
        { method: "POST", body: new FormData(form) },
        token,
      );
      setClaim(data.claim);
      form.reset();
      setNotice(
        "Your response has been saved. Our team will review it and email you.",
      );
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="rp-wrap">
      <p className="rp-eyebrow">Your store credit request</p>
      <h1>Claim details & updates</h1>
      <p className="rp-intro">
        Your private place to follow progress and share more information.
      </p>
      {error && (
        <p className="rp-notice error" role="alert">
          {error}
        </p>
      )}
      {!claim && !error && <p role="status">Loading your claim…</p>}
      {claim && (
        <>
          <section className="rp-card">
            <ClaimDetails claim={claim} />
            {claim.status === "approved_return" && (
              <p className="rp-notice">
                Bring the item and this claim reference to the store by the
                deadline above. Staff will process the approved credit in
                person.
              </p>
            )}
            {claim.status === "approved_keep" && (
              <p className="rp-notice">
                You may keep the item. Visit the store with your claim reference
                to have the approved credit processed.
              </p>
            )}
            {claim.status === "awaiting_destruction" && (
              <p className="rp-notice warning">
                Follow the staff disposal instructions in the updates below. Do
                not attempt anything hazardous. Upload the requested evidence
                for review before credit can be processed.
              </p>
            )}
            {claim.status === "destruction_review" && (
              <p className="rp-notice">
                Your evidence is awaiting staff review. We’ll email you with the
                next steps.
              </p>
            )}
            {claim.status === "approved_destroy" && (
              <p className="rp-notice">
                Disposal has been authorized and any required evidence review is
                complete. Follow the staff instructions below and visit the
                store to process your credit.
              </p>
            )}
            <h3>Attachments</h3>
            <FileList claim={claim} token={token} />
            <h3>Updates</h3>
            <History claim={claim} />
          </section>
          {!["credited", "denied"].includes(claim.status) && (
            <section className="rp-card">
              <h2>
                {claim.status === "awaiting_destruction"
                  ? "Send destruction evidence"
                  : "Send a message or more photos"}
              </h2>
              <form onSubmit={respond}>
                <label>
                  Message
                  <textarea name="message" required maxLength={4000} />
                </label>
                <label className="rp-field">
                  Additional photos
                  <input
                    type="file"
                    name="photos"
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    required={claim.status === "awaiting_destruction"}
                  />
                  <span className="rp-help">
                    Up to five photos per response, totaling no more than 3 MB.
                  </span>
                </label>
                {notice && (
                  <p role="status" className="rp-notice">
                    {notice}
                  </p>
                )}
                <button className="rp-button rp-field" disabled={busy}>
                  {busy ? "Sending…" : "Send to the team →"}
                </button>
              </form>
            </section>
          )}
          <button
            type="button"
            className="rp-button secondary"
            disabled={busy}
            onClick={() => {
              setError("");
              api("claims/" + id, {}, token)
                .then((r) => setClaim(r.claim))
                .catch((e) => setError(e.message));
            }}
          >
            Refresh claim
          </button>
        </>
      )}
    </main>
  );
}
