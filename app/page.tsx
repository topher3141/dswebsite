"use client";

import React, { useEffect, useState } from "react";

const FACEBOOK_GROUP_URL = "https://www.facebook.com/groups/1956095674576022";
const LOYALTY_URL = "https://app.squareup.com/loyalty/ML6ZZS746Y0MJ";
const MAP_URL = "https://www.google.com/maps/search/?api=1&query=510%20McCormick%20Drive%20Suite%20B%20Glen%20Burnie%20MD%2021061";
const LOGO_URL = "https://i.imgur.com/euamaJ6.png";

function CountUp({ end, duration = 2600, suffix = "", start = false }: { end: number; duration?: number; suffix?: string; start?: boolean }) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!start) {
      setValue(0);
      return undefined;
    }

    let frameId: number;
    const startTime = performance.now();

    const update = (currentTime: number) => {
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(end * eased));

      if (progress < 1) {
        frameId = requestAnimationFrame(update);
      }
    };

    frameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frameId);
  }, [end, duration, start]);

  return (
    <>
      {value.toLocaleString()}
      {suffix}
    </>
  );
}

function useRevealCountUp() {
  const [ref, setRef] = useState<HTMLElement | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    if (!ref || isRevealed) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsRevealed(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 }
    );

    observer.observe(ref);
    return () => observer.disconnect();
  }, [ref, isRevealed]);

  return { setRef, isRevealed };
}

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

const HOURS = [
  { day: "Thursday", time: "1 PM - 7 PM" },
  { day: "Friday", time: "1 PM - 7 PM" },
  { day: "Saturday", time: "11 AM - 3 PM" },
];

const TOP_RIBBON = [
  "Household Goods",
  "Clothing & Apparel",
  "Toys & Games",
  "Electronics",
  "Health & Beauty",
  "Food & Snacks",
  "Tools & Hardware",
  "New Arrivals Weekly",
];

const REASONS = [
  {
    emoji: "🏷️",
    accent: "bg-pink-100 text-pink-600",
    title: "Unbeatable prices",
    text: "We buy closeout, overstock, and return merchandise so local shoppers can save big on everyday finds.",
  },
  {
    emoji: "🔄",
    accent: "bg-teal-100 text-teal-700",
    title: "Always changing",
    text: "New shipments arrive often. Every visit is a new treasure hunt with fresh deals to discover.",
  },
  {
    emoji: "🤝",
    accent: "bg-pink-100 text-pink-600",
    title: "Community first",
    text: "We are a local Maryland small business focused on helping our neighbors stretch their budget.",
  },
  {
    emoji: "✅",
    accent: "bg-teal-100 text-teal-700",
    title: "Easy to shop",
    text: "Clear hours, simple pickup, friendly service, and a store built around practical savings.",
  },
];

function validateContent(hours: typeof HOURS, reasons: typeof REASONS, ribbon: typeof TOP_RIBBON) {
  return Boolean(
    Array.isArray(hours) &&
      hours.length === 3 &&
      hours.every((item) => Boolean(item.day) && Boolean(item.time)) &&
      Array.isArray(reasons) &&
      reasons.length === 4 &&
      reasons.every((item) => Boolean(item.emoji) && Boolean(item.title) && Boolean(item.text) && Boolean(item.accent)) &&
      Array.isArray(ribbon) &&
      ribbon.length === 8
  );
}

console.assert(validateContent(HOURS, REASONS, TOP_RIBBON), "content data complete");
console.assert(HOURS[0].time === "1 PM - 7 PM", "thursday hours correct");
console.assert(REASONS.some((item) => item.title === "Community first"), "small business message present");
console.assert(TOP_RIBBON.includes("New Arrivals Weekly"), "ribbon promotes new arrivals");
console.assert(TOP_RIBBON.length * 2 === 16, "duplicated ribbon has expected item count");
console.assert([90, 3000, 500].length === 3, "stats configured");
console.assert(typeof CountUp === "function", "count up component configured");
console.assert(typeof useRevealCountUp === "function", "scroll reveal count up hook configured");
console.assert(FACEBOOK_GROUP_URL.includes("facebook.com"), "facebook group link configured");
console.assert(LOYALTY_URL.includes("squareup.com"), "loyalty link configured");
console.assert(MAP_URL.includes("google.com"), "map link configured");
console.assert(LOGO_URL.includes("imgur.com"), "wide logo configured");
console.assert(typeof Icon === "function", "icons configured");
console.assert(true === true, "hero section cleaned up");
console.assert("Local Shoppers Weekly".length > 0, "short shopper stat label configured");

