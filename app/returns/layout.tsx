import type { Metadata } from "next";
import "./returns.css";
export const metadata: Metadata = {
  title: "Returns & Store Credit | Deals & Steals",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};
export default function ReturnsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="returns-portal">
      <header className="rp-header">
        <a className="rp-brand" href="/">
          Deals <span>&</span> Steals<small>shop small. SAVE BIG.</small>
        </a>
        <a className="rp-back" href="/">
          ← Back to the store
        </a>
      </header>
      {children}
      <footer className="rp-footer">
        Deals & Steals · 510 McCormick Drive, Suite B · Glen Burnie, MD 21061
        <br />
        <a href="/returns">Request store credit</a> ·{" "}
        <a href="/returns/admin">Staff sign-in</a>
      </footer>
    </div>
  );
}
