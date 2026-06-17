import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SQUARE_BASE_URL = "https://connect.squareup.com";
const SQUARE_API_VERSION = process.env.SQUARE_API_VERSION || "2026-05-20";
const LOW_STOCK_THRESHOLD = 3;

type SquareMoney = {
  amount?: number;
  currency?: string;
};

function formatMoney(money?: SquareMoney | null) {
  if (!money || typeof money.amount !== "number") return "";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: money.currency || "USD",
  }).format(money.amount / 100);
}

function centsToMoney(amount?: number | null, currency = "USD"): SquareMoney | null {
  if (typeof amount !== "number" || !Number.isFinite(amount)) return null;
  return { amount, currency };
}

function parseSquareQuantity(quantity?: string | number | null) {
  if (quantity === null || quantity === undefined) return 0;

  const parsed = Number(quantity);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parsePriceToCents(value: unknown) {
  if (value === null || value === undefined) return null;

  if (typeof value === "number" && Number.isFinite(value)) {
    // If Square/custom attribute sends 4, treat as $4.00.
    return Math.round(value * 100);
  }

  if (typeof value === "string") {
    const cleaned = value.replace(/[^0-9.]/g, "");
    const parsed = Number(cleaned);

    if (Number.isFinite(parsed)) {
      return Math.round(parsed * 100);
    }
  }

  return null;
}

function normalizeLabel(value: unknown) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function extractCustomAttributePriceCents(object: any, possibleNames: string[]) {
  const values = object?.custom_attribute_values || {};
  const normalizedNames = possibleNames.map(normalizeLabel);

  for (const value of Object.values(values) as any[]) {
    const label = normalizeLabel(
      value?.name ||
        value?.key ||
        value?.custom_attribute_definition_id ||
        value?.custom_attribute_definition?.name
    );

    const matches = normalizedNames.some((name) => label.includes(name));
    if (!matches) continue;

    const rawValue =
      value?.number_value ??
      value?.string_value ??
      value?.selection_uid_values?.[0] ??
      null;

    const cents = parsePriceToCents(rawValue);
    if (cents !== null) return cents;
  }

  return null;
}

function findSalePriceCents(item: any, variation: any) {
  const itemData = item?.item_data || {};
  const variationData = variation?.item_variation_data || {};

  const directMoneyCandidates = [
    variationData.online_sale_price_money,
    variationData.sale_price_money,
    variationData.ecom_sale_price_money,
    variationData.ecommerce_sale_price_money,
    variationData.square_online_sale_price_money,
    itemData.online_sale_price_money,
    itemData.sale_price_money,
    itemData.ecom_sale_price_money,
    itemData.ecommerce_sale_price_money,
    itemData.square_online_sale_price_money,
  ];

  for (const money of directMoneyCandidates) {
    if (typeof money?.amount === "number") {
      return money.amount;
    }
  }

  return (
    extractCustomAttributePriceCents(variation, [
      "online sale price",
      "sale price",
      "website sale price",
      "website price",
      "online price",
      "deals price",
      "deals and steals price",
    ]) ??
    extractCustomAttributePriceCents(item, [
      "online sale price",
      "sale price",
      "website sale price",
      "website price",
      "online price",
      "deals price",
      "deals and steals price",
    ])
  );
}

function findRetailPriceCents(item: any, variation: any) {
  const itemData = item?.item_data || {};
  const variationData = variation?.item_variation_data || {};

  const directMoneyCandidates = [
    variationData.retail_price_money,
    variationData.original_price_money,
    variationData.original_retail_price_money,
    variationData.msrp_money,
    variationData.compare_at_price_money,
    variationData.ecom_regular_price_money,
    variationData.regular_price_money,
    itemData.retail_price_money,
    itemData.original_price_money,
    itemData.original_retail_price_money,
    itemData.msrp_money,
    itemData.compare_at_price_money,
    itemData.ecom_regular_price_money,
    itemData.regular_price_money,
  ];

  for (const money of directMoneyCandidates) {
    if (typeof money?.amount === "number") {
      return money.amount;
    }
  }

  return (
    extractCustomAttributePriceCents(variation, [
      "retail",
      "retail price",
      "original retail",
      "original retail price",
      "original price",
      "msrp",
      "compare at price",
      "compare price",
    ]) ??
    extractCustomAttributePriceCents(item, [
      "retail",
      "retail price",
      "original retail",
      "original retail price",
      "original price",
      "msrp",
      "compare at price",
      "compare price",
    ])
  );
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

async function getInventoryCounts(variationIds: string[], locationId: string) {
  if (variationIds.length === 0) return {};

  const inventoryByVariationId: Record<string, number> = {};
  let cursor: string | undefined;

  do {
    const inventoryResponse = await squarePost("/v2/inventory/counts/batch-retrieve", {
      catalog_object_ids: variationIds,
      location_ids: [locationId],
      states: ["IN_STOCK"],
      cursor,
    });

    const counts = inventoryResponse.counts || [];

    counts.forEach((count: any) => {
      const variationId = count.catalog_object_id;
      const quantity = parseSquareQuantity(count.quantity);

      if (!variationId) return;

      inventoryByVariationId[variationId] =
        (inventoryByVariationId[variationId] || 0) + quantity;
    });

    cursor = inventoryResponse.cursor;
  } while (cursor);

  return inventoryByVariationId;
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
      new Set(items.flatMap((item: any) => item.item_data?.image_ids || []))
    );

    let imageMap: Record<string, string> = {};

    if (imageIds.length > 0) {
      const imageResponse = await squarePost("/v2/catalog/batch-retrieve", {
        object_ids: imageIds,
        include_related_objects: false,
      });

      imageMap = (imageResponse.objects || []).reduce(
        (map: Record<string, string>, object: any) => {
          if (object.type === "IMAGE" && object.image_data?.url) {
            map[object.id] = object.image_data.url;
          }
          return map;
        },
        {}
      );
    }

    const rawProducts = items
      .map((item: any) => {
        const itemData = item.item_data || {};
        const variations = itemData.variations || [];

        const firstPricedVariation = variations.find(
          (variation: any) =>
            variation.item_variation_data?.price_money?.amount != null
        );

        if (!firstPricedVariation) return null;

        const variationData = firstPricedVariation.item_variation_data || {};
        const basePriceMoney = variationData.price_money;
        const currency = basePriceMoney?.currency || "USD";
        const basePriceAmount = basePriceMoney?.amount || null;

        const salePriceAmount = findSalePriceCents(item, firstPricedVariation);
        const customRetailAmount = findRetailPriceCents(item, firstPricedVariation);

        const dealsAmount =
          salePriceAmount !== null &&
          basePriceAmount !== null &&
          salePriceAmount > 0 &&
          salePriceAmount < basePriceAmount
            ? salePriceAmount
            : basePriceAmount;

        const retailAmount =
          customRetailAmount !== null && customRetailAmount > 0
            ? customRetailAmount
            : salePriceAmount !== null &&
                basePriceAmount !== null &&
                salePriceAmount > 0 &&
                salePriceAmount < basePriceAmount
              ? basePriceAmount
              : null;

        const firstImageId = itemData.image_ids?.[0];

        return {
          id: item.id,
          variationId: firstPricedVariation.id || null,
          name: itemData.name || "Untitled Item",
          description:
            itemData.description_plaintext ||
            itemData.description ||
            "",
          price: formatMoney(centsToMoney(dealsAmount, currency)),
          dealsPrice: formatMoney(centsToMoney(dealsAmount, currency)),
          dealsAmount,
          retailPrice: formatMoney(centsToMoney(retailAmount, currency)),
          retailAmount,
          priceAmount: dealsAmount,
          currency,
          image: firstImageId ? imageMap[firstImageId] : null,
          squareUrl: null,
        };
      })
      .filter((item: any) => item && item.priceAmount !== null && item.variationId);

    const variationIds = rawProducts
      .map((item: any) => item.variationId)
      .filter(Boolean);

    const inventoryByVariationId = await getInventoryCounts(variationIds, locationId);

    const products = rawProducts
      .map((item: any) => {
        const stockCount = inventoryByVariationId[item.variationId] || 0;

        return {
          ...item,
          stockCount,
          lowStock: stockCount > 0 && stockCount <= LOW_STOCK_THRESHOLD,
        };
      })
      .filter((item: any) => item.stockCount > 0);

    return NextResponse.json({
      products,
      count: products.length,
      hiddenBecauseOutOfStock: rawProducts.length - products.length,
      lowStockThreshold: LOW_STOCK_THRESHOLD,
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
