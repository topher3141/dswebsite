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

  for (const [attributeKey, value] of Object.entries(values) as any[]) {
    const possibleLabels = [
      attributeKey,
      value?.name,
      value?.key,
      value?.custom_attribute_definition_id,
      value?.custom_attribute_definition?.name,
    ];

    const labelMatches = possibleLabels.some((label) => {
      const normalizedLabel = normalizeLabel(label);
      return normalizedNames.some((name) => normalizedLabel.includes(name));
    });

    if (!labelMatches) continue;

    if (value?.money_value?.amount && typeof value.money_value.amount === "number") {
      return value.money_value.amount;
    }

    const rawValue =
      value?.number_value ??
      value?.string_value ??
      value?.amount ??
      value?.selection_uid_values?.[0] ??
      null;

    const cents = parsePriceToCents(rawValue);
    if (cents !== null) return cents;
  }

  return null;
}

/**
 * Descriptions sometimes contain a stated original retail value even when the
 * Square MSRP attribute is empty. Only accept amounts explicitly labeled as
 * MSRP, retail price/value, original price, or compare-at price.
 */
function findRetailPriceInDescription(description: unknown): number | null {
  if (typeof description !== "string" || !description.trim()) return null;

  // Both plain text and simple HTML descriptions can be supplied by Square.
  const text = description
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&dollar;/gi, "$")
    .replace(/&#36;/g, "$")
    .replace(/\s+/g, " ");

  const label = String.raw`(?:MSRP|original\s+(?:retail\s+)?price|retails?|retail\s+(?:price|value)|original\s+retail(?:\s+value)?|compare[-\s]?at\s+price)`;
  const amount = String.raw`\$\s*((?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{2})?)`;
  // Limit the distance between the label and amount to avoid unrelated prices.
  const labeledPrice = new RegExp(String.raw`\b` + label + String.raw`\b\s*(?::|=|-|–|—)?\s*(?:USD\s*)?` + amount, "i");
  const match = text.match(labeledPrice);
  if (!match) return null;

  const dollars = Number(match[1].replace(/,/g, ""));
  if (!Number.isFinite(dollars) || dollars <= 0) return null;
  return Math.round(dollars * 100);
}

function findMsrpCents(item: any, variation: any) {
  const itemData = item?.item_data || {};
  const variationData = variation?.item_variation_data || {};

  const directCandidates = [
    variationData.MSRP,
    variationData.msrp,
    variationData.msrp_money,
    variationData.RETAIL_PRICE,
    variationData.ORIGINAL_PRICE,
    variationData.ORIGINAL_RETAIL_PRICE,
    itemData.MSRP,
    itemData.msrp,
    itemData.msrp_money,
    itemData.RETAIL_PRICE,
    itemData.ORIGINAL_PRICE,
    itemData.ORIGINAL_RETAIL_PRICE,
  ];

  for (const candidate of directCandidates) {
    if (typeof candidate?.amount === "number") return candidate.amount;

    const parsed = parsePriceToCents(candidate);
    if (parsed !== null) return parsed;
  }

  return (
    extractCustomAttributePriceCents(variation, [
      "MSRP",
      "msrp",
      "retail price",
      "original retail",
      "original retail price",
      "original price",
      "compare at price",
      "compare price",
    ]) ??
    extractCustomAttributePriceCents(item, [
      "MSRP",
      "msrp",
      "retail price",
      "original retail",
      "original retail price",
      "original price",
      "compare at price",
      "compare price",
    ])
  );
}

