import { NextResponse } from "next/server";
import { fetchSquareItemImage } from "../squareImage";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Props) {
  const { id } = await params;
  try {
    const image = await fetchSquareItemImage(id);
    if (!image) return new NextResponse("Image unavailable", { status: 404 });
    const response = await fetch(image.url, { cache: "no-store" });
    if (!response.ok) return new NextResponse("Image unavailable", { status: 502 });
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) return new NextResponse("Invalid image", { status: 502 });
    return new NextResponse(response.body, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Failed to serve Square preview image", error);
    return new NextResponse("Image unavailable", { status: 502 });
  }
}
