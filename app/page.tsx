'use client';

import React, { useEffect, useState } from 'react';

type CountUpProps = {
  end: number;
  duration?: number;
  suffix?: string;
  start?: boolean;
};

type IconProps = {
  name: string;
  className?: string;
};

function CountUp({ end, duration = 2600, suffix = '', start = false }: CountUpProps) {
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

function Icon({ name, className = '' }: IconProps) {
  const common = `h-6 w-6 ${className}`;

  if (name === 'facebook') {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M14 8.5V7.2c0-.7.2-1.2 1.2-1.2H17V3h-2.7C11.6 3 10 4.6 10 7v1.5H8v3h2V21h4v-9.5h2.7l.3-3H14z" />
      </svg>
    );
  }

  if (name === 'arrow') {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M5 12h14" />
        <path d="M13 6l6 6-6 6" />
      </svg>
    );
  }

  return (
    <svg className={common} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 21s7-5.1 7-11a7 7 0 1 0-14 0c0 5.9 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

const HOURS = [
  { day: 'Thursday', time: '1 PM - 7 PM' },
  { day: 'Friday', time: '1 PM - 7 PM' },
  { day: 'Saturday', time: '11 AM - 3 PM' },
];

const TOP_RIBBON = [
  'Household Goods',
  'Clothing & Apparel',
  'Toys & Games',
  'Electronics',
  'Health & Beauty',
  'Food & Snacks',
  'Tools & Hardware',
  'New Arrivals Weekly',
];

const REASONS = [
  {
    emoji: '🏷️',
    accent: 'bg-pink-100 text-pink-600',
    title: 'Unbeatable prices',
    text: 'We buy closeout, overstock, and return merchandise so local shoppers can save big on everyday finds.',
  },
  {
    emoji: '🔄',
    accent: 'bg-teal-100 text-teal-700',
    title: 'Always changing',
    text: 'New shipments arrive often. Every visit is a new treasure hunt with fresh deals to discover.',
  },
  {
    emoji: '🤝',
    accent: 'bg-pink-100 text-pink-600',
    title: 'Community first',
    text: 'We are a local Maryland small business focused on helping our neighbors stretch their budget.',
  },
  {
    emoji: '✅',
    accent: 'bg-teal-100 text-teal-700',
    title: 'Easy to shop',
    text: 'Clear hours, simple pickup, friendly service, and a store built around practical savings.',
  },
];

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

      <header className="border-b-4 border-pink-500 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <img
              src="https://i.imgur.com/x818kSV.png"
              alt="Deals & Steals logo"
              className="h-20 w-auto object-contain"
            />
          </div>

          <nav className="flex flex-wrap items-center gap-4 text-sm font-bold text-slate-700 md:gap-6">
            <a href="#difference" className="hover:text-pink-600">Why Us</a>
            <a href="#hours" className="hover:text-pink-600">Hours</a>
            <a href="#pickup" className="hover:text-pink-600">Pickup</a>
            <a href="#visit" className="hover:text-pink-600">Visit Us</a>
          </nav>
        </div>
      </header>

      <main>
        <section className="bg-white">
          <div className="mx-auto max-w-7xl px-5 py-14 lg:py-20">
            <div>
              <div className="mb-5 inline-flex rounded-full bg-sky-100 px-5 py-2 text-sm font-black uppercase tracking-wide text-slate-950 shadow-sm">
                Locally owned in Glen Burnie
              </div>

              <h1 className="max-w-4xl text-5xl font-black leading-none tracking-tight text-slate-950 md:text-7xl">
                Your hometown spot for brand-name bargains.
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-700 md:text-xl">
                We source closeout merchandise, overstock, and customer returns so you get premium products at a fraction of the cost.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a href="https://www.facebook.com/groups/dealsandstealsmd" className="inline-flex items-center justify-center rounded-xl bg-pink-600 px-7 py-4 text-base font-black text-white shadow-md transition hover:bg-pink-700">
                  See What Is New <Icon name="arrow" className="ml-2 h-5 w-5" />
                </a>
                <a href="#visit" className="inline-flex items-center justify-center rounded-xl border-2 border-sky-700 bg-white px-7 py-4 text-base font-black text-sky-900 transition hover:bg-slate-100">
                  Plan Your Visit
                </a>
              </div>
            </div>
          </div>
        </section>

        <section id="hours" className="bg-slate-950 text-white">
          <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 md:grid-cols-[.8fr_1.2fr] md:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.22em] text-sky-300">Store hours</p>
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
              <p className="text-sm font-black uppercase tracking-[0.25em] text-slate-500">Big value, local store</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">Fresh deals worth stopping in for.</h2>
            </div>

            <div className="grid gap-5 sm:grid-cols-3">
              <div className="count-up-card relative overflow-hidden rounded-[2rem] border-2 border-pink-100 bg-[#fff8ef] p-7 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                <div className="stat-accent bg-pink-500" />
                <div className="relative mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-pink-500 text-3xl shadow-sm" role="img" aria-hidden="true">💸</div>
                <p className="count-up-number relative text-6xl font-black leading-none text-slate-950">
                  <CountUp end={90} suffix="%" start={statsReveal.isRevealed} />
                </p>
                <p className="relative mt-3 text-sm font-black uppercase tracking-[0.18em] text-slate-500">Save Up To</p>
              </div>

              <div className="count-up-card relative overflow-hidden rounded-[2rem] border-2 border-sky-100 bg-[#fff8ef] p-7 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-md [animation-delay:120ms]">
                <div className="stat-accent bg-sky-500" />
                <div className="relative mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-sky-500 text-3xl shadow-sm" role="img" aria-hidden="true">📦</div>
                <p className="count-up-number relative text-6xl font-black leading-none text-slate-950 [animation-delay:120ms]">
                  <CountUp end={3000} suffix="+" start={statsReveal.isRevealed} />
                </p>
                <p className="relative mt-3 text-sm font-black uppercase tracking-[0.18em] text-slate-500">Items Added Weekly</p>
              </div>

              <div className="count-up-card relative overflow-hidden rounded-[2rem] border-2 border-teal-100 bg-[#fff8ef] p-7 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-md [animation-delay:240ms]">
                <div className="stat-accent bg-teal-500" />
                <div className="relative mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-teal-500 text-3xl shadow-sm" role="img" aria-hidden="true">🛒</div>
                <p className="count-up-number relative text-6xl font-black leading-none text-slate-950 [animation-delay:240ms]">
                  <CountUp end={500} suffix="+" start={statsReveal.isRevealed} />
                </p>
                <p className="relative mt-3 text-sm font-black uppercase tracking-[0.18em] text-slate-500">Happy Local Shoppers Weekly</p>
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
                Give live sale customers a simple place to check invoices, understand pickup rules, and stay connected with weekly deals.
              </p>
              <a href="https://www.facebook.com/groups/dealsandstealsmd" className="mt-7 inline-flex rounded-xl bg-white px-7 py-4 font-black text-pink-700 shadow-md transition hover:bg-slate-100">
                Join Facebook Group
              </a>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {['Claim items during live sales', 'Pay your weekly invoice', 'Pick up during store hours'].map((step, index) => (
                <div key={step} className="rounded-2xl bg-white p-5 text-slate-950 shadow-md">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 text-lg font-black">{index + 1}</div>
                  <p className="font-black leading-6">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="visit" className="bg-[#fff8ef]">
          <div className="mx-auto grid max-w-7xl gap-8 px-5 py-16 md:grid-cols-2 md:items-center">
            <div>
              <p className="font-black uppercase tracking-[0.25em] text-sky-700">Visit us</p>
              <h2 className="mt-3 text-4xl font-black tracking-tight text-slate-950 md:text-5xl">Come treasure hunt in Glen Burnie.</h2>
              <p className="mt-5 max-w-xl text-lg leading-8 text-slate-700">
                Visit our Glen Burnie location for rotating inventory, weekly deals, and fresh closeout finds. Easy to access and worth the stop.
              </p>
              <div className="mt-6 flex items-center gap-3 font-bold text-slate-800">
                <Icon name="map" className="h-5 w-5 text-pink-600" />
                <span>510 McCormick Drive Suite B, Glen Burnie, MD 21061</span>
              </div>
            </div>

            <div className="rounded-[2rem] border-4 border-slate-950 bg-white p-5 shadow-[10px_10px_0_#0ea5e9]">
              <div className="overflow-hidden rounded-[1.5rem] border border-slate-200">
                <iframe
                  title="Deals and Steals Map"
                  src="https://www.google.com/maps?q=510%20McCormick%20Drive%20Suite%20B%20Glen%20Burnie%20MD%2021061&output=embed"
                  className="h-[280px] w-full"
                  loading="lazy"
                />
              </div>
              <div className="mt-4 rounded-2xl bg-[#fff8ef] p-4">
                <p className="font-black text-slate-950">Deals & Steals</p>
                <p className="mt-1 text-sm font-medium text-slate-700">510 McCormick Drive Suite B<br/>Glen Burnie, MD 21061</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t-4 border-slate-950 bg-white px-5 py-8 text-center text-sm font-bold text-slate-700">
        <p>Deals & Steals · Locally owned · shop small, SAVE BIG</p>
      </footer>
    </div>
  );
}
