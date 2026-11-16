import type { Metadata } from "next";
import ElectronicsProduct from "./ElectronicsProduct";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const fallback: Metadata = {
    title: "TVs & More | Deals & Steals",
    description: "Special TVs and electronics available exclusively to order online for local pickup.",
  };
  const token = process.env.SQUARE_ACCESS_TOKEN;
  if (!token) return fallback;
  try {
    const response = await fetch(
      `https://connect.squareup.com/v2/catalog/object/${encodeURIComponent(id)}?include_related_objects=true`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Square-Version": process.env.SQUARE_API_VERSION || "2026-05-20",
        },
        cache: "no-store",
      }
    );
    if (!response.ok) return fallback;
    const data = await response.json();
    const item = data.object?.type === "ITEM" ? data.object : null;
    if (!item) return fallback;
    const name = item.item_data?.name || "TVs & More";
    const rawDescription = item.item_data?.description_plaintext || item.item_data?.description || "";
    const description = String(rawDescription).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 180) ||
      "Order this special find online from Deals & Steals for local pickup.";
    const imageIds = item.item_data?.image_ids || [];
    const image = (data.related_objects || []).find((obj: any) =>
      obj.type === "IMAGE" && imageIds.includes(obj.id)
    )?.image_data?.url;
    const url = `https://www.dealsandstealsmd.com/tvs/${encodeURIComponent(id)}`;
    return {
      title: `${name} | Deals & Steals`,
      description,
      alternates: { canonical: url },
      openGraph: {
        title: `${name} | Deals & Steals`, description, url,
        type: "website", ...(image ? { images: [{ url: image, alt: name }] } : {}),
      },
      twitter: { card: "summary_large_image", title: name, description,
        ...(image ? { images: [image] } : {}) },
    };
  } catch {
    return fallback;
  }
}

export default async function ElectronicsItemPage({ params }: Props) {
  const { id } = await params;
  return <ElectronicsProduct itemId={id} />;
}
