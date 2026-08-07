"use client";

import React, { useMemo, useState } from "react";
import { auctions, type Auction } from "./auction-data";

const FACEBOOK_GROUP_URL = "https://www.facebook.com/groups/1956095674576022";
const LOYALTY_URL = "https://app.squareup.com/loyalty/ML6ZZS746Y0MJ";
const MAP_URL = "https://maps.app.goo.gl/X5aRKYCCKWmEKzUD6";
const INVOICE_URL = "https://www.retailogic.dev/";
const LOGO_URL = "https://i.imgur.com/euamaJ6.png";

function Icon({ name, className = "" }: { name: string; className?: string }) {
  const common = `h-6 w-6 ${className}`;

  if (name === "facebook") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M14 8.5V7.2c0-.7.2-1.2 1.2-1.2H17V3h-2.7C11.6 3 10 4.6 10 7v1.5H8v3h2V21h4v-9.5h2.7l.3-3H14z" />
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

function getAuctionDateParts(closesAt: string) {
  const closeDate = new Date(closesAt);

  return {
    date: new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(closeDate),
    time: new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    }).format(closeDate),
  };
}

function isAuctionVisible(auction: Auction) {
  const closeDate = new Date(auction.closesAt);
  const hideAfter = new Date(closeDate);
  hideAfter.setDate(hideAfter.getDate() + 1);

  return new Date() < hideAfter;
}

