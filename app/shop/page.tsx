"use client";

import React, { useEffect, useMemo, useState } from "react";

const FACEBOOK_GROUP_URL = "https://www.facebook.com/groups/1956095674576022";
const LOYALTY_URL = "https://app.squareup.com/loyalty/ML6ZZS746Y0MJ";
const MAP_URL = "https://maps.app.goo.gl/X5aRKYCCKWmEKzUD6";
const INVOICE_URL = "https://www.retailogic.dev/";
const LOGO_URL = "https://i.imgur.com/euamaJ6.png";

const CATEGORIES = ["All"];

type Product = {
  id: string;
  variationId?: string | null;
  name: string;
  description?: string;
  price: string;
  dealsPrice?: string;
  dealsAmount?: number | null;
  retailPrice?: string;
  retailAmount?: number | null;
  priceAmount?: number | null;
  currency?: string;
  image?: string | null;
  squareUrl?: string | null;
  stockCount?: number;
  lowStock?: boolean;
};

type CartItem = {
  product: Product;
  quantity: number;
};

function Icon({ name, className = "" }: { name: string; className?: string }) {
  const common = `h-6 w-6 ${className}`;

  if (name === "facebook") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M14 8.5V7.2c0-.7.2-1.2 1.2-1.2H17V3h-2.7C11.6 3 10 4.6 10 7v1.5H8v3h2V21h4v-9.5h2.7l.3-3H14z" />
      </svg>
    );
  }

  if (name === "arrow") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M5 12h14" />
        <path d="M13 6l6 6-6 6" />
      </svg>
    );
  }

  if (name === "map") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 21s7-5.1 7-11a7 7 0 1 0-14 0c0 5.9 7 11 7 11z" />
        <circle cx="12" cy="10" r="2.5" />
      </svg>
    );
  }

  if (name === "user") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c1.8-4.2 5-6 8-6s6.2 1.8 8 6" />
      </svg>
    );
  }

  if (name === "close") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
      </svg>
    );
  }

  if (name === "search") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
    );
  }

  if (name === "cart") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 6h15l-1.5 9h-12z" />
        <path d="M6 6 5.2 3H3" />
        <circle cx="9" cy="20" r="1.5" />
        <circle cx="18" cy="20" r="1.5" />
      </svg>
    );
  }

  return null;
}

function formatCents(amount?: number | null, currency = "USD") {
  if (typeof amount !== "number" || !Number.isFinite(amount)) return "$0.00";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount / 100);
}

function getSavingsPercent(item: Product) {
  if (!item.retailAmount || !item.dealsAmount) return null;
  if (item.retailAmount <= item.dealsAmount) return null;

  const savings = Math.round(((item.retailAmount - item.dealsAmount) / item.retailAmount) * 100);
  return savings > 0 ? savings : null;
}

function StockLine({ item }: { item: Product }) {
  const stockCount = item.stockCount || 0;

  if (stockCount <= 0) return null;

  const stockClass =
    stockCount === 1
      ? "text-yellow-600"
      : stockCount <= 3
        ? "text-pink-600"
        : "text-teal-700";

  return (
    <p className={`mt-3 text-sm font-black ${stockClass}`}>
      {stockCount === 1 ? "Only 1 left in stock" : `${stockCount} left in stock`}
    </p>
  );
}

function RetailCompare({
  retailPrice,
}: {
  retailPrice?: string;
}) {
  if (!retailPrice) return null;

  return (
    <div className="mb-2 flex flex-wrap items-center gap-2">
      <span className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
        Retail
      </span>

      <span className="relative inline-flex rotate-[-2deg] items-center rounded-lg bg-white px-2 py-1 text-lg font-black text-slate-500 shadow-sm">
        <span>{retailPrice}</span>
        <span className="absolute left-1/2 top-1/2 h-[3px] w-[118%] -translate-x-1/2 -translate-y-1/2 rotate-[-12deg] rounded-full bg-pink-600" />
      </span>
    </div>
  );
}

