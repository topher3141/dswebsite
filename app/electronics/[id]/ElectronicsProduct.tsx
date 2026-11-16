"use client";

import { useEffect, useState } from "react";

type Product = {
  id: string; variationId?: string | null; name: string; description?: string;
  image?: string | null; dealsPrice?: string; price: string;
  dealsAmount?: number | null; retailAmount?: number | null; retailPrice?: string;
  stockCount?: number;
};

export default function ElectronicsProduct({ itemId }: { itemId: string }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [checkingOut, setCheckingOut] = useState(false);
  const [copyDone, setCopyDone] = useState(false);
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await fetch("/api/square/featured-items?collection=electronics", { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Unable to load item.");
        const item = (data.products || []).find((p: Product) => p.id === itemId);
        if (active) setProduct(item || null);
      } catch (e: any) {
        if (active) setError(e?.message || "Unable to load item.");
      } finally { if (active) setLoading(false); }
    }
    load();
    return () => { active = false; };
  }, [itemId]);

  async function buyNow() {
    if (!product?.variationId || !product.stockCount || checkingOut) return;
    const tab = window.open("", "_blank");
    setCheckingOut(true);
    setError("");
    try {
      const res = await fetch("/api/square/create-checkout", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: [{ variationId: product.variationId, quantity: 1, itemName: product.name }] }),
      });
      const data = await res.json();
      if (!res.ok || !data.checkoutUrl) throw new Error(data.error || "Unable to start checkout.");
      if (tab) { tab.location.href = data.checkoutUrl; }
      else { window.location.href = data.checkoutUrl; }
    } catch (e: any) {
      tab?.close();
      setError(e?.message || "Unable to start checkout.");
    } finally { setCheckingOut(false); }
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

  const savings = product?.retailAmount && product?.dealsAmount && product.retailAmount > product.dealsAmount
    ? Math.round((1 - product.dealsAmount / product.retailAmount) * 100) : null;

  return (
    <main className="min-h-screen bg-[#f7efe5] text-slate-950">
      <header className="border-b-4 border-pink-500 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
          <a href="/" aria-label="Deals & Steals home"><img src="https://i.imgur.com/euamaJ6.png" alt="Deals & Steals" className="h-12 w-auto" /></a>
          <a href="/electronics" className="rounded-full bg-pink-50 px-5 py-2 text-sm font-black text-pink-700 hover:bg-pink-100">← TVs & More</a>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-5 py-9">
        <p className="mb-5 text-xs font-black uppercase tracking-[0.22em] text-pink-600">Online exclusive · Local pickup</p>
        {loading ? (
          <div className="rounded-3xl bg-white p-10 text-center font-bold">Loading product details from Square...</div>
        ) : !product ? (
          <div className="rounded-3xl bg-white p-10 text-center">
            <h1 className="text-3xl font-black">This item is no longer available online.</h1>
            <p className="mt-3 text-slate-600">{error || "It may have sold out or been removed from our catalog."}</p>
            <a href="/electronics" className="mt-6 inline-block rounded-xl bg-teal-700 px-6 py-3 font-black text-white">Shop TVs & More</a>
          </div>
        ) : (
          <div className="grid gap-8 rounded-[2rem] bg-white p-5 shadow-sm md:grid-cols-2 md:p-8">
            <div className="overflow-hidden rounded-3xl bg-[#fff8ef]">
              {product.image ? <img src={product.image} alt={product.name} className="w-full object-contain" /> :
                <div className="flex min-h-80 items-center justify-center text-slate-500">Image coming soon</div>}
            </div>
            <div className="flex flex-col">
              <h1 className="text-3xl font-black leading-tight md:text-4xl">{product.name}</h1>
              {savings ? <span className="mt-4 w-fit rounded-full bg-pink-600 px-4 py-2 text-sm font-black text-white">Score {savings}% Off</span> : null}
              <div className="mt-6 rounded-2xl border border-pink-100 bg-[#fff8ef] p-5">
                {product.retailPrice && product.retailAmount && product.dealsAmount && product.retailAmount > product.dealsAmount ?
                  <p className="text-sm font-bold text-slate-500">Retail: <span className="line-through">{product.retailPrice}</span></p> : null}
                <p className="mt-2 text-xs font-black uppercase tracking-widest text-pink-600">Your Deal</p>
                <p className="mt-1 text-5xl font-black">{product.dealsPrice || product.price}</p>
              </div>
              <p className="mt-5 font-bold text-teal-700">{product.stockCount === 1 ? "Only 1 left in stock" : `${product.stockCount} available`}</p>
              <p className="mt-4 leading-7 text-slate-600">These special finds are only available to order online, and will be ready to pickup the next day we are open!</p>
              <button onClick={buyNow} disabled={checkingOut || !product.variationId || !product.stockCount}
                className="mt-6 rounded-xl bg-teal-700 px-6 py-4 text-lg font-black text-white hover:bg-teal-800 disabled:opacity-50">
                {checkingOut ? "Opening Secure Checkout..." : "Buy Now · Secure Square Checkout"}
              </button>
              <button onClick={copyLink} className="mt-3 rounded-xl border-2 border-pink-200 px-6 py-3 font-black text-pink-700 hover:bg-pink-50">
                {copyDone ? "✓ Link Copied" : "Copy Link to Share"}
              </button>
              {error && <p role="alert" className="mt-4 text-sm font-bold text-red-600">{error}</p>}
              <div className="mt-8 border-t border-slate-200 pt-5">
                <h2 className="text-lg font-black">Item details</h2>
                <p className="mt-3 whitespace-pre-line break-words leading-7 text-slate-700">{product.description || "Please contact us for more information."}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
