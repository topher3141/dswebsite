import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Deals & Steals | Glen Burnie Discount Store",
  description: "Deals & Steals is your local Glen Burnie discount store for closeout merchandise, weekly bargains, and brand-name finds.",
  openGraph: {
    title: "Deals & Steals",
    description: "shop small, SAVE BIG.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
