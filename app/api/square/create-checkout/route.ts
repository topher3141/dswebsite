import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SQUARE_BASE_URL = "https://connect.squareup.com";
const SQUARE_API_VERSION = process.env.SQUARE_API_VERSION || "2026-05-20";

type CheckoutItem = {
  variationId?: string | null;
  quantity?: number | string | null;
  itemName?: string;
};

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

function normalizeQuantity(quantity: CheckoutItem["quantity"]) {
  const parsed = Number(quantity || 1);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }

  return Math.floor(parsed);
}

function buildServiceCharges() {
  const serviceFeePercentage = process.env.SQUARE_SERVICE_FEE_PERCENTAGE;
  const serviceFeeName =
    process.env.SQUARE_SERVICE_FEE_NAME || "Online Checkout Service Fee";

  if (!serviceFeePercentage || Number(serviceFeePercentage) <= 0) {
    return undefined;
  }

  return [
    {
      name: serviceFeeName,
      percentage: String(serviceFeePercentage),
      scope: "ORDER",
      taxable: false,
      calculation_phase: "TOTAL_PHASE",
    },
  ];
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    route: "/api/square/create-checkout",
    accepts: {
      singleItem: {
        variationId: "Square variation ID",
        itemName: "Optional item name",
      },
      cart: {
        items: [
          {
            variationId: "Square variation ID",
            quantity: 1,
            itemName: "Optional item name",
          },
        ],
      },
    },
  });
}

export async function POST(request: Request) {
  try {
    const locationId = process.env.SQUARE_LOCATION_ID;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.dealsandstealsmd.com";

    if (!locationId) {
      return NextResponse.json(
        { error: "Missing SQUARE_LOCATION_ID" },
        { status: 500 }
      );
    }

    const body = await request.json();

    const incomingItems: CheckoutItem[] = Array.isArray(body.items)
      ? body.items
      : [
          {
            variationId: body.variationId,
            quantity: 1,
            itemName: body.itemName,
          },
        ];

    const validItems = incomingItems
      .map((item) => ({
        variationId: item.variationId,
        quantity: normalizeQuantity(item.quantity),
        itemName: item.itemName,
      }))
      .filter((item) => Boolean(item.variationId));

    if (validItems.length === 0) {
      return NextResponse.json(
        { error: "No valid items were provided for checkout." },
        { status: 400 }
      );
    }

    const serviceCharges = buildServiceCharges();

    const paymentLinkResponse = await squarePost("/v2/online-checkout/payment-links", {
      idempotency_key: crypto.randomUUID(),
      order: {
        location_id: locationId,
        line_items: validItems.map((item) => ({
          catalog_object_id: item.variationId,
          quantity: String(item.quantity),
        })),
        pricing_options: {
          auto_apply_taxes: true,
        },
        ...(serviceCharges ? { service_charges: serviceCharges } : {}),
      },
      checkout_options: {
        redirect_url: `${siteUrl}/shop/success`,
        ask_for_shipping_address: false,
      },
    });

    const checkoutUrl = paymentLinkResponse?.payment_link?.url;

    if (!checkoutUrl) {
      return NextResponse.json(
        { error: "Square did not return a checkout URL." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      checkoutUrl,
      paymentLinkId: paymentLinkResponse.payment_link?.id,
    });
  } catch (error: any) {
    console.error(error);

    return NextResponse.json(
      {
        error: error.message || "Unable to create checkout",
      },
      { status: 500 }
    );
  }
}