function DealPriceBlock({ item, large = false }: { item: Product; large?: boolean }) {
  const hasRetail =
    Boolean(item.retailPrice) &&
    Boolean(item.retailAmount) &&
    Boolean(item.dealsAmount) &&
    Number(item.retailAmount) > Number(item.dealsAmount);

  return (
    <div className="rounded-2xl border border-pink-100 bg-gradient-to-br from-[#fff8ef] via-white to-[#fff1f7] p-4 shadow-sm">
      {hasRetail && (
        <RetailCompare retailPrice={item.retailPrice} />
      )}

      <p className="text-xs font-black uppercase tracking-[0.18em] text-pink-600">
        Your Deal
      </p>

      <p className={`${large ? "text-5xl" : "text-4xl"} font-black leading-none tracking-tight text-slate-950`}>
        {item.dealsPrice || item.price}
      </p>
    </div>
  );
}

function ProductDescriptionModal({
  product,
  onClose,
  onAddToCart,
  cartQuantity,
}: {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
  cartQuantity: number;
}) {
  if (!product) return null;

  const savingsPercent = getSavingsPercent(product);
  const stockCount = product.stockCount || 0;
  const canAddMore = stockCount <= 0 || cartQuantity < stockCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-5 py-8">
      <div className="relative max-h-[90vh] w-full max-w-3xl overflow-auto rounded-[2rem] bg-white p-6 shadow-2xl md:p-8">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-700 shadow-md transition hover:bg-slate-100"
          aria-label="Close description"
        >
          <Icon name="close" className="h-5 w-5" />
        </button>

        <div className="grid gap-7 md:grid-cols-[.9fr_1.1fr]">
          <div>
            {product.image ? (
              <div className="relative">
                <img
                  src={product.image}
                  alt={product.name}
                  className="h-80 w-full rounded-[1.5rem] object-cover"
                />

                {savingsPercent && (
                  <div className="absolute left-4 top-4 rotate-[-2deg] rounded-full bg-pink-600 px-4 py-2 text-sm font-black uppercase tracking-wide text-white shadow-md">
                    Score {savingsPercent}% Off
                  </div>
                )}
              </div>
            ) : (
              <div className="flex h-80 w-full items-center justify-center rounded-[1.5rem] bg-[#fff8ef] text-sm font-black uppercase tracking-wide text-slate-500">
                Image Coming Soon
              </div>
            )}
          </div>

          <div>
            <p className="text-sm font-black uppercase tracking-[0.25em] text-pink-600">
              Item details
            </p>

            <h3 className="mt-3 pr-10 text-3xl font-black leading-tight text-slate-950">
              {product.name}
            </h3>

            <div className="mt-5">
              <DealPriceBlock item={product} large />
            </div>

            <StockLine item={product} />

            <p className="mt-4 flex items-center gap-2 text-sm font-bold text-slate-600">
              <span className="text-teal-700">✅</span>
              <span>Local pickup only</span>
            </p>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => onAddToCart(product)}
                disabled={!product.variationId || !canAddMore}
                className={`inline-flex flex-1 items-center justify-center rounded-xl px-5 py-3 font-black transition ${
                  product.variationId && canAddMore
                    ? "bg-teal-700 text-white hover:bg-teal-800"
                    : "cursor-not-allowed bg-slate-300 text-slate-600"
                }`}
              >
                Add to Cart
              </button>

              <button
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-xl border-2 border-slate-200 bg-white px-5 py-3 font-black text-slate-800 transition hover:bg-slate-50"
              >
                Keep Browsing
              </button>
            </div>

            {cartQuantity > 0 && (
              <p className="mt-3 text-sm font-bold text-slate-500">
                You have {cartQuantity} in your cart.
              </p>
            )}
          </div>
        </div>

        <div className="mt-7 border-t border-slate-200 pt-6">
          <p className="whitespace-pre-line text-base leading-8 text-slate-700">
            {product.description || "More details available in store."}
          </p>
        </div>
      </div>
    </div>
  );
}

