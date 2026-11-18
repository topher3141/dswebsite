const SQUARE_BASE = "https://connect.squareup.com";
const VERSION = process.env.SQUARE_API_VERSION || "2026-05-20";

export async function fetchSquareItemImage(itemId: string): Promise<{ url: string; name: string } | null> {
  const token = process.env.SQUARE_ACCESS_TOKEN;
  if (!token) return null;
  const headers = { Authorization: `Bearer ${token}`, "Square-Version": VERSION };
  const itemResponse = await fetch(
    `${SQUARE_BASE}/v2/catalog/object/${encodeURIComponent(itemId)}`,
    { headers, cache: "no-store" }
  );
  if (!itemResponse.ok) return null;
  const itemPayload = await itemResponse.json();
  const item = itemPayload.object;
  if (item?.type !== "ITEM") return null;
  const ids: string[] = item.item_data?.image_ids || [];
  if (ids.length === 0) return null;
  const imageResponse = await fetch(`${SQUARE_BASE}/v2/catalog/batch-retrieve`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ object_ids: [ids[0]], include_related_objects: false }),
    cache: "no-store",
  });
  if (!imageResponse.ok) return null;
  const imagePayload = await imageResponse.json();
  const image = (imagePayload.objects || []).find((object: any) =>
    object.type === "IMAGE" && object.id === ids[0]
  );
  const url = image?.image_data?.url;
  if (!url || !/^https:\/\//i.test(url)) return null;
  return { url, name: item.item_data?.name || "TVs & More" };
}
