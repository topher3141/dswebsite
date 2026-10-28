import type { Metadata } from "next";
import "./returns.css";
import { VerificationProvider } from "./shared";
import { SiteHeader, SiteFooter } from "../SiteChrome";
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
      <SiteHeader />
      <VerificationProvider>{children}</VerificationProvider>
      <SiteFooter />
    </div>
  );
}