function CartDrawer({
  isOpen,
  cartItems,
  onClose,
  onIncrease,
  onDecrease,
  onRemove,
  onCheckout,
  isCheckingOut,
}: {
  isOpen: boolean;
  cartItems: CartItem[];
  onClose: () => void;
  onIncrease: (product: Product) => void;
  onDecrease: (product: Product) => void;
  onRemove: (product: Product) => void;
  onCheckout: () => void;
  isCheckingOut: boolean;
}) {
  const subtotal = cartItems.reduce((sum, item) => {
    return sum + (item.product.dealsAmount || item.product.priceAmount || 0) * item.quantity;
  }, 0);

  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        className="absolute inset-0 bg-slate-950/60"
        onClick={onClose}
        aria-label="Close cart"
      />

      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 p-5">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-pink-600">
              Your Cart
            </p>
            <h2 className="text-2xl font-black text-slate-950">
              {itemCount === 1 ? "1 item" : `${itemCount} items`}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-slate-200"
            aria-label="Close cart"
          >
            <Icon name="close" className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-5">
          {cartItems.length === 0 ? (
            <div className="rounded-[1.5rem] bg-[#fff8ef] p-6 text-center">
              <p className="text-2xl font-black text-slate-950">Your cart is empty.</p>
              <p className="mt-2 text-sm font-bold text-slate-600">
                Add a deal before someone else scores it.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {cartItems.map((cartItem) => {
                const product = cartItem.product;
                const stockCount = product.stockCount || 0;
                const canIncrease = stockCount <= 0 || cartItem.quantity < stockCount;

                return (
                  <div key={product.id} className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex gap-4">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-20 w-20 rounded-2xl object-cover"
                        />
                      ) : (
                        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-[#fff8ef] text-xs font-black text-slate-400">
                          No Image
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm font-black leading-5 text-slate-950">
                          {product.name}
                        </p>

                        <p className="mt-1 text-lg font-black text-pink-600">
                          {product.dealsPrice || product.price}
                        </p>

                        <div className="mt-3 flex items-center justify-between gap-3">
                          <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50">
                            <button
                              onClick={() => onDecrease(product)}
                              className="px-3 py-1.5 text-lg font-black text-slate-700 hover:text-pink-600"
                              aria-label="Decrease quantity"
                            >
                              -
                            </button>

                            <span className="min-w-8 text-center text-sm font-black">
                              {cartItem.quantity}
                            </span>

                            <button
                              onClick={() => onIncrease(product)}
                              disabled={!canIncrease}
                              className={`px-3 py-1.5 text-lg font-black ${
                                canIncrease
                                  ? "text-slate-700 hover:text-pink-600"
                                  : "cursor-not-allowed text-slate-300"
                              }`}
                              aria-label="Increase quantity"
                            >
                              +
                            </button>
                          </div>

                          <button
                            onClick={() => onRemove(product)}
                            className="text-xs font-black uppercase tracking-wide text-slate-400 transition hover:text-pink-600"
                          >
                            Remove
                          </button>
                        </div>

                        {stockCount > 0 && (
                          <p className="mt-2 text-xs font-bold text-slate-500">
                            {stockCount} available
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 p-5">
          <div className="mb-4 flex items-center justify-between text-lg font-black">
            <span>Subtotal</span>
            <span>{formatCents(subtotal)}</span>
          </div>

          <p className="mb-4 text-xs font-bold leading-5 text-slate-500">
            Taxes and any checkout fees are calculated by Square. Pickup is local only.
          </p>

          <button
            onClick={onCheckout}
            disabled={cartItems.length === 0 || isCheckingOut}
            className={`inline-flex w-full items-center justify-center rounded-xl px-5 py-4 font-black transition ${
              cartItems.length > 0 && !isCheckingOut
                ? "bg-pink-600 text-white hover:bg-pink-700"
                : "cursor-not-allowed bg-slate-300 text-slate-600"
            }`}
          >
            {isCheckingOut ? "Opening Checkout..." : "Checkout with Square"}
          </button>
        </div>
      </aside>
    </div>
  );
}

export default function ShopPage() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [checkoutError, setCheckoutError] = useState("");
  const [isCheckingOutCart, setIsCheckingOutCart] = useState(false);

  useEffect(() => {
    async function loadProducts() {
      try {
        const response = await fetch("/api/square/featured-items", {
          cache: "no-store",
        });

        const contentType = response.headers.get("content-type") || "";

        if (!contentType.includes("application/json")) {
          throw new Error(
            `Featured items route returned ${response.status}. Check /api/square/featured-items.`
          );
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || "Unable to load products");
        }

        setProducts(data.products || []);
      } catch (err: any) {
        setError(err.message || "Unable to load products");
      } finally {
        setIsLoading(false);
      }
    }

    loadProducts();
  }, []);

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const selectedProductCartQuantity = selectedProduct
    ? cartItems.find((item) => item.product.id === selectedProduct.id)?.quantity || 0
    : 0;

  const visibleProducts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return products.filter((item) => {
      const matchesCategory = selectedCategory === "All";
      const matchesSearch =
        normalizedSearch.length === 0 ||
        item.name.toLowerCase().includes(normalizedSearch) ||
        String(item.description || "").toLowerCase().includes(normalizedSearch);

      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, products, searchTerm]);

  function addToCart(product: Product) {
    if (!product.variationId) return;

    setCartItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.product.id === product.id);
      const stockCount = product.stockCount || 0;

      if (existingItem) {
        if (stockCount > 0 && existingItem.quantity >= stockCount) {
          return currentItems;
        }

        return currentItems.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...currentItems, { product, quantity: 1 }];
    });

    setIsCartOpen(true);
  }

  function decreaseCartQuantity(product: Product) {
    setCartItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.product.id === product.id);

      if (!existingItem) return currentItems;

      if (existingItem.quantity <= 1) {
        return currentItems.filter((item) => item.product.id !== product.id);
      }

      return currentItems.map((item) =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity - 1 }
          : item
      );
    });
  }

  function removeFromCart(product: Product) {
    setCartItems((currentItems) =>
      currentItems.filter((item) => item.product.id !== product.id)
    );
  }

  async function checkoutCart() {
    const checkoutWindow = window.open("", "_blank", "noopener,noreferrer");

    try {
      setCheckoutError("");
      setIsCheckingOutCart(true);

      const response = await fetch("/api/square/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: cartItems.map((item) => ({
            variationId: item.product.variationId,
            quantity: item.quantity,
            itemName: item.product.name,
          })),
        }),
      });

      const contentType = response.headers.get("content-type") || "";

      if (!contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Non-JSON checkout response:", text);
        checkoutWindow?.close();

        throw new Error(
          `Checkout route returned ${response.status}. This means /api/square/create-checkout is not being found or is returning an HTML error page.`
        );
      }

      const data = await response.json();

      if (!response.ok) {
        checkoutWindow?.close();
        throw new Error(data?.error || "Unable to create checkout");
      }

      if (!data.checkoutUrl) {
        checkoutWindow?.close();
        throw new Error("Square did not return a checkout link.");
      }

      if (checkoutWindow) {
        checkoutWindow.location.href = data.checkoutUrl;
        checkoutWindow.focus();
      } else {
        window.location.href = data.checkoutUrl;
      }
    } catch (err: any) {
      setCheckoutError(err.message || "Unable to start checkout");
    } finally {
      setIsCheckingOutCart(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f7efe5] text-slate-900">
      <ProductDescriptionModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={addToCart}
        cartQuantity={selectedProductCartQuantity}
      />

      <CartDrawer
        isOpen={isCartOpen}
        cartItems={cartItems}
        onClose={() => setIsCartOpen(false)}
        onIncrease={addToCart}
        onDecrease={decreaseCartQuantity}
        onRemove={removeFromCart}
        onCheckout={checkoutCart}
        isCheckingOut={isCheckingOutCart}
      />

      <header className="sticky top-0 z-40 border-b-4 border-pink-500 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between">
          <a href="/" className="inline-flex items-center gap-3">
            <img src={LOGO_URL} alt="Deals & Steals logo" className="h-11 w-auto object-contain md:h-12 lg:h-14" />
          </a>

          <nav className="flex flex-wrap items-center gap-4 text-sm font-bold text-slate-700 md:gap-6">
            <a href="/#difference" className="hover:text-pink-600">Why Us</a>
            <a href="/#hours" className="hover:text-pink-600">Hours</a>
            <a href="/#visit" className="hover:text-pink-600">Visit Us</a>
            <a href="/shop" className="font-black text-pink-600">Shop</a>

            <button
              onClick={() => setIsCartOpen(true)}
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-pink-100 bg-pink-50 text-pink-600 transition hover:bg-pink-100"
              aria-label="Open cart"
            >
              <Icon name="cart" className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -right-2 -top-2 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-pink-600 px-1.5 text-xs font-black text-white">
                  {cartCount}
                </span>
              )}
            </button>

            <a
              href={INVOICE_URL}
              target="_blank"
              rel="noreferrer"
              title="Click here to view and pay your weekly invoice."
              className="rounded-full bg-pink-600 px-4 py-2 text-white shadow-sm transition hover:bg-pink-700"
            >
              Pay Invoice
            </a>

            <a
              href={LOYALTY_URL}
              target="_blank"
              rel="noreferrer"
              aria-label="Join loyalty rewards"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-sky-100 bg-sky-50 text-slate-700 transition hover:border-sky-200 hover:bg-sky-100 hover:text-sky-700"
            >
              <Icon name="user" className="h-5 w-5" />
            </a>
          </nav>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden bg-white">
          <div className="absolute inset-y-0 right-0 hidden w-[42%] bg-gradient-to-l from-[#ffd9ea] via-[#fff1f7] to-transparent lg:block" />
          <div className="absolute -right-16 top-0 hidden h-72 w-72 rounded-full bg-pink-200/70 blur-3xl lg:block" />

          <div className="relative mx-auto max-w-7xl px-5 py-9 lg:py-12">
            <div className="grid gap-6 lg:grid-cols-[1fr_.42fr] lg:items-center">
              <div>
                <div className="mb-4 inline-flex items-center gap-3 rounded-full bg-teal-100 px-5 py-2 text-xs font-black uppercase tracking-wide text-slate-950 shadow-sm">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-500 opacity-60"></span>
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-teal-600"></span>
                  </span>
                  <span>Online Shop</span>
                </div>

                <h1 className="max-w-4xl text-4xl font-black leading-none tracking-tight text-slate-950 md:text-6xl">
                  Score the kind of deals worth bragging about.
                </h1>

                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-700 md:text-lg">
                  Hand-picked Deals & Steals finds available for local pickup. Fresh items, limited quantities, and prices that feel like a win.
                </p>

                <div className="mt-5 flex flex-wrap gap-3 text-sm font-black text-slate-700">
                  <span className="rounded-full bg-[#fff8ef] px-4 py-2">📍 Pickup in Glen Burnie</span>
                  <span className="rounded-full bg-[#fff8ef] px-4 py-2">🔄 Inventory updates weekly</span>
                </div>
              </div>

              <div className="rounded-[1.5rem] border-2 border-pink-100 bg-[#fff8ef] p-5 shadow-sm">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-pink-600">
                  Deal drop
                </p>
                <p className="mt-2 text-3xl font-black leading-none text-slate-950">
                  Limited finds.
                </p>
                <p className="text-3xl font-black leading-none text-pink-600">
                  Big savings.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-8">
          <div className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.25em] text-pink-600">Browse</p>
              <h2 className="mt-2 text-4xl font-black tracking-tight text-slate-950">Featured Finds</h2>
            </div>

            <div className="flex w-full flex-col gap-3 lg:w-auto lg:min-w-[520px] lg:flex-row lg:items-center lg:justify-end">
              <div className="relative w-full lg:max-w-md">
                <Icon name="search" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search deals..."
                  className="w-full rounded-2xl border-2 border-slate-200 bg-white py-4 pl-12 pr-4 text-base font-bold text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-pink-300 focus:ring-4 focus:ring-pink-100"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`rounded-full border px-5 py-3 text-sm font-black transition ${
                      selectedCategory === category
                        ? "border-teal-700 bg-teal-700 text-white"
                        : "border-slate-300 bg-white text-slate-800 hover:bg-teal-50"
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {checkoutError && (
            <div className="mb-6 rounded-[1.5rem] border border-pink-200 bg-white p-5 text-pink-700">
              <p className="font-black">Checkout error</p>
              <p className="mt-1 text-sm">{checkoutError}</p>
            </div>
          )}

          {isLoading && (
            <div className="rounded-[2rem] border border-slate-200 bg-white p-10 text-center">
              <h3 className="text-2xl font-black">Loading featured finds...</h3>
              <p className="mt-2 text-slate-600">Pulling the latest items and inventory counts from Square.</p>
            </div>
          )}

          {error && (
            <div className="rounded-[2rem] border border-pink-200 bg-white p-10 text-center">
              <h3 className="text-2xl font-black text-pink-600">Unable to load items.</h3>
              <p className="mt-2 text-slate-600">{error}</p>
            </div>
          )}

          {!isLoading && !error && (
            <>
              <div className="grid auto-rows-fr gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {visibleProducts.map((item) => {
                  const savingsPercent = getSavingsPercent(item);
                  const cartQuantity = cartItems.find((cartItem) => cartItem.product.id === item.id)?.quantity || 0;
                  const stockCount = item.stockCount || 0;
                  const canAddMore = Boolean(item.variationId) && (stockCount <= 0 || cartQuantity < stockCount);

                  return (
                    <article
                      key={item.id}
                      className="group flex h-full overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                    >
                      <div className="flex w-full flex-col">
                        <button
                          onClick={() => setSelectedProduct(item)}
                          className="relative overflow-hidden text-left"
                        >
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="h-56 w-full object-cover transition duration-700 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-56 w-full items-center justify-center bg-[#fff8ef] text-sm font-black uppercase tracking-wide text-slate-500">
                              Image Coming Soon
                            </div>
                          )}

                          {savingsPercent && (
                            <div className="absolute left-4 top-4 rotate-[-2deg] rounded-full bg-pink-600 px-4 py-2 text-sm font-black uppercase tracking-wide text-white shadow-md">
                              Score {savingsPercent}% Off
                            </div>
                          )}
                        </button>

                        <div className="flex flex-1 flex-col p-5">
                          <button
                            onClick={() => setSelectedProduct(item)}
                            className="text-left"
                          >
                            <h3 className="min-h-[4.8rem] text-xl font-black leading-tight text-slate-950 transition hover:text-pink-600">
                              {item.name}
                            </h3>
                          </button>

                          <div className="mt-3 min-h-[4.5rem]">
                            {item.description ? (
                              <>
                                <p className="line-clamp-3 text-sm leading-6 text-slate-600">
                                  {item.description}
                                </p>

                                <button
                                  onClick={() => setSelectedProduct(item)}
                                  className="mt-2 text-sm font-black text-pink-600 transition hover:text-pink-700"
                                >
                                  View details
                                </button>
                              </>
                            ) : (
                              <p className="text-sm leading-6 text-slate-400">
                                More details available in store.
                              </p>
                            )}
                          </div>

                          <div className="mt-auto pt-4">
                            <DealPriceBlock item={item} />

                            <StockLine item={item} />

                            <p className="mt-4 flex items-center gap-2 text-sm font-bold text-slate-600">
                              <span className="text-teal-700">✅</span>
                              <span>Local pickup only</span>
                            </p>

                            <button
                              onClick={() => addToCart(item)}
                              disabled={!canAddMore}
                              className={`mt-5 inline-flex w-full items-center justify-center rounded-xl px-5 py-3 font-black transition ${
                                canAddMore
                                  ? "bg-teal-700 text-white hover:bg-teal-800"
                                  : "cursor-not-allowed bg-slate-300 text-slate-600"
                              }`}
                            >
                              {cartQuantity > 0 ? "Add Another" : "Add to Cart"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              {visibleProducts.length === 0 && (
                <div className="rounded-[2rem] border border-slate-200 bg-white p-10 text-center">
                  <h3 className="text-2xl font-black">No matching items found.</h3>
                  <p className="mt-2 text-slate-600">
                    Try a different search or check back soon for the next deal drop.
                  </p>
                </div>
              )}
            </>
          )}
        </section>

        <section className="bg-pink-600 px-5 py-14 text-white">
          <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-[1fr_.8fr] md:items-center">
            <div>
              <p className="font-black uppercase tracking-[0.25em] text-pink-100">The treasure hunt continues</p>
              <h2 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
                Want first access to more deals?
              </h2>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-pink-50">
                Our shop page is just a small sample. Join the Facebook group for weekly posts, live sales, and fresh finds.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row md:flex-col">
              <a
                href={FACEBOOK_GROUP_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-xl bg-white px-7 py-4 font-black text-pink-700 shadow-md transition hover:bg-slate-100"
              >
                Join Facebook Group <Icon name="facebook" className="ml-2 h-5 w-5" />
              </a>
              <a
                href={MAP_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-xl border-2 border-white px-7 py-4 font-black text-white transition hover:bg-white/10"
              >
                Visit the Store <Icon name="map" className="ml-2 h-5 w-5" />
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t-4 border-slate-950 bg-white px-5 py-10 text-slate-700">
        <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-3">
          <div>
            <p className="text-lg font-black text-slate-950">Deals & Steals</p>
            <p className="mt-3 text-sm font-bold tracking-[0.18em] text-pink-600">shop small, SAVE BIG.</p>
          </div>

          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-pink-600">Hours</p>
            <div className="mt-3 flex flex-col gap-2 text-sm font-bold">
              <p>Thursday: 1 PM - 7 PM</p>
              <p>Friday: 1 PM - 7 PM</p>
              <p>Saturday: 11 AM - 3 PM</p>
            </div>
          </div>

          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-sky-600">Connect</p>
            <div className="mt-3 flex flex-col gap-3 text-sm font-bold">
              <a href={FACEBOOK_GROUP_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-pink-600">
                <Icon name="facebook" className="h-3.5 w-3.5" /> Join Our Facebook Group
              </a>
              <a href={LOYALTY_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-pink-600">
                <Icon name="user" className="h-3.5 w-3.5" /> Join Loyalty Rewards
              </a>
              <a href={MAP_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-pink-600">
                <Icon name="map" className="h-3.5 w-3.5" /> Get Directions
              </a>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-8 max-w-7xl border-t border-slate-200 pt-5 text-center text-sm font-medium text-slate-500">
          <a href={MAP_URL} target="_blank" rel="noreferrer" className="transition hover:text-pink-600">
            510 McCormick Drive | Suite B | Glen Burnie, MD 21061
          </a>
        </div>
      </footer>
    </div>
  );
}
