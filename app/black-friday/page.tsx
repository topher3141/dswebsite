"use client";

import React, { useEffect, useState } from "react";

const LOGO_URL = "https://i.imgur.com/euamaJ6.png";
const MAP_URL = "https://maps.app.goo.gl/X5aRKYCCKWmEKzUD6";
const FACEBOOK_URL = "https://www.facebook.com/groups/1956095674576022";
const REVEAL_AT = new Date("2026-11-28T01:00:00Z").getTime();
const START_AT = new Date("2026-11-27T02:00:00Z").getTime();

function useClock() {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const update = () => setNow(Date.now());
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);
  return now;
}

function Countdown({ now }: { now: number | null }) {
  if (now === null) return <span>Counting down to Thanksgiving night…</span>;
  if (now >= START_AT) return <span>The mega clearance weekend is here!</span>;
  const diff = START_AT - now;
  const units = [
    { label: "DAYS", value: Math.floor(diff / 86400000) },
    { label: "HOURS", value: Math.floor(diff / 3600000) % 24 },
    { label: "MINUTES", value: Math.floor(diff / 60000) % 60 },
    { label: "SECONDS", value: Math.floor(diff / 1000) % 60 },
  ];
  return <div className="grid grid-cols-4 gap-2 sm:gap-4">{units.map(u => <div key={u.label} className="rounded-xl border border-pink-500/50 bg-[#19131d] px-2 py-4 text-center shadow-[0_0_25px_rgba(236,72,153,.16)]"><div className="text-3xl font-black text-[#ff3b98] sm:text-5xl">{String(u.value).padStart(2,"0")}</div><div className="mt-1 text-[10px] font-black tracking-widest text-white/60 sm:text-xs">{u.label}</div></div>)}</div>;
}

const days = [
  { day: "THURSDAY", date: "NOV 26", hours: "9–11 PM", name: "Thanksgiving Night Kickoff", detail: "Get first access to the mega clearance weekend.", accent: "bg-pink-600" },
  { day: "FRIDAY", date: "NOV 27", hours: "1–7 PM", name: "Black Friday Mega Clearance", detail: "50% off almost everything, $3 clothing and $5 shoes.", accent: "bg-teal-600" },
  { day: "SATURDAY", date: "NOV 28", hours: "11 AM–3 PM", name: "Surprise Clearance Finale", detail: "The main sale continues PLUS new surprise clearance deals!", accent: "bg-amber-500" },
];

