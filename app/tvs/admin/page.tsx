import type { Metadata } from "next";
import AdminInventory from "./AdminInventory";

export const metadata: Metadata = {
  title: "TVs & More Inventory | Deals & Steals",
  robots: { index: false, follow: false, nocache: true },
};

export default function TvsAdminPage() {
  return <AdminInventory />;
}