async function squareGet(path: string) {
  const accessToken = process.env.SQUARE_ACCESS_TOKEN;
  if (!accessToken) throw new Error("Missing SQUARE_ACCESS_TOKEN");
  const response = await fetch(`${SQUARE_BASE_URL}${path}`, {
    headers: { "Square-Version": SQUARE_API_VERSION, Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.errors?.[0]?.detail || "Square API request failed");
  return data;
}

async function resolveTvAndElectronicsCategoryIds() {
  // Preserve every exact-name match. Square can contain more than one category
  // called "Electronics"; picking the first ID can silently omit products.
  const names = ["televisions", "electronics"];
  const idsByName = new Map<string, string[]>(names.map(name => [name, []]));
  let cursor: string | undefined;
  do {
    const query = new URLSearchParams({ types: "CATEGORY" });
    if (cursor) query.set("cursor", cursor);
    const response = await squareGet(`/v2/catalog/list?${query.toString()}`);
    for (const object of response.objects || []) {
      const name = normalizeLabel(object.category_data?.name);
      if (idsByName.has(name) && !idsByName.get(name)!.includes(object.id)) {
        idsByName.get(name)!.push(object.id);
      }
    }
    cursor = response.cursor;
  } while (cursor);
  return {
    ids: [...new Set([...idsByName.values()].flat())],
    namedIds: Object.fromEntries(idsByName),
    missing: names.filter(name => !idsByName.get(name)!.length),
  };
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

export async function GET(request: Request) {
  try {
    const locationId = process.env.SQUARE_LOCATION_ID;
    const isElectronics = new URL(request.url).searchParams.get("collection") === "electronics";
    const collection = isElectronics ? await resolveTvAndElectronicsCategoryIds() : null;
    const categoryIds = isElectronics
      ? collection!.ids
      : (process.env.SQUARE_FEATURED_CATEGORY_ID ? [process.env.SQUARE_FEATURED_CATEGORY_ID] : []);

    if (!locationId) {
      return NextResponse.json(
        { error: "Missing SQUARE_LOCATION_ID" },
        { status: 500 }
      );
    }

    if (!categoryIds.length || (isElectronics && collection!.missing.length > 0)) {
      return NextResponse.json(
        { error: isElectronics ? `Square categories not found: ${collection!.missing.join(", ")}. Make sure both Televisions and Electronics exist as regular Square catalog categories.` : "Missing SQUARE_FEATURED_CATEGORY_ID" },
        { status: 500 }
      );
    }

    // Search each category independently, then merge by catalog item ID.
    // This avoids category-filter interaction and makes missing stock diagnosable.
    const itemsById = new Map<string, any>();
    const itemCategoryNames = new Map<string, Set<string>>();
    const categoryDiagnostics: Record<string, { catalogItems: number; pricedItems: number; inStockItems: number; categoryIds: string[] }> = {};
    const categorySearches = isElectronics
      ? [
          { name: "Televisions", ids: collection!.namedIds.televisions },
          { name: "Electronics", ids: collection!.namedIds.electronics },
        ]
      : [{ name: "Featured Finds", ids: categoryIds }];

    function addCategoryItem(item: any, categoryName: string) {
      if (!item?.id) return;
      itemsById.set(item.id, item);
      if (!itemCategoryNames.has(item.id)) itemCategoryNames.set(item.id, new Set());
      itemCategoryNames.get(item.id)!.add(categoryName);
    }

    // Query the two Square categories separately; items need only belong to ONE.
    for (const { name, ids } of categorySearches) {
      const seenCategoryIds = new Set<string>();
      for (const id of ids) {
        let catalogCursor: string | undefined;
        do {
          const catalogResponse = await squarePost("/v2/catalog/search-catalog-items", {
            category_ids: [id],
            enabled_location_ids: [locationId],
            product_types: ["REGULAR"],
            limit: 100,
            ...(catalogCursor ? { cursor: catalogCursor } : {}),
          });
          for (const item of catalogResponse.items || []) {
            if (!item?.id) continue;
            addCategoryItem(item, name);
            seenCategoryIds.add(item.id);
          }
          catalogCursor = catalogResponse.cursor;
        } while (catalogCursor);
      }
      categoryDiagnostics[name] = {
        catalogItems: seenCategoryIds.size, pricedItems: 0, inStockItems: 0, categoryIds: ids,
      };
    }

    // Some Square catalog configurations do not return secondary-category
    // assignments through search-catalog-items. Fall back to reading item
    // category assignments directly when the Electronics category is empty.
    if (isElectronics && categoryDiagnostics.Electronics.catalogItems === 0) {
      const electronicsIds = new Set(collection!.namedIds.electronics);
      let cursor: string | undefined;
      do {
        const query = new URLSearchParams({ types: "ITEM" });
        if (cursor) query.set("cursor", cursor);
        const page = await squareGet(`/v2/catalog/list?${query.toString()}`);
        for (const item of page.objects || []) {
          const data = item.item_data || {};
          const itemCategories = [
            data.category_id,
            ...(data.categories || []).map((category: any) => category.id),
          ].filter(Boolean);
          if (!itemCategories.some((id: string) => electronicsIds.has(id))) continue;
          if (item.is_deleted || item.present_at_all_locations === false &&
            !(item.present_at_location_ids || []).includes(locationId)) continue;
          addCategoryItem(item, "Electronics");
        }
        cursor = page.cursor;
      } while (cursor);
      categoryDiagnostics.Electronics.catalogItems =
        [...itemCategoryNames.values()].filter(names => names.has("Electronics")).length;
    }

    const items = [...itemsById.values()];

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

    // Square items may have multiple variations. Check every priced variation,
    // then sell an in-stock variation rather than assuming the first one is available.
    const pricedVariationsByItem = items.map((item: any) => ({
      item,
      variations: (item.item_data?.variations || []).filter((variation: any) =>
        variation.id && typeof variation.item_variation_data?.price_money?.amount === "number"
      ),
    })).filter(({ variations }: any) => variations.length > 0);

    for (const { item } of pricedVariationsByItem) {
      for (const name of itemCategoryNames.get(item.id) || []) categoryDiagnostics[name].pricedItems++;
    }

    const variationIds = [...new Set(pricedVariationsByItem.flatMap(({ variations }: any) =>
      variations.map((variation: any) => variation.id as string)
    ))];
    const inventoryByVariationId: Record<string, number> = {};
    // The Square inventory endpoint accepts at most 100 catalog variation IDs per request.
    for (let offset = 0; offset < variationIds.length; offset += 100) {
      Object.assign(inventoryByVariationId, await getInventoryCounts(variationIds.slice(offset, offset + 100), locationId));
    }

    const products = pricedVariationsByItem.flatMap(({ item, variations }: any) => {
      const availableVariation = variations.find((variation: any) =>
        (inventoryByVariationId[variation.id] || 0) > 0
      );
      if (!availableVariation) return [];

      const itemData = item.item_data || {};
      const squarePriceMoney = availableVariation.item_variation_data.price_money;
      const currency = squarePriceMoney.currency || "USD";
      const dealsAmount = squarePriceMoney.amount;
      const statedMsrpAmount = findMsrpCents(item, availableVariation);
      const descriptionRetailAmount =
        statedMsrpAmount == null
          ? findRetailPriceInDescription(itemData.description_plaintext || itemData.description)
          : null;
      // Only advertise a description-derived retail price when it exceeds our
      // actual selling price; never show misleading negative savings.
      const msrpAmount =
        statedMsrpAmount ??
        (descriptionRetailAmount !== null && descriptionRetailAmount > dealsAmount
          ? descriptionRetailAmount
          : null);
      const firstImageId = itemData.image_ids?.[0];
      const stockCount = inventoryByVariationId[availableVariation.id] || 0;

      return [{
        id: item.id,
        categories: [...(itemCategoryNames.get(item.id) || [])].filter(name => name === "Televisions" || name === "Electronics"),
        variationId: availableVariation.id,
        name: itemData.name || "Untitled Item",
        description: itemData.description_plaintext || itemData.description || "",
        price: formatMoney(centsToMoney(dealsAmount, currency)),
        dealsPrice: formatMoney(centsToMoney(dealsAmount, currency)),
        dealsAmount,
        retailPrice: formatMoney(centsToMoney(msrpAmount, currency)),
        retailAmount: msrpAmount,
        squarePrice: formatMoney(centsToMoney(dealsAmount, currency)),
        squarePriceAmount: dealsAmount,
        priceAmount: dealsAmount,
        currency,
        image: firstImageId ? imageMap[firstImageId] : null,
        squareUrl: null,
        stockCount,
        lowStock: stockCount <= LOW_STOCK_THRESHOLD,
      }];
    });

    for (const item of products) {
      for (const name of itemCategoryNames.get(item.id) || []) categoryDiagnostics[name].inStockItems++;
    }

    return NextResponse.json({
      products,
      ...(isElectronics ? { categoryDiagnostics } : {}),
      count: products.length,
      hiddenBecauseOutOfStock: pricedVariationsByItem.length - products.length,
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
