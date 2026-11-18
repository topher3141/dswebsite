"use client";

import { useEffect, useState } from "react";
import { useElectronicsCart } from "../useElectronicsCart";

type Product = {
  id: string; variationId?: string | null; name: string; description?: string;
  sku?: string | null;
  image?: string | null; images?: string[]; dealsPrice?: string; price: string;
  dealsAmount?: number | null; retailAmount?: number | null; retailPrice?: string;
  stockCount?: number;
};

export default function ElectronicsProduct({ itemId }: { itemId: string }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { cartItems, addToCart, decreaseCartQuantity, removeFromCart, checkoutCart, checkoutError, isCheckingOutCart } = useElectronicsCart();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [copyDone, setCopyDone] = useState(false);
  const [isBuyingNow, setIsBuyingNow] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isImageExpanded, setIsImageExpanded] = useState(false);
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetch("/api/square/featured-items?collection=electronics", { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Unable to load item.");
        const item = (data.products || []).find((p: Product) => p.id === itemId);
        if (active) {
          setProduct(item || null);
          setActiveImageIndex(0);
        }
      } catch (e: any) {
        if (active) setError(e?.message || "Unable to load item.");
      } finally { if (active) setLoading(false); }
    }
    load();
    return () => { active = false; };
  }, [itemId]);

  function addProductToCart() {
    if (!product) return;
    addToCart(product);
    setIsCartOpen(true);
  }

  async function buyNow() {
    if (!product?.variationId || !product.stockCount || isBuyingNow) return;
    // Open a tab on the user click so browser popup blockers do not interfere.
    const checkoutWindow = window.open("", "_blank");
    setError("");
    setIsBuyingNow(true);
    try {
      const response = await fetch("/api/square/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{ variationId: product.variationId, quantity: 1, itemName: product.name }],
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.checkoutUrl) {
        throw new Error(data.error || "Unable to create checkout.");
      }
      if (checkoutWindow) checkoutWindow.location.href = data.checkoutUrl;
      else window.location.href = data.checkoutUrl;
    } catch (error: any) {
      checkoutWindow?.close();
      setError(error?.message || "Unable to start checkout.");
    } finally {
      setIsBuyingNow(false);
    }
  }

  async function copyLink() {
    const link = window.location.href;
    try {
      await navigator.clipboard.writeText(link);
      setCopyDone(true);
    } catch {
      window.prompt("Copy this item link:", link);
    }
  }

  const images = product?.images?.length ? product.images : product?.image ? [product.image] : [];
  const activeImage = images[activeImageIndex] || images[0];

  const savings = product?.retailAmount && product?.dealsAmount && product.retailAmount > product.dealsAmount
    ? Math.round((1 - product.dealsAmount / product.retailAmount) * 100) : null;

  return (
    <main className="min-h-screen bg-[#f7efe5] text-slate-950">
      <header className="border-b-4 border-pink-500 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <a href="/" aria-label="Deals & Steals home"><img src="https://i.imgur.com/euamaJ6.png" alt="Deals & Steals" className="h-12 w-auto" /></a>
          <div className="flex items-center gap-3">
            <a href="/tvs" className="rounded-full bg-pink-50 px-4 py-2 text-sm font-black text-pink-700 hover:bg-pink-100">← TVs & More</a>
            <button onClick={() => setIsCartOpen(true)}
              className="rounded-full bg-teal-700 px-4 py-2 text-sm font-black text-white hover:bg-teal-800"
              aria-label="Open shopping cart">
              🛒 Cart {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
            </button>
          </div>
        </div>
      </header>
      {isCartOpen && (
        <div className="fixed inset-0 z-50">
          <button className="absolute inset-0 bg-slate-950/60" onClick={() => setIsCartOpen(false)}
            aria-label="Close cart" />
          <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b p-5">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-pink-600">Your Cart</p>
                <h2 className="text-2xl font-black">{cartItems.reduce((sum, item) => sum + item.quantity, 0)} items</h2>
              </div>
              <button onClick={() => setIsCartOpen(false)} className="rounded-full bg-slate-100 px-4 py-2 font-black"
                aria-label="Close cart">✕</button>
            </div>
            <div className="flex-1 space-y-4 overflow-auto p-5">
              {cartItems.length === 0 && <p className="font-bold text-slate-600">Your cart is empty.</p>}
              {cartItems.map(({ product: item, quantity }) => (
                <div key={item.id} className="rounded-2xl border p-4">
                  <div className="flex gap-3">
                    {item.image && <img src={item.image} alt={item.name} className="h-20 w-20 rounded-xl object-cover" />}
                    <div className="flex-1">
                      <a href={`/tvs/${encodeURIComponent(item.id)}`} className="font-black hover:text-pink-600">{item.name}</a>
                      <p className="font-black text-pink-600">{item.dealsPrice || item.price}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <div className="flex items-center rounded-full border">
                      <button onClick={() => decreaseCartQuantity(item)} className="px-3 py-1 font-black" aria-label="Decrease quantity">−</button>
                      <span className="px-2 font-bold">{quantity}</span>
                      <button onClick={() => addToCart(item)} disabled={Boolean(item.stockCount && quantity >= item.stockCount)}
                        className="px-3 py-1 font-black disabled:opacity-30" aria-label="Increase quantity">+</button>
                    </div>
                    <button onClick={() => removeFromCart(item)} className="text-sm font-bold text-pink-600">Remove</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t p-5">
              <div className="mb-4 flex justify-between text-lg font-black">
                <span>Subtotal</span>
                <span>{new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(
                  cartItems.reduce((total, item) => total + (item.product.dealsAmount || item.product.priceAmount || 0) * item.quantity, 0) / 100
                )}</span>
              </div>
              <p className="mb-4 text-xs text-slate-600">Taxes and any checkout fees are calculated by Square. Local pickup only.</p>
              {checkoutError && <p role="alert" className="mb-3 text-sm font-bold text-red-600">{checkoutError}</p>}
              <button onClick={checkoutCart} disabled={!cartItems.length || isCheckingOutCart}
                className="w-full rounded-xl bg-pink-600 px-5 py-4 font-black text-white disabled:opacity-50">
                {isCheckingOutCart ? "Opening Checkout..." : "Checkout with Square"}
              </button>
            </div>
          </aside>
        </div>
      )}
      {isImageExpanded && activeImage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/95 p-4" role="dialog" aria-modal="true" aria-label="Enlarged product photo">
          <button type="button" onClick={() => setIsImageExpanded(false)}
            aria-label="Close enlarged photo" className="absolute right-4 top-4 z-10 rounded-full bg-white px-4 py-2 text-lg font-black text-slate-950">✕</button>
          {images.length > 1 && (
            <button type="button" onClick={() => setActiveImageIndex(index => (index - 1 + images.length) % images.length)}
              aria-label="Previous enlarged photo" className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white px-4 py-2 text-2xl font-black">‹</button>
          )}
          <img src={activeImage} alt={`${product?.name || "Product"} photo ${activeImageIndex + 1}`}
            className="max-h-[90vh] max-w-full object-contain" />
          {images.length > 1 && (
            <button type="button" onClick={() => setActiveImageIndex(index => (index + 1) % images.length)}
              aria-label="Next enlarged photo" className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white px-4 py-2 text-2xl font-black">›</button>
          )}
        </div>
      )}
      <div className="mx-auto max-w-6xl px-5 py-9">
        <p className="mb-5 text-xs font-black uppercase tracking-[0.22em] text-pink-600">Online exclusive · Local pickup</p>
        {loading ? (
          <div className="rounded-3xl bg-white p-10 text-center font-bold">Loading product details from Square...</div>
        ) : !product ? (
          <div className="rounded-3xl bg-white p-10 text-center">
            <h1 className="text-3xl font-black">This item is no longer available online.</h1>
            <p className="mt-3 text-slate-600">{error || "It may have sold out or been removed from our catalog."}</p>
            <a href="/tvs" className="mt-6 inline-block rounded-xl bg-teal-700 px-6 py-3 font-black text-white">Shop TVs & More</a>
          </div>
        ) : (
          <div className="grid gap-8 rounded-[2rem] bg-white p-5 shadow-sm md:grid-cols-2 md:p-8">
            <div className="min-w-0">
              <div className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-3xl bg-[#fff8ef] p-1 sm:p-2">
                {activeImage ? (
                  <button type="button" onClick={() => setIsImageExpanded(true)}
                    className="flex h-full w-full cursor-zoom-in items-center justify-center"
                    aria-label="View larger product photo">
                    <img src={activeImage} alt={`${product.name} photo ${activeImageIndex + 1}`}
                      className="block h-full w-full object-contain" />
                  </button>
                ) : <div className="font-bold text-slate-500">Image coming soon</div>}
                {images.length > 1 && (
                  <>
                    <button type="button" onClick={() => setActiveImageIndex(index => (index - 1 + images.length) % images.length)}
                      aria-label="Previous photo"
                      className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/95 px-3 py-2 text-xl font-black text-slate-800 shadow-md hover:bg-white">‹</button>
                    <button type="button" onClick={() => setActiveImageIndex(index => (index + 1) % images.length)}
                      aria-label="Next photo"
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/95 px-3 py-2 text-xl font-black text-slate-800 shadow-md hover:bg-white">›</button>
                    <span className="absolute bottom-3 right-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-slate-700">
                      {activeImageIndex + 1} / {images.length}
                    </span>
                  </>
                )}
              </div>
              {images.length > 1 && (
                <div className="mt-3 flex gap-2 overflow-x-auto pb-2" aria-label="Product photo thumbnails">
                  {images.map((image, index) => (
                    <button key={`${image}-${index}`} type="button" onClick={() => setActiveImageIndex(index)}
                      aria-label={`Show photo ${index + 1}`}
                      aria-pressed={index === activeImageIndex}
                      className={`h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 bg-white p-1 transition ${
                        index === activeImageIndex ? "border-pink-600" : "border-slate-200 hover:border-pink-300"
                      }`}>
                      <img src={image} alt="" loading="lazy" className="h-full w-full object-contain" />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-col">
              <h1 className="text-3xl font-black leading-tight md:text-4xl">{product.name}</h1>
              {product.sku && <p className="mt-2 text-sm font-semibold text-slate-500">SKU: <span className="font-mono text-slate-700">{product.sku}</span></p>}
              {savings ? <span className="mt-4 w-fit rounded-full bg-pink-600 px-4 py-2 text-sm font-black text-white">Score {savings}% Off</span> : null}
              <div className="mt-6 rounded-2xl border border-pink-100 bg-[#fff8ef] p-5">
                {product.retailPrice && product.retailAmount && product.dealsAmount && product.retailAmount > product.dealsAmount ?
                  <p className="text-sm font-bold text-slate-500">Retail: <span className="line-through">{product.retailPrice}</span></p> : null}
                <p className="mt-2 text-xs font-black uppercase tracking-widest text-pink-600">Your Deal</p>
                <p className="mt-1 text-5xl font-black">{product.dealsPrice || product.price}</p>
              </div>
              <p className="mt-5 font-bold text-teal-700">{product.stockCount === 1 ? "Only 1 left in stock" : `${product.stockCount} available`}</p>
              <div className="mt-5 border-t border-slate-200 pt-5">
                <h2 className="text-lg font-black">Item details</h2>
                <p className="mt-3 whitespace-pre-line break-words leading-7 text-slate-700">{product.description || "Please contact us for more information."}</p>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button onClick={buyNow}
                  disabled={isBuyingNow || !product.variationId || !product.stockCount}
                  className="rounded-xl bg-pink-600 px-3 py-4 text-base font-black text-white transition hover:bg-pink-700 disabled:cursor-not-allowed disabled:opacity-50">
                  {isBuyingNow ? "Opening Checkout..." : "Buy Now"}
                </button>
                <button onClick={addProductToCart}
                  disabled={!product.variationId || !product.stockCount ||
                    cartItems.some(item => item.product.id === product.id && item.quantity >= product.stockCount!)}
                  className="rounded-xl bg-teal-700 px-3 py-4 text-base font-black text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50">
                  Add to Cart
                </button>
              </div>
              <button onClick={copyLink}
                className="mt-3 self-start rounded-md px-2 py-1.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-pink-700">
                {copyDone ? "✓ Link copied" : "🔗 Copy item link"}
              </button>
              <div className="mt-6 rounded-xl bg-[#fff8ef] px-4 py-3 text-sm leading-6 text-slate-600">
                These special finds are only available to order online, and will be ready to pickup the next day we are open!
              </div>
              {error && <p role="alert" className="mt-4 text-sm font-bold text-red-600">{error}</p>}

            </div>
          </div>
        )}
      </div>
    </main>
  );
}
