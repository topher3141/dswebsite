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
  return <div className="grid grid-cols-4 gap-2 sm:gap-4">{units.map(u => <div key={u.label} className="rounded-2xl bg-white px-2 py-4 text-center shadow-sm"><div className="text-3xl font-black text-pink-600 sm:text-5xl">{String(u.value).padStart(2,"0")}</div><div className="mt-1 text-[10px] font-black tracking-widest text-slate-500 sm:text-xs">{u.label}</div></div>)}</div>;
}

const days = [
  { day: "THURSDAY", date: "NOV 26", hours: "9–11 PM", name: "Thanksgiving Night Kickoff", detail: "Get first access to the mega clearance weekend.", accent: "bg-pink-600" },
  { day: "FRIDAY", date: "NOV 27", hours: "1–7 PM", name: "Black Friday Mega Clearance", detail: "50% off almost everything, $3 clothing and $5 shoes.", accent: "bg-teal-600" },
  { day: "SATURDAY", date: "NOV 28", hours: "11 AM–3 PM", name: "Surprise Clearance Finale", detail: "The main sale continues PLUS new surprise clearance deals!", accent: "bg-amber-500" },
];

export default function BlackFridayPage() {
  const now = useClock();
  const revealed = now !== null && now >= REVEAL_AT;
  return <div className="min-h-screen bg-[#f7efe5] text-slate-950">
    <header className="border-b-4 border-pink-500 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4">
        <a href="/" aria-label="Deals and Steals home"><img src={LOGO_URL} alt="Deals & Steals" className="h-11 w-auto object-contain md:h-14" /></a>
        <a href="/" className="rounded-full border-2 border-pink-200 px-4 py-2 text-sm font-black text-pink-700 hover:bg-pink-50">Back to Home</a>
      </div>
    </header>
    <div className="bg-slate-950 px-4 py-3 text-center text-xs font-black uppercase tracking-[.16em] text-white sm:text-sm">Three days of massive savings • November 26–28, 2026</div>
    <main>
      <section className="relative overflow-hidden bg-white">
        <div className="absolute -right-16 top-0 h-72 w-72 rounded-full bg-pink-100 blur-3xl" />
        <div className="absolute -left-20 bottom-0 h-64 w-64 rounded-full bg-teal-100 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-5 py-14 text-center md:py-20">
          <span className="inline-block rounded-full bg-teal-100 px-5 py-2 text-xs font-black uppercase tracking-widest text-teal-800">Shop small. SAVE BIG.</span>
          <h1 className="mt-6 text-5xl font-black uppercase leading-[.95] tracking-tight sm:text-7xl lg:text-8xl">BLACK FRIDAY<br/><span className="text-pink-600">MEGA </span><span className="text-teal-600">CLEARANCE!</span></h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg font-semibold text-slate-600 md:text-xl">Three days. Huge savings. One massive clearance weekend.</p>
          <div className="mx-auto mt-10 max-w-2xl"><p className="mb-3 text-xs font-black uppercase tracking-[.2em] text-slate-500">Kicks off Thanksgiving night at 9 PM</p><Countdown now={now}/></div>
          <div className="mt-9 flex flex-wrap justify-center gap-3"><a href="#deals" className="rounded-xl bg-pink-600 px-7 py-4 font-black text-white shadow-md hover:bg-pink-700">See the Deals ↓</a><a href={MAP_URL} target="_blank" rel="noreferrer" className="rounded-xl border-2 border-teal-600 bg-white px-7 py-4 font-black text-teal-800 hover:bg-teal-50">Get Directions ↗</a></div>
        </div>
      </section>
      <section id="deals" className="mx-auto max-w-6xl px-5 py-16">
        <p className="text-center text-xs font-black uppercase tracking-[.2em] text-pink-600">The main event</p>
        <h2 className="mt-2 text-center text-3xl font-black md:text-5xl">Big savings. Simple prices.</h2>
        <div className="mt-9 grid gap-5 md:grid-cols-3">
          <div className="rounded-[2rem] border-2 border-pink-100 bg-pink-50 p-8 text-center shadow-sm"><p className="text-7xl font-black text-pink-600">50%</p><p className="mt-2 text-2xl font-black">OFF ALMOST EVERYTHING</p><p className="mt-3 text-sm text-slate-600">Blue-tag merchandise excluded from 50% off.</p></div>
          <div className="rounded-[2rem] border-2 border-teal-100 bg-teal-50 p-8 text-center shadow-sm"><p className="text-7xl font-black text-teal-700">$3</p><p className="mt-2 text-2xl font-black">ALL CLOTHING</p><p className="mt-3 text-sm text-slate-600">Everyday apparel at one simple price.</p></div>
          <div className="rounded-[2rem] border-2 border-amber-100 bg-amber-50 p-8 text-center shadow-sm"><p className="text-7xl font-black text-amber-600">$5</p><p className="mt-2 text-2xl font-black">ALL SHOES</p><p className="mt-3 text-sm text-slate-600">One great price per pair.</p></div>
        </div>
        <p className="mt-5 text-center text-sm text-slate-600">Clothing and shoes are priced as advertised rather than receiving an additional 50% discount. Discounts cannot be stacked.</p>
      </section>
      <section className="bg-white py-16"><div className="mx-auto max-w-6xl px-5"><p className="text-center text-xs font-black uppercase tracking-[.2em] text-teal-700">Mark your calendar</p><h2 className="mt-2 text-center text-3xl font-black md:text-5xl">Three days to save BIG.</h2><div className="mt-9 grid gap-5 md:grid-cols-3">{days.map(d => <div key={d.day} className="overflow-hidden rounded-[2rem] border border-slate-100 bg-[#f7efe5] shadow-sm"><div className={d.accent+" px-6 py-4 text-white"}><p className="text-sm font-black tracking-widest">{d.day} • {d.date}</p></div><div className="p-6"><p className="text-4xl font-black">{d.hours}</p><h3 className="mt-3 text-xl font-black">{d.name}</h3><p className="mt-3 text-slate-600">{d.detail}</p></div></div>)}</div></div></section>
      <section className="bg-slate-950 px-5 py-16 text-center text-white"><div className="mx-auto max-w-3xl"><span className="rounded-full bg-pink-600 px-5 py-2 text-xs font-black uppercase tracking-widest">Top secret deals</span><div className="mt-7 text-5xl">🎁</div><h2 className="mt-5 text-4xl font-black md:text-6xl">SATURDAY SURPRISE!</h2><p className="mt-5 text-lg text-slate-200">The 50% off sale, $3 clothing and $5 shoes continue Saturday—PLUS brand-new surprise clearance specials!</p><div className="mt-8 rounded-[2rem] border border-teal-500 bg-white p-7 text-slate-950"><p className="text-sm font-black uppercase tracking-widest text-pink-600">{revealed ? "It's reveal time!" : "New deals unlock"}</p><p className="mt-2 text-3xl font-black">{revealed ? "Saturday deals coming soon" : "FRIDAY AT 8 PM"}</p><p className="mt-2 text-slate-600">{revealed ? "Specific Saturday offers have not been finalized yet. Check back for details." : "Check back Friday night to see the additional Saturday-only specials."}</p></div></div></section>
      <section className="mx-auto max-w-5xl px-5 py-16 text-center"><h2 className="text-3xl font-black md:text-5xl">Don't miss out!</h2><p className="mt-4 text-lg text-slate-600">Come treasure hunting with us in Glen Burnie, Maryland.</p><div className="mt-7 flex flex-wrap justify-center gap-3"><a href={MAP_URL} target="_blank" rel="noreferrer" className="rounded-xl bg-pink-600 px-7 py-4 font-black text-white hover:bg-pink-700">Plan Your Visit ↗</a><a href={FACEBOOK_URL} target="_blank" rel="noreferrer" className="rounded-xl border-2 border-teal-600 bg-white px-7 py-4 font-black text-teal-800 hover:bg-teal-50">Join Our Facebook Group ↗</a></div><p className="mt-8 text-xs text-slate-500">In-store only. While supplies last. No stacking discounts. Additional Saturday deals to be announced Friday at 8 PM Eastern.</p></section>
    </main>
    <footer className="border-t border-slate-200 bg-white px-5 py-7 text-center text-sm font-bold text-slate-600">Deals & Steals • Shop small. SAVE BIG.</footer>
  </div>;
}
