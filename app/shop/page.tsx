"use client";

import React, { useMemo, useState } from "react";

const FACEBOOK_GROUP_URL = "https://www.facebook.com/groups/1956095674576022";
const LOYALTY_URL = "https://app.squareup.com/loyalty/ML6ZZS746Y0MJ";
const MAP_URL = "https://maps.app.goo.gl/X5aRKYCCKWmEKzUD6";
const INVOICE_URL = "https://www.retailogic.dev/";
const LOGO_URL = "https://i.imgur.com/euamaJ6.png";

const CATEGORIES = ["All", "Home", "Electronics", "Apparel", "Toys", "Outdoor", "Seasonal"];

const PRODUCTS = [
  {
    id: 1,
    name: "Ninja Dual Air Fryer",
    category: "Home",
    retail: "$179.99",
    price: "$89.99",
    image: "https://images.unsplash.com/photo-1626201850129-a92f04f2c1ec?q=80&w=900",
    squareUrl: "#",
  },
  {
    id: 2,
    name: "Adidas Cloudfoam Sneakers",
    category: "Apparel",
    retail: "$80.00",
    price: "$34.99",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=900",
    squareUrl: "#",
  },
  {
    id: 3,
    name: "Patio Conversation Set",
    category: "Outdoor",
    retail: "$399.99",
    price: "$199.99",
    image: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=900",
    squareUrl: "#",
  },
  {
    id: 4,
    name: "Roku Smart TV",
    category: "Electronics",
    retail: "$349.99",
    price: "$199.99",
    image: "https://images.unsplash.com/photo-1593784991095-a205069470b6?q=80&w=900",
    squareUrl: "#",
  },
  {
    id: 5,
    name: "KitchenAid Stand Mixer",
    category: "Home",
    retail: "$449.99",
    price: "$249.99",
    image: "https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?q=80&w=900",
    squareUrl: "#",
  },
  {
    id: 6,
    name: "Rolling Tool Chest",
    category: "Home",
    retail: "$599.99",
    price: "$279.99",
    image: "https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?q=80&w=900",
    squareUrl: "#",
  },
  {
    id: 7,
    name: "Kids Ride-On Jeep",
    category: "Toys",
    retail: "$349.99",
    price: "$149.99",
    image: "https://images.unsplash.com/photo-1594736797933-d0501ba2fe65?q=80&w=900",
    squareUrl: "#",
  },
  {
    id: 8,
    name: "Cordless Stick Vacuum",
    category: "Home",
    retail: "$349.99",
    price: "$179.99",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=900",
    squareUrl: "#",
  },
];

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

  return null;
}

export default function ShopPage() {
  const [selectedCategory, setSelectedCategory] = useState("All");

  const visibleProducts = useMemo(() => {
    if (selectedCategory === "All") return PRODUCTS;
    return PRODUCTS.filter((item) => item.category === selectedCategory);
  }, [selectedCategory]);

  return (
    <div className="min-h-screen bg-[#f7efe5] text-slate-900">
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
          <div className="absolute inset-y-0 right-0 hidden w-[48%] bg-gradient-to-l from-[#ffd9ea] via-[#fff1f7] to-transparent lg:block" />
          <div className="absolute -right-10 top-10 hidden h-96 w-96 rounded-full bg-pink-200/70 blur-3xl lg:block" />
          <div className="absolute bottom-6 right-24 hidden h-64 w-64 rounded-full bg-pink-100/45 blur-3xl lg:block" />

          <div className="relative mx-auto max-w-7xl px-5 py-14 lg:py-20">
            <div className="max-w-4xl">
              <div className="mb-5 inline-flex items-center gap-3 rounded-full bg-teal-100 px-5 py-2 text-sm font-black uppercase tracking-wide text-slate-950 shadow-sm">
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-500 opacity-60"></span>
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-teal-600"></span>
                </span>
                <span>Online Shop</span>
              </div>

              <h1 className="text-5xl font-black leading-none tracking-tight text-slate-950 md:text-7xl">
                Shop a curated selection of our best deals.
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-700 md:text-xl">
                These are hand-picked higher-value items available for local pickup. Inventory changes often, so if you see something you love, don’t wait.
              </p>

              <div className="mt-8 flex flex-wrap gap-3 text-sm font-black text-slate-700">
                <span className="rounded-full bg-[#fff8ef] px-4 py-2">📍 Pickup in Glen Burnie</span>
                <span className="rounded-full bg-[#fff8ef] px-4 py-2">🔄 Inventory updates weekly</span>
                <span className="rounded-full bg-[#fff8ef] px-4 py-2">📦 Limited quantities</span>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-10">
          <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.25em] text-pink-600">Browse</p>
              <h2 className="mt-2 text-4xl font-black tracking-tight text-slate-950">Featured Finds</h2>
            </div>

            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`rounded-full border px-5 py-2 text-sm font-black transition ${
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

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {visibleProducts.map((item) => (
              <article
                key={item.id}
                className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >
                <div className="relative">
                  <img src={item.image} alt={item.name} className="h-56 w-full object-cover" />
                  <span className="absolute left-4 top-4 rounded-full bg-pink-600 px-3 py-1 text-xs font-black uppercase text-white">
                    Featured
                  </span>
                </div>

                <div className="p-5">
                  <p className="text-xs font-black uppercase tracking-wide text-teal-700">
                    {item.category}
                  </p>

                  <h3 className="mt-2 min-h-[3.2rem] text-xl font-black leading-tight text-slate-950">
                    {item.name}
                  </h3>

                  <p className="mt-4 text-sm font-bold text-slate-500">
                    Retail: <span className="line-through">{item.retail}</span>
                  </p>

                  <p className="mt-1 text-xs font-black uppercase tracking-wide text-pink-600">
                    Deals & Steals Price
                  </p>

                  <p className="text-3xl font-black text-slate-950">{item.price}</p>

                  <div className="mt-4 space-y-1 text-sm font-bold text-slate-600">
                    <p>✅ Pickup Available</p>
                    <p>✅ Limited Quantity</p>
                  </div>

                  <a
                    href={item.squareUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-teal-700 px-5 py-3 font-black text-white transition hover:bg-teal-800"
                  >
                    View / Buy Item <Icon name="arrow" className="ml-2 h-5 w-5" />
                  </a>
                </div>
              </article>
            ))}
          </div>

          {visibleProducts.length === 0 && (
            <div className="rounded-[2rem] border border-slate-200 bg-white p-10 text-center">
              <h3 className="text-2xl font-black">No items found.</h3>
              <p className="mt-2 text-slate-600">Try a different category or check back soon.</p>
            </div>
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