export default function BlackFridayPage() {
  const now = useClock();
  const revealed = now !== null && now >= REVEAL_AT;
  return <div className="min-h-screen bg-[#08080b] text-white">
    <header className="border-b-4 border-pink-500 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4">
        <a href="/" aria-label="Deals and Steals home"><img src={LOGO_URL} alt="Deals & Steals" className="h-12 max-w-[185px] w-auto object-contain sm:max-w-none md:h-14" /></a>
        <a href="/" className="rounded-full border-2 border-pink-500 px-3 py-2 text-xs font-black text-pink-700 hover:bg-pink-50 sm:px-5 sm:text-sm">Back to Home</a>
      </div>
    </header>
    <div className="bg-pink-600 px-4 py-3 text-center text-xs font-black uppercase tracking-[.16em] text-white sm:text-sm">Three days of massive savings • November 26–28, 2026</div>
    <main><style>{`@keyframes bfPulse{0%,100%{filter:drop-shadow(0 0 6px #ff2c8b66)}50%{filter:drop-shadow(0 0 28px #ff2c8baa)}}@keyframes bfScroll{to{transform:translateX(-50%)}}.bf-glow{animation:bfPulse 3s ease-in-out infinite}@media(prefers-reduced-motion:reduce){.bf-glow{animation:none}}`}</style>
      <section className="relative overflow-hidden bg-[#08080b]">
        <div className="absolute -right-16 top-0 h-72 w-72 rounded-full bg-pink-600/30 blur-3xl" />
        <div className="absolute -left-20 bottom-0 h-64 w-64 rounded-full bg-teal-500/25 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-5 py-14 text-center md:py-20">
          <span className="inline-block rounded-full bg-pink-600 px-5 py-2 text-xs font-black uppercase tracking-widest text-white">Shop small. SAVE BIG.</span>
          <h1 className="bf-glow mx-auto mt-7 max-w-6xl text-[clamp(2.7rem,9.5vw,7.4rem)] font-black uppercase leading-[1.02] tracking-[-.055em] text-white"><span className="block">BLACK FRIDAY</span><span className="mt-2 block text-[#ff2c8b]">MEGA</span><span className="block text-[#35f1e0]">CLEARANCE!</span></h1>
          <p className="mx-auto mt-7 max-w-2xl text-base font-semibold text-white/80 md:text-2xl">THE PRICES ARE DROPPING. THE DEALS ARE MASSIVE.</p>
          <div className="mx-auto mt-10 max-w-2xl"><p className="mb-3 text-xs font-black uppercase tracking-[.2em] text-teal-300">Kicks off Thanksgiving night at 9 PM</p><Countdown now={now}/></div>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row"><a href="#deals" className="rounded-xl bg-pink-600 px-7 py-4 text-center font-black text-white shadow-md hover:bg-pink-700">See the Deals ↓</a><a href={MAP_URL} target="_blank" rel="noreferrer" className="rounded-xl border-2 border-teal-400 bg-transparent px-7 py-4 text-center font-black text-teal-300 hover:bg-teal-900">Get Directions ↗</a></div>
        </div>
      </section>
      <div className="overflow-hidden border-y-2 border-yellow-300 bg-yellow-300 py-3 text-center text-xs font-black uppercase leading-relaxed tracking-wide text-black sm:text-lg">⚡ 50% OFF ALMOST EVERYTHING ⚡ $3 CLOTHING ⚡ $5 SHOES ⚡</div>
      <section id="deals" className="mx-auto max-w-6xl px-5 py-20">
        <p className="text-center text-xs font-black uppercase tracking-[.2em] text-[#35f1e0]">The main event</p>
        <h2 className="mt-2 text-center text-3xl font-black leading-tight md:text-5xl">THE DEALS ARE INSANE.</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <div className="rounded-[1.5rem] border-2 border-pink-500 bg-[#1a0b17] px-5 py-9 text-center shadow-[5px_5px_0_#ed2782] sm:px-7 md:shadow-[8px_8px_0_#ed2782]"><p className="text-[clamp(4.5rem,8vw,6rem)] font-black leading-none text-[#ff3b98]">50%</p><p className="mt-5 text-xl font-black leading-tight lg:text-2xl">OFF ALMOST EVERYTHING</p><p className="mt-3 text-sm text-white/65">Blue-tag merchandise excluded from 50% off.</p></div>
          <div className="rounded-[1.5rem] border-2 border-teal-400 bg-[#09201f] px-5 py-9 text-center shadow-[5px_5px_0_#1ddacb] sm:px-7 md:shadow-[8px_8px_0_#1ddacb]"><p className="text-[clamp(4.5rem,8vw,6rem)] font-black leading-none text-[#35f1e0]">$3</p><p className="mt-5 text-xl font-black leading-tight lg:text-2xl">ALL CLOTHING</p><p className="mt-3 text-sm text-white/65">Everyday apparel at one simple price.</p></div>
          <div className="rounded-[1.5rem] border-2 border-amber-400 bg-[#221b0b] px-5 py-9 text-center shadow-[5px_5px_0_#facc15] sm:px-7 md:shadow-[8px_8px_0_#facc15]"><p className="text-[clamp(4.5rem,8vw,6rem)] font-black leading-none text-yellow-300">$5</p><p className="mt-5 text-xl font-black leading-tight lg:text-2xl">ALL SHOES</p><p className="mt-3 text-sm text-white/65">One great price per pair.</p></div>
        </div>
        <p className="mt-5 text-center text-sm text-white/65">Clothing and shoes are priced as advertised rather than receiving an additional 50% discount. Discounts cannot be stacked.</p>
      </section>
      <section id="giveaway" className="relative overflow-hidden border-y-4 border-[#35f1e0] bg-[#1b0c21] px-5 py-16 sm:py-20">
        <div className="pointer-events-none absolute -left-20 top-0 h-60 w-60 rounded-full bg-pink-600/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 bottom-0 h-60 w-60 rounded-full bg-teal-400/20 blur-3xl" />
        <div className="relative mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-yellow-300 px-5 py-2 text-xs font-black uppercase tracking-wider text-black sm:text-sm">🎁 FREE HOLIDAY GIVEAWAY 🎁</div>
          <h2 className="mx-auto mt-6 max-w-4xl text-[clamp(2.5rem,7vw,5.5rem)] font-black uppercase leading-[1.04] tracking-tight text-white">FREE CHRISTMAS <span className="text-[#35f1e0]">SQUISHY CUBE!</span></h2>
          <div className="mx-auto mt-7 max-w-md overflow-hidden rounded-2xl border-4 border-pink-500 bg-white p-2 shadow-[0_0_40px_rgba(236,72,153,.25)]"><img src="/images/christmas-needoh.jpg" alt="Three colorful Christmas-themed squishy cubes available in the giveaway" className="aspect-square w-full rounded-xl object-cover" /></div>
          <p className="mx-auto mt-7 max-w-3xl text-xl font-bold leading-snug text-white sm:text-3xl">The <span className="text-[#ff3b98]">FIRST 50 CUSTOMERS</span> each day get a FREE Christmas Squishy Cube!</p>
          <div className="mx-auto mt-8 grid max-w-3xl gap-3 sm:grid-cols-3">
            {["THURSDAY • NOV 26","FRIDAY • NOV 27","SATURDAY • NOV 28"].map(day => <div key={day} className="rounded-xl border border-teal-400/50 bg-black/40 px-4 py-5"><div className="text-3xl">🎄</div><p className="mt-2 text-sm font-black tracking-wide text-white">{day}</p><p className="mt-1 text-xs font-bold uppercase text-teal-300">First 50 customers</p></div>)}
          </div>
          <p className="mt-6 text-sm text-white/70">One giveaway per eligible customer per day. Limited to the first 50 customers each day, while supplies last.</p>
        </div>
      </section>
      <section className="border-y border-white/10 bg-[#121219] py-20"><div className="mx-auto max-w-6xl px-5"><p className="text-center text-xs font-black uppercase tracking-[.2em] text-[#35f1e0]">Mark your calendar</p><h2 className="mt-3 text-center text-3xl font-black leading-tight md:text-5xl">THREE DAYS. ZERO EXCUSES.</h2><div className="mt-9 grid gap-5 md:grid-cols-3">{days.map(d => <div key={d.day} className="overflow-hidden rounded-[1.5rem] border border-white/15 bg-[#1d1d27] shadow-xl"><div className={d.accent+" px-6 py-4 text-white"}><p className="text-sm font-black tracking-widest">{d.day} • {d.date}</p></div><div className="p-6"><p className="text-4xl font-black">{d.hours}</p><h3 className="mt-3 text-xl font-black">{d.name}</h3><p className="mt-3 text-white/70">{d.detail}</p></div></div>)}</div></div></section>
      <section className="bg-gradient-to-b from-[#260b24] via-[#0b0b12] to-[#071c1b] px-5 py-20 text-center text-white"><div className="mx-auto max-w-3xl"><span className="rounded-full bg-pink-600 px-5 py-2 text-xs font-black uppercase tracking-widest">Top secret deals</span><div className="mt-7 text-5xl">🎁</div><h2 className="mt-5 text-4xl font-black leading-tight md:text-6xl">SATURDAY SURPRISE!</h2><p className="mt-5 text-lg text-slate-200">The 50% off sale, $3 clothing and $5 shoes continue Saturday—PLUS brand-new surprise clearance specials!</p><div className="mt-8 rounded-[2rem] border-2 border-teal-400 bg-[#11131b] p-7 text-white"><p className="text-sm font-black uppercase tracking-widest text-pink-400">{revealed ? "It's reveal time!" : "New deals unlock"}</p><p className="mt-3 text-2xl font-black leading-tight sm:text-3xl">{revealed ? "Saturday deals coming soon" : "FRIDAY AT 8 PM"}</p><p className="mt-2 text-white/65">{revealed ? "Specific Saturday offers have not been finalized yet. Check back for details." : "Check back Friday night to see the additional Saturday-only specials."}</p></div></div></section>
      <section className="mx-auto max-w-5xl px-5 py-16 text-center"><h2 className="text-3xl font-black md:text-5xl">Don't miss out!</h2><p className="mt-4 text-lg text-white/70">Come treasure hunting with us in Glen Burnie, Maryland.</p><div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row"><a href={MAP_URL} target="_blank" rel="noreferrer" className="rounded-xl bg-pink-600 px-7 py-4 text-center font-black text-white hover:bg-pink-700">Plan Your Visit ↗</a><a href={FACEBOOK_URL} target="_blank" rel="noreferrer" className="rounded-xl border-2 border-teal-400 bg-transparent px-7 py-4 text-center font-black text-teal-300 hover:bg-teal-900">Join Our Facebook Group ↗</a></div><p className="mt-8 text-xs text-white/50">In-store only. While supplies last. No stacking discounts. Additional Saturday deals to be announced Friday at 8 PM Eastern.</p></section>
    </main>
    <footer className="border-t border-white/10 bg-[#08080b] px-5 py-7 text-center text-sm font-bold text-white/60">Deals & Steals • Shop small. SAVE BIG.</footer>
  </div>;
}