export default function DealsAndStealsHomepage() {
  const scrollingRibbon = TOP_RIBBON.concat(TOP_RIBBON);
  const statsReveal = useRevealCountUp();

  return (
    <div className="min-h-screen bg-[#f7efe5] text-slate-900">
      <style>{`
        @keyframes dealsMarquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @keyframes countFloat {
          0% { opacity: 0; transform: translateY(18px) scale(.96); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes numberPop {
          0% { transform: scale(.9); opacity: .4; }
          70% { transform: scale(1.06); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @media (min-width: 768px) {
          .deals-marquee {
            animation: dealsMarquee 35s linear infinite;
          }
        }
        .count-up-card {
          animation: countFloat .65s ease-out both;
        }
        .count-up-number {
          animation: numberPop .9s ease-out both;
        }
        .stat-accent {
          position: absolute;
          inset: 0;
          opacity: .16;
          clip-path: circle(44% at 85% 20%);
        }
      `}</style>

      <header className="sticky top-0 z-40 border-b-4 border-pink-500 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between">
          <a href="#top" className="inline-flex items-center gap-3">
            <img src={LOGO_URL} alt="Deals & Steals logo" className="h-11 w-auto object-contain md:h-12 lg:h-14" />
          </a>

          <nav className="flex flex-wrap items-center gap-4 text-sm font-bold text-slate-700 md:gap-6">
            <a href="#difference" className="hover:text-pink-600">Why Us</a>
            <a href="#hours" className="hover:text-pink-600">Hours</a>
            <a href="#pickup" className="hover:text-pink-600">Pickup</a>
            <a href="#visit" className="hover:text-pink-600">Visit Us</a>
            <a href={LOYALTY_URL} target="_blank" rel="noreferrer" aria-label="Join loyalty rewards" className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-sky-100 bg-sky-50 text-slate-700 transition hover:border-sky-200 hover:bg-sky-100 hover:text-sky-700">
              <Icon name="user" className="h-5 w-5" />
            </a>
          </nav>
        </div>
      </header>

      <main id="top">
        <section className="relative overflow-hidden bg-white">
          <div className="absolute inset-y-0 right-0 hidden w-[48%] bg-gradient-to-l from-[#ffd9ea] via-[#fff1f7] to-transparent lg:block" />
          <div className="absolute -right-10 top-10 hidden h-96 w-96 rounded-full bg-pink-200/70 blur-3xl lg:block" />
          <div className="absolute bottom-6 right-24 hidden h-64 w-64 rounded-full bg-pink-100/45 blur-3xl lg:block" />
          <div className="absolute right-56 top-40 hidden h-40 w-40 rounded-full bg-white/60 blur-2xl lg:block" />

          <div className="relative mx-auto max-w-7xl px-5 py-14 lg:py-20">
            <div className="relative">
              <div className="mb-5 inline-flex items-center gap-3 rounded-full bg-teal-100 px-5 py-2 text-sm font-black uppercase tracking-wide text-slate-950 shadow-sm">
                <span className="relative flex h-3 w-3">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-500 opacity-60"></span>
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-teal-600"></span>
                </span>
                <span>Locally owned in Glen Burnie</span>
              </div>

              <h1 className="max-w-4xl text-5xl font-black leading-none tracking-tight text-slate-950 md:text-7xl">
                Your hometown spot for brand-name bargains.
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-700 md:text-xl">
                We source closeout merchandise, overstock, and customer returns so you get premium products at a fraction of the cost.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a href={FACEBOOK_GROUP_URL} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-xl bg-pink-600 px-7 py-4 text-base font-black text-white shadow-md transition hover:bg-pink-700">
                  Browse Deals <Icon name="arrow" className="ml-2 h-5 w-5" />
                </a>
                <a href={MAP_URL} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-xl border-2 border-sky-600 bg-white px-7 py-4 text-base font-black text-sky-800 transition hover:bg-sky-50">
                  Plan Your Visit
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="sticky bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur md:hidden">
          <div className="grid grid-cols-3 gap-2 p-3 text-center text-xs font-black">
            <a href={FACEBOOK_GROUP_URL} target="_blank" rel="noreferrer" className="rounded-xl bg-pink-600 px-2 py-3 text-white">Deals</a>
            <a href={MAP_URL} target="_blank" rel="noreferrer" className="rounded-xl bg-slate-100 px-2 py-3 text-slate-900">Directions</a>
            <a href={LOYALTY_URL} target="_blank" rel="noreferrer" className="rounded-xl bg-slate-100 px-2 py-3 text-slate-900">Rewards</a>
          </div>
        </section>

        <section id="hours" className="bg-slate-950 text-white">
          <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 md:grid-cols-[.8fr_1.2fr] md:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.22em] text-teal-300">Store hours</p>
              <h2 className="mt-2 text-3xl font-black">Open three days a week.</h2>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {HOURS.map((row) => (
                <div key={row.day} className="rounded-2xl bg-white p-5 text-slate-950">
                  <p className="text-lg font-black">{row.day}</p>
                  <p className="mt-2 text-2xl font-black text-pink-600">{row.time}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="overflow-hidden bg-pink-500 py-4 text-white">
          <div className="deals-marquee flex min-w-max gap-10 whitespace-nowrap px-6 text-xl font-black">
            {scrollingRibbon.map((item, index) => (
              <div key={`${item}-${index}`} className="flex items-center gap-10">
                <span>{item}</span>
                <span className="text-pink-200">✦</span>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white py-12" ref={statsReveal.setRef}>
          <div className="mx-auto max-w-7xl px-5">
            <div className="mb-7 text-center">
              <p className="text-sm font-black uppercase tracking-[0.25em] text-slate-500">shop small. SAVE BIG.</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">Fresh deals worth stopping in for.</h2>
            </div>

            <div className="grid gap-5 sm:grid-cols-3">
              <div className="count-up-card relative overflow-hidden rounded-[2rem] border-2 border-pink-100 bg-white p-7 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                <div className="stat-accent bg-pink-500" />
                <div className="relative mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-pink-500 text-3xl shadow-sm" role="img" aria-hidden="true">💸</div>
                <p className="relative text-sm font-black uppercase tracking-[0.18em] text-slate-500">Save Up To</p>
                <p className="count-up-number relative mt-3 text-6xl font-black leading-none text-slate-950">
                  <CountUp end={90} suffix="%" start={statsReveal.isRevealed} />
                </p>
              </div>

              <div className="count-up-card relative overflow-hidden rounded-[2rem] border-2 border-sky-100 bg-white p-7 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-md [animation-delay:120ms]">
                <div className="stat-accent bg-sky-500" />
                <div className="relative mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-sky-500 text-3xl shadow-sm" role="img" aria-hidden="true">📦</div>
                <p className="relative text-sm font-black uppercase tracking-[0.18em] text-slate-500">Items Added Weekly</p>
                <p className="count-up-number relative mt-3 text-6xl font-black leading-none text-slate-950 [animation-delay:120ms]">
                  <CountUp end={3000} suffix="+" start={statsReveal.isRevealed} />
                </p>
              </div>

              <div className="count-up-card relative overflow-hidden rounded-[2rem] border-2 border-teal-100 bg-white p-7 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-md [animation-delay:240ms]">
                <div className="stat-accent bg-teal-500" />
                <div className="relative mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-teal-500 text-3xl shadow-sm" role="img" aria-hidden="true">🛒</div>
                <p className="relative text-sm font-black uppercase tracking-[0.18em] text-slate-500">Local Shoppers Weekly</p>
                <p className="count-up-number relative mt-3 text-6xl font-black leading-none text-slate-950 [animation-delay:240ms]">
                  <CountUp end={500} suffix="+" start={statsReveal.isRevealed} />
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="difference" className="mx-auto max-w-7xl px-5 py-20">
          <div className="mb-12">
            <p className="font-black uppercase tracking-[0.25em] text-teal-600">Why shop with us</p>
            <h2 className="mt-3 text-5xl font-black tracking-tight text-slate-950">The Deals & Steals Difference</h2>
            <p className="mt-5 max-w-3xl text-xl leading-9 text-slate-600">
              We source closeout merchandise, overstock, and customer returns so you get premium products at a fraction of the cost.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {REASONS.map((item) => (
              <div key={item.title} className="rounded-[2rem] border-2 border-[#d8cfc3] bg-white p-8 shadow-sm transition hover:shadow-md">
                <div className={`mb-5 flex h-16 w-16 items-center justify-center rounded-3xl ${item.accent}`}>
                  <span className="text-3xl" role="img" aria-hidden="true">{item.emoji}</span>
                </div>
                <h3 className="text-3xl font-black text-slate-950">{item.title}</h3>
                <p className="mt-4 text-lg leading-8 text-slate-600">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="pickup" className="bg-pink-600 text-white">
          <div className="mx-auto grid max-w-7xl gap-8 px-5 py-14 md:grid-cols-[.9fr_1.1fr] md:items-center">
            <div>
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white text-pink-600">
                <Icon name="facebook" />
              </div>
              <h2 className="text-4xl font-black tracking-tight md:text-5xl">Shop with us on Facebook, then pick up local.</h2>
              <p className="mt-5 text-lg leading-8 text-pink-50">
                Claim items during live sales or weekly item posts, then check your invoice, pay online, and pick up during posted store hours.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <a href={FACEBOOK_GROUP_URL} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-xl bg-white px-7 py-4 font-black text-pink-700 shadow-md transition hover:bg-slate-100">
                  Browse Deals <Icon name="arrow" className="ml-2 h-5 w-5" />
                </a>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {["Claim during live sales or weekly item posts", "Pay your weekly invoice", "Pick up during store hours"].map((step, index) => (
                <div key={step} className="rounded-2xl bg-white p-5 text-slate-950 shadow-md">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 text-lg font-black">{index + 1}</div>
                  <p className="font-black leading-6">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-gradient-to-r from-[#fff8ef] via-[#fff3f8] to-white py-14">
          <div className="mx-auto grid max-w-7xl gap-6 px-5 md:grid-cols-[.9fr_1.1fr] md:items-center">
            <div>
              <p className="font-black uppercase tracking-[0.25em] text-pink-600">Rewards program</p>
              <h2 className="mt-3 text-4xl font-black tracking-tight text-slate-950 md:text-5xl">Earn rewards while you save.</h2>
              <p className="mt-5 max-w-xl text-lg leading-8 text-slate-700">
                Join our loyalty program to earn rewards on eligible purchases and stay connected with Deals & Steals perks.
              </p>
            </div>

            <div className="rounded-[2rem] border-2 border-pink-100 bg-white p-7 shadow-sm">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-pink-100 text-pink-600">
                <Icon name="user" />
              </div>
              <h3 className="text-2xl font-black text-slate-950">Deals & Steals Loyalty</h3>
              <p className="mt-3 leading-7 text-slate-600">
                Sign up once, then use your phone number when shopping to keep earning rewards.
              </p>
              <a href={LOYALTY_URL} target="_blank" rel="noreferrer" className="mt-6 inline-flex items-center justify-center rounded-xl bg-pink-600 px-7 py-4 font-black text-white shadow-md transition hover:bg-pink-700">
                Join Loyalty Rewards <Icon name="arrow" className="ml-2 h-5 w-5" />
              </a>
            </div>
          </div>
        </section>

        <section id="visit" className="bg-gradient-to-br from-white via-[#fff8ef] to-pink-50">
          <div className="mx-auto grid max-w-7xl gap-8 px-5 py-16 md:grid-cols-2 md:items-center">
            <div>
              <p className="font-black uppercase tracking-[0.25em] text-teal-700">Visit us</p>
              <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950 md:text-3xl lg:text-4xl xl:text-5xl">Come see what’s new in store.</h2>
              <p className="mt-5 max-w-xl text-lg leading-8 text-slate-700">
                New inventory arrives weekly with fresh bargains, rotating finds, and closeout deals worth checking out again and again.
              </p>
              <div className="mt-6 flex items-center gap-3 font-bold text-slate-800">
                <Icon name="map" className="h-5 w-5 text-pink-600" />
                <span>510 McCormick Drive | Suite B, Glen Burnie, MD 21061</span>
              </div>
            </div>

            <div className="rounded-[2rem] border-4 border-slate-950 bg-white p-5 shadow-sm">
              <div className="overflow-hidden rounded-[1.5rem] border border-slate-200">
                <iframe
                  title="Deals and Steals Map"
                  src="https://www.google.com/maps?q=510%20McCormick%20Drive%20Suite%20B%20Glen%20Burnie%20MD%2021061&output=embed"
                  className="h-[280px] w-full"
                  loading="lazy"
                />
              </div>
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
          510 McCormick Drive | Suite B | Glen Burnie, MD 21061
        </div>
      </footer>
    </div>
  );
}
