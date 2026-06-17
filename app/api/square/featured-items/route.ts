import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SQUARE_BASE_URL = "https://connect.squareup.com";
const SQUARE_API_VERSION = process.env.SQUARE_API_VERSION || "2026-05-20";

type SquareMoney = {
  amount?: number;
  currency?: string;
};

function formatMoney(money?: SquareMoney) {
  if (!money || typeof money.amount !== "number") return "";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: money.currency || "USD",
  }).format(money.amount / 100);
}

async function squarePost(path: string, body: unknown) {
  const accessToken = process.env.SQUARE_ACCESS_TOKEN;

  if (!accessToken) {
    throw new Error("Missing SQUARE_ACCESS_TOKEN");
  }

  const response = await fetch(`${SQUARE_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Square-Version": SQUARE_API_VERSION,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("Square API error:", data);
    throw new Error(data?.errors?.[0]?.detail || "Square API request failed");
  }

  return data;
}

export async function GET() {
  try {
    const locationId = process.env.SQUARE_LOCATION_ID;
    const categoryId = process.env.SQUARE_FEATURED_CATEGORY_ID;

    if (!locationId) {
      return NextResponse.json(
        { error: "Missing SQUARE_LOCATION_ID" },
        { status: 500 }
      );
    }

    if (!categoryId) {
      return NextResponse.json(
        { error: "Missing SQUARE_FEATURED_CATEGORY_ID" },
        { status: 500 }
      );
    }

    const catalogResponse = await squarePost("/v2/catalog/search-catalog-items", {
      category_ids: [categoryId],
      enabled_location_ids: [locationId],
      product_types: ["REGULAR"],
      limit: 100,
    });

    const items = catalogResponse.items || [];

    const imageIds = Array.from(
      new Set(
        items.flatMap((item: any) => item.item_data?.image_ids || [])
      )
    );

    let imageMap: Record<string, string> = {};

    if (imageIds.length > 0) {
      const imageResponse = await squarePost("/v2/catalog/batch-retrieve", {
        object_ids: imageIds,
        include_related_objects: false,
      });

      imageMap = (imageResponse.objects || {}).reduce(
        (map: Record<string, string>, object: any) => {
          if (object.type === "IMAGE" && object.image_data?.url) {
            map[object.id] = object.image_data.url;
          }
          return map;
        },
        {}
      );
    }

    const products = items
      .map((item: any) => {
        const itemData = item.item_data || {};
        const variations = itemData.variations || [];

        const firstPricedVariation = variations.find(
          (variation: any) =>
            variation.item_variation_data?.price_money?.amount != null
        );

        const variationData = firstPricedVariation?.item_variation_data || {};
        const priceMoney = variationData.price_money;

        const firstImageId = itemData.image_ids?.[0];

        return {
          id: item.id,
          variationId: firstPricedVariation?.id || null,
          name: itemData.name || "Untitled Item",
          description:
            itemData.description_plaintext ||
            itemData.description ||
            "",
          category: "Featured Find",
          price: formatMoney(priceMoney),
          priceAmount: priceMoney?.amount || null,
          currency: priceMoney?.currency || "USD",
          image: firstImageId ? imageMap[firstImageId] : null,
          squareUrl: null,
        };
      })
      .filter((item: any) => item.priceAmount !== null);

    return NextResponse.json({
      products,
      count: products.length,
    });
  } catch (error: any) {
    console.error(error);

    return NextResponse.json(
      {
        error: error.message || "Unable to load Square items",
      },
      { status: 500 }
    );
  }
}
