import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SQUARE_BASE_URL = "https://connect.squareup.com";
const SQUARE_API_VERSION = process.env.SQUARE_API_VERSION || "2026-05-20";

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
    console.error("Square checkout error:", data);
    throw new Error(data?.errors?.[0]?.detail || "Square checkout request failed");
  }

  return data;
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    route: "/api/square/create-checkout",
    message: "Checkout API route is deployed and reachable.",
  });
}

export async function POST(request: NextRequest) {
  try {
    const locationId = process.env.SQUARE_LOCATION_ID;

    if (!locationId) {
      return NextResponse.json(
        { error: "Missing SQUARE_LOCATION_ID" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const variationId = body?.variationId;
    const itemName = body?.itemName || "Deals & Steals Item";

    if (!variationId) {
      return NextResponse.json(
        { error: "Missing variationId" },
        { status: 400 }
      );
    }

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      request.headers.get("origin") ||
      "https://www.dealsandstealsmd.com";

    const serviceFeePercentage = process.env.SQUARE_SERVICE_FEE_PERCENTAGE;
    const serviceFeeName = process.env.SQUARE_SERVICE_FEE_NAME || "Online Checkout Service Fee";

    const serviceCharges =
      serviceFeePercentage && Number(serviceFeePercentage) > 0
        ? [
            {
              name: serviceFeeName,
              percentage: serviceFeePercentage,
              scope: "ORDER",
              taxable: false,
              calculation_phase: "TOTAL_PHASE",
            },
          ]
        : undefined;

    const checkoutResponse = await squarePost("/v2/online-checkout/payment-links", {
      idempotency_key: crypto.randomUUID(),
      description: `Deals & Steals - ${itemName}`,
      order: {
        location_id: locationId,
        line_items: [
          {
            catalog_object_id: variationId,
            quantity: "1",
          },
        ],
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

    const checkoutUrl = checkoutResponse?.payment_link?.url;

    if (!checkoutUrl) {
      throw new Error("Square did not return a checkout URL");
    }

    return NextResponse.json({
      checkoutUrl,
      paymentLinkId: checkoutResponse.payment_link?.id,
      orderId: checkoutResponse.payment_link?.order_id,
    });
  } catch (error: any) {
    console.error(error);

    return NextResponse.json(
      { error: error.message || "Unable to create checkout" },
      { status: 500 }
    );
  }
}
