"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Product = {
  id: string;
  categories?: string[];
  name: string;
  description?: string;
  image?: string | null;
  dealsPrice?: string;
  dealsAmount?: number | null;
  price?: string;
  priceAmount?: number | null;
  retailPrice?: string;
  retailAmount?: number | null;
  stockCount?: number;
  currency?: string;
};

type SortKey = "name" | "stock" | "price" | "retail" | "savings";
type SortDirection = "asc" | "desc";

const SITE_ORIGIN = "https://www.dealsandstealsmd.com";
const FACEBOOK_URL = "https://www.facebook.com/groups/1956095674576022";

function formatMoney(cents: number | null | undefined) {
  if (typeof cents !== "number" || !Number.isFinite(cents)) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

function productLink(product: Product) {
  return `${SITE_ORIGIN}/tvs/${encodeURIComponent(product.id)}`;
}

function salePrice(product: Product) {
  return product.dealsAmount ?? product.priceAmount ?? null;
}

function savingsPercent(product: Product) {
  const price = salePrice(product);
  if (!product.retailAmount || price == null || product.retailAmount <= price) return null;
  return Math.round((1 - price / product.retailAmount) * 100);
}

function facebookPost(product: Product) {
  const price = salePrice(product);
  const retail = product.retailAmount;
  const lines = [
    `📺 ${product.name}`,
    "",
    `🔥 Our Price: ${formatMoney(price)}`,
  ];
  if (retail && price != null && retail > price) {
    lines.push(`🏷️ Retail: ${formatMoney(retail)} • Save ${savingsPercent(product)}%!`);
  }
  lines.push(
    "",
    "Available to order ONLINE ONLY! Limited quantities.",
    "Ready for pickup the next day we're open.",
    "",
    `🛒 Shop here: ${productLink(product)}`
  );
  return lines.join("\n");
}

export default function AdminInventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"All" | "Televisions" | "Electronics">("All");
  const [sortBy, setSortBy] = useState<SortKey>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [onlyRetail, setOnlyRetail] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");
  const [copied, setCopied] = useState("");

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/square/featured-items?collection=electronics", {
        cache: "no-store",
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to load Square inventory.");
      setProducts(Array.isArray(payload.products) ? payload.products : []);
      setLastUpdated(new Date().toLocaleString());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unable to load Square inventory.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const totals = useMemo(() => ({
    listings: products.length,
    units: products.reduce((sum, p) => sum + (p.stockCount || 0), 0),
    missingRetail: products.filter((p) => !p.retailAmount || p.retailAmount <= 0).length,
    inventoryValue: products.reduce((sum, p) => sum + (salePrice(p) || 0) * (p.stockCount || 0), 0),
  }), [products]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    const filtered = products.filter((p) =>
      (categoryFilter === "All" || (p.categories || []).includes(categoryFilter)) &&
      (!term || p.name.toLowerCase().includes(term) || (p.description || "").toLowerCase().includes(term)) &&
      (!onlyRetail || (p.retailAmount != null && p.retailAmount > 0))
    );
    const value = (p: Product): number | string => {
      switch (sortBy) {
        case "name": return p.name.toLowerCase();
        case "stock": return p.stockCount || 0;
        case "price": return salePrice(p) ?? -1;
        case "retail": return p.retailAmount ?? -1;
        case "savings": return savingsPercent(p) ?? -1;
      }
    };
    return filtered.sort((a, b) => {
      const av = value(a);
      const bv = value(b);
      const comparison = typeof av === "string" && typeof bv === "string"
        ? av.localeCompare(bv) : Number(av) - Number(bv);
      return comparison * (sortDirection === "asc" ? 1 : -1);
    });
  }, [products, search, categoryFilter, sortBy, sortDirection, onlyRetail]);

  function chooseSort(key: SortKey) {
    if (sortBy === key) setSortDirection((previous) => previous === "asc" ? "desc" : "asc");
    else {
      setSortBy(key);
      setSortDirection(key === "name" ? "asc" : "desc");
    }
  }

  async function copy(text: string, identifier: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(identifier);
    } catch {
      window.prompt("Copy this text:", text);
    }
  }

  function sortHeading(title: string, key: SortKey) {
    return (
      <button type="button" onClick={() => chooseSort(key)}
        className="inline-flex items-center gap-1 whitespace-nowrap hover:text-pink-600"
        aria-label={`Sort by ${title}`}>
        {title}<span className="text-xs text-slate-400">{sortBy === key ? (sortDirection === "asc" ? "▲" : "▼") : "↕"}</span>
      </button>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7efe5] px-4 py-8 text-slate-950 md:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.23em] text-pink-600">Deals & Steals · Quick Post</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">TVs & More Inventory</h1>
            <p className="mt-2 text-sm font-medium text-slate-600">
              Live available stock from Square · {lastUpdated ? `Last updated ${lastUpdated}` : "Loading inventory"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href="/tvs" target="_blank" rel="noreferrer"
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-black hover:bg-slate-50">
              View storefront ↗
            </a>
            <button type="button" onClick={() => void load(true)} disabled={loading || refreshing}
              className="rounded-xl bg-teal-700 px-5 py-3 text-sm font-black text-white hover:bg-teal-800 disabled:opacity-50">
              {refreshing ? "Refreshing…" : "↻ Refresh Inventory"}
            </button>
          </div>
        </header>

        <section className="mb-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: "Available listings", value: String(totals.listings) },
            { label: "Total units", value: String(totals.units) },
            { label: "Inventory at selling price", value: formatMoney(totals.inventoryValue) },
            { label: "Missing compare-at price", value: String(totals.missingRetail) },
          ].map((metric) => (
            <div key={metric.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-black uppercase tracking-wide text-slate-500">{metric.label}</p>
              <p className="mt-2 text-2xl font-black md:text-3xl">{metric.value}</p>
            </div>
          ))}
        </section>

        <section className="rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 px-5 pt-5">
            {(["All", "Televisions", "Electronics"] as const).map((category) => {
              const total = category === "All"
                ? products.length
                : products.filter(product => (product.categories || []).includes(category)).length;
              return (
                <button key={category} type="button" onClick={() => setCategoryFilter(category)}
                  aria-pressed={categoryFilter === category}
                  className={`rounded-full border px-4 py-2 text-sm font-black transition ${
                    categoryFilter === category
                      ? "border-teal-700 bg-teal-700 text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:border-teal-400 hover:bg-teal-50"
                  }`}>
                  {category === "All" ? "All Items" : category} ({total})
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 p-5">
            <div className="min-w-[220px] flex-1">
              <label htmlFor="inventory-search" className="mb-2 block text-sm font-black">Find an item</label>
              <input id="inventory-search" type="search" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search product or description…" className="w-full max-w-xl rounded-xl border-2 border-slate-200 p-3 text-sm outline-none focus:border-pink-300" />
            </div>
            <label className="flex cursor-pointer items-center gap-2 pb-3 text-sm font-bold text-slate-700">
              <input type="checkbox" checked={onlyRetail} onChange={(e) => setOnlyRetail(e.target.checked)}
                className="h-4 w-4 accent-teal-700" />
              With compare-at price
            </label>
            <p className="pb-3 text-sm font-bold text-slate-500">{visible.length} items shown</p>
          </div>

          {error && <div role="alert" className="m-5 rounded-xl bg-red-50 p-4 text-sm font-bold text-red-700">{error}</div>}
          {loading ? (
            <p className="p-10 text-center font-bold text-slate-600">Loading live inventory from Square…</p>
          ) : visible.length === 0 ? (
            <p className="p-10 text-center font-bold text-slate-500">No available items match these filters.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] border-collapse text-left text-sm">
                <thead className="bg-slate-50 text-xs font-black uppercase tracking-wide text-slate-600">
                  <tr>
                    <th scope="col" className="px-5 py-4">{sortHeading("Item", "name")}</th>
                    <th scope="col" className="px-3 py-4 text-right">{sortHeading("Qty", "stock")}</th>
                    <th scope="col" className="px-3 py-4 text-right">{sortHeading("Our Price", "price")}</th>
                    <th scope="col" className="px-3 py-4 text-right">{sortHeading("Compare At", "retail")}</th>
                    <th scope="col" className="px-3 py-4 text-right">{sortHeading("Savings", "savings")}</th>
                    <th scope="col" className="px-5 py-4 text-right">Quick Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visible.map((product) => (
                    <tr key={product.id} className="transition hover:bg-[#fff9f3]">
                      <td className="px-5 py-3">
                        <div className="flex min-w-[230px] items-center gap-3">
                          {product.image ? <img src={product.image} alt="" loading="lazy" className="h-16 w-16 shrink-0 rounded-lg bg-slate-100 object-contain" /> :
                            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-400">No photo</div>}
                          <div className="min-w-0">
                            <a href={productLink(product)} target="_blank" rel="noreferrer"
                              className="line-clamp-2 font-black leading-5 text-slate-900 hover:text-pink-600">{product.name}</a>
                            <p className="mt-1 text-xs text-slate-400">{product.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right font-black">
                        <span className={(product.stockCount || 0) <= 3 ? "text-pink-600" : "text-teal-700"}>
                          {product.stockCount ?? 0}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-right font-black">{formatMoney(salePrice(product))}</td>
                      <td className="whitespace-nowrap px-3 py-3 text-right font-semibold text-slate-600">
                        {formatMoney(product.retailAmount)}
                      </td>
                      <td className="px-3 py-3 text-right font-black text-pink-600">
                        {savingsPercent(product) == null ? "—" : `${savingsPercent(product)}%`}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-2">
                          <a href={productLink(product)} target="_blank" rel="noreferrer"
                            className="rounded-lg border border-slate-200 px-3 py-2 font-bold hover:bg-slate-50">View ↗</a>
                          <button type="button" onClick={() => void copy(productLink(product), `link-${product.id}`)}
                            className="whitespace-nowrap rounded-lg bg-teal-700 px-3 py-2 font-black text-white hover:bg-teal-800">
                            {copied === `link-${product.id}` ? "✓ Copied" : "Copy Link"}
                          </button>
                          <button type="button" onClick={() => void copy(facebookPost(product), `post-${product.id}`)}
                            className="whitespace-nowrap rounded-lg bg-pink-50 px-3 py-2 font-black text-pink-700 hover:bg-pink-100">
                            {copied === `post-${product.id}` ? "✓ Copied" : "Copy Post"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
        <footer className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
          <p>Only currently in-stock items appear. Compare-at values use Square MSRP or detected retail prices.</p>
          <a href={FACEBOOK_URL} target="_blank" rel="noreferrer" className="font-bold text-pink-700 hover:underline">
            Open Facebook Group ↗
          </a>
        </footer>
      </div>
    </main>
  );
}