function PickupHours({ auction }: { auction: Auction }) {
  if (auction.pickupWindows && auction.pickupWindows.length > 0) {
    return (
      <div className="mt-5 rounded-2xl border border-teal-100 bg-teal-50 p-4">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-800">
          Pickup Hours
        </p>

        {auction.pickupText && (
          <p className="mt-1 text-sm font-bold leading-6 text-slate-700">
            {auction.pickupText}
          </p>
        )}

        <div className="mt-4 grid gap-3">
          {auction.pickupWindows.map((window) => (
            <div
              key={`${window.day}-${window.date}`}
              className="flex flex-col rounded-xl bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm font-black text-slate-950">
                  {window.day}
                </p>
                <p className="text-sm font-bold text-slate-500">
                  {window.date}
                </p>
              </div>

              <p className="mt-2 text-lg font-black text-teal-800 sm:mt-0">
                {window.hours}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!auction.pickupText) return null;

  return (
    <div className="mt-5 rounded-2xl border border-teal-100 bg-teal-50 p-4">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-800">
        Pickup
      </p>
      <p className="mt-1 text-sm font-bold leading-6 text-slate-700">
        {auction.pickupText}
      </p>
    </div>
  );
}

function AuctionCard({ auction }: { auction: Auction }) {
  const closeDateParts = getAuctionDateParts(auction.closesAt);

  return (
    <article className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className="grid gap-0 lg:grid-cols-[.9fr_1.1fr]">
        <div className="relative min-h-72 overflow-hidden bg-[#fff8ef]">
          {auction.imageUrl ? (
            <img
              src={auction.imageUrl}
              alt={auction.title}
              className="h-full min-h-72 w-full object-cover"
            />
          ) : (
            <div className="flex h-full min-h-72 items-center justify-center text-sm font-black uppercase tracking-wide text-slate-500">
              Auction Image Coming Soon
            </div>
          )}

          <div className="absolute left-5 top-5 rotate-[-2deg] rounded-full bg-pink-600 px-4 py-2 text-sm font-black uppercase tracking-wide text-white shadow-md">
            Upcoming Auction
          </div>
        </div>

        <div className="flex flex-col p-6 md:p-8">
          <p className="text-sm font-black uppercase tracking-[0.25em] text-pink-600">
            Rasmus Auction
          </p>

          <h2 className="mt-3 text-3xl font-black leading-tight text-slate-950 md:text-4xl">
            {auction.title}
          </h2>

          <p className="mt-4 text-base leading-7 text-slate-700">
            {auction.subtitle}
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-[#fff8ef] p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                Date
              </p>
              <p className="mt-1 text-lg font-black leading-tight text-slate-950">
                {closeDateParts.date}
              </p>

              <p className="mt-4 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                Time
              </p>
              <p className="mt-1 text-lg font-black leading-tight text-pink-600">
                {closeDateParts.time}
              </p>
            </div>

            <div className="rounded-2xl bg-[#fff8ef] p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                Pickup Location
              </p>
              <p className="mt-1 text-lg font-black leading-tight text-slate-950">
                {auction.location}
              </p>
            </div>
          </div>

          <PickupHours auction={auction} />

          {auction.notes && (
            <p className="mt-4 text-sm font-bold leading-6 text-slate-500">
              {auction.notes}
            </p>
          )}

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <a
              href={auction.auctionUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex flex-1 items-center justify-center rounded-xl bg-pink-600 px-6 py-4 font-black text-white shadow-sm transition hover:bg-pink-700"
            >
              View Auction & Bid
            </a>

            <a
              href="#faq"
              className="inline-flex items-center justify-center rounded-xl border-2 border-slate-200 bg-white px-6 py-4 font-black text-slate-800 transition hover:bg-slate-50"
            >
              How It Works
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function AuctionsPage() {
  const [showClosed, setShowClosed] = useState(false);

  const visibleAuctions = useMemo(() => {
    return auctions.filter((auction) => showClosed || isAuctionVisible(auction));
  }, [showClosed]);

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
            <a href="/shop" className="hover:text-pink-600">Shop</a>
            <a href="/auctions" className="font-black text-pink-600">Auctions</a>

            <a
              href={INVOICE_URL}
              target="_blank"
              rel="noreferrer"
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

          <div className="relative mx-auto max-w-7xl px-5 py-12 lg:py-16">
            <div className="max-w-4xl">
              <div className="mb-4 inline-flex items-center gap-3 rounded-full bg-teal-100 px-5 py-2 text-xs font-black uppercase tracking-wide text-slate-950 shadow-sm">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-500 opacity-60"></span>
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-teal-600"></span>
                </span>
                <span>Deals & Steals Auctions</span>
              </div>

              <h1 className="text-4xl font-black leading-none tracking-tight text-slate-950 md:text-6xl">
                Bid on limited-time deal drops.
              </h1>

              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-700">
                We are rolling out select auctions through our auction partner Rasmus. Browse upcoming auctions, register to bid, and pick up locally after the auction closes.
              </p>

              <div className="mt-7 flex flex-wrap gap-3 text-sm font-black text-slate-700">
                <span className="rounded-full bg-[#fff8ef] px-4 py-2">🛒 Register & bid on Rasmus</span>
                <span className="rounded-full bg-[#fff8ef] px-4 py-2">📍 Local pickup in Glen Burnie</span>
                <span className="rounded-full bg-[#fff8ef] px-4 py-2">⏰ Limited-time auctions</span>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-10">
          <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.25em] text-pink-600">
                Current Auctions
              </p>
              <h2 className="mt-2 text-4xl font-black tracking-tight text-slate-950">
                Upcoming Deal Drops
              </h2>
            </div>

            <button
              onClick={() => setShowClosed((value) => !value)}
              className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50"
            >
              {showClosed ? "Hide Closed Auctions" : "Show Closed Auctions"}
            </button>
          </div>

          {visibleAuctions.length > 0 ? (
            <div className="space-y-7">
              {visibleAuctions.map((auction) => (
                <AuctionCard key={auction.id} auction={auction} />
              ))}
            </div>
          ) : (
            <div className="rounded-[2rem] border border-slate-200 bg-white p-10 text-center">
              <h3 className="text-2xl font-black text-slate-950">
                No active auctions right now.
              </h3>
              <p className="mt-2 text-slate-600">
                Check back soon for the next Deals & Steals auction drop.
              </p>
            </div>
          )}
        </section>

        <section id="faq" className="bg-white px-5 py-14">
          <div className="mx-auto max-w-5xl">
            <p className="text-sm font-black uppercase tracking-[0.25em] text-pink-600">
              Questions
            </p>

            <h2 className="mt-2 text-4xl font-black tracking-tight text-slate-950">
              Auction FAQ
            </h2>

            <div className="mt-8 grid gap-4">
              <details className="rounded-[1.5rem] border border-slate-200 bg-[#fff8ef] p-5">
                <summary className="cursor-pointer text-lg font-black text-slate-950">
                  Why an auction?
                </summary>
                <p className="mt-3 leading-7 text-slate-700">
                  Auctions give customers a fun way to score deals on limited inventory. Instead of a fixed retail shelf price, customers can bid on the items they want and let the auction determine the final price.
                </p>
              </details>

              <details className="rounded-[1.5rem] border border-slate-200 bg-[#fff8ef] p-5">
                <summary className="cursor-pointer text-lg font-black text-slate-950">
                  What is Rasmus?
                </summary>
                <p className="mt-3 leading-7 text-slate-700">
                  Rasmus is our third-party auction partner. Bidding, registration, payment, auction reminders, and auction terms are handled through the Rasmus platform.
                </p>
              </details>

              <details className="rounded-[1.5rem] border border-slate-200 bg-[#fff8ef] p-5">
                <summary className="cursor-pointer text-lg font-black text-slate-950">
                  How do I bid and pay?
                </summary>
                <p className="mt-3 leading-7 text-slate-700">
                  Click the auction link, register or sign in on Rasmus, and place your bids directly through their site. If you win, payment is completed through Rasmus according to the auction terms.
                </p>
              </details>

              <details className="rounded-[1.5rem] border border-slate-200 bg-[#fff8ef] p-5">
                <summary className="cursor-pointer text-lg font-black text-slate-950">
                  How does pickup work?
                </summary>
                <p className="mt-3 leading-7 text-slate-700">
                  Auctions close on Tuesday, and pickup is typically available Thursday through Saturday after the auction closes. Please review the pickup window listed on the Rasmus auction page for the exact dates and times for each auction.
                </p>
              </details>

              <details className="rounded-[1.5rem] border border-slate-200 bg-[#fff8ef] p-5">
                <summary className="cursor-pointer text-lg font-black text-slate-950">
                  Can I pick up during regular store hours?
                </summary>
                <p className="mt-3 leading-7 text-slate-700">
                  Pickup is generally coordinated around our regular Deals & Steals pickup days, but each auction may have its own listed pickup window. Always follow the pickup dates and times shown on the Rasmus auction page.
                </p>
              </details>

              <details className="rounded-[1.5rem] border border-slate-200 bg-[#fff8ef] p-5">
                <summary className="cursor-pointer text-lg font-black text-slate-950">
                  Are auction items final sale?
                </summary>
                <p className="mt-3 leading-7 text-slate-700">
                  Auction purchases are handled through Rasmus and are subject to the terms listed for that specific auction. Please read the auction notes before bidding.
                </p>
              </details>
            </div>
          </div>
        </section>

        <section className="bg-pink-600 px-5 py-14 text-white">
          <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-[1fr_.8fr] md:items-center">
            <div>
              <p className="font-black uppercase tracking-[0.25em] text-pink-100">
                Stay in the loop
              </p>
              <h2 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
                Want first notice of future auctions?
              </h2>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-pink-50">
                Join our Facebook group for auction announcements, store updates, live sales, and new deal drops.
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
            <p className="mt-3 text-sm font-bold tracking-[0.18em] text-pink-600">
              shop small, SAVE BIG.
            </p>
          </div>

          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-pink-600">
              Hours
            </p>
            <div className="mt-3 flex flex-col gap-2 text-sm font-bold">
              <p>Thursday: 1 PM - 7 PM</p>
              <p>Friday: 1 PM - 7 PM</p>
              <p>Saturday: 11 AM - 3 PM</p>
            </div>
          </div>

          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-sky-600">
              Connect
            </p>
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
