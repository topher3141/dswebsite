const MAP_URL = "https://maps.app.goo.gl/X5aRKYCCKWmEKzUD6";

export default function ShopSuccessPage() {
  return (
    <main className="min-h-screen bg-[#f7efe5] px-5 py-16 text-slate-950">
      <section className="mx-auto max-w-3xl rounded-[2rem] border-2 border-pink-100 bg-white p-8 text-center shadow-sm md:p-12">
        <p className="text-sm font-black uppercase tracking-[0.25em] text-teal-700">
          Payment received
        </p>

        <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
          Your item has been reserved.
        </h1>

        <p className="mt-5 text-lg leading-8 text-slate-700">
          Thank you for shopping small with Deals & Steals. Your order is ready for local pickup during normal store hours.
        </p>

        <div className="mt-8 rounded-2xl bg-[#fff8ef] p-6 text-left">
          <p className="font-black text-pink-600">Pickup Hours</p>
          <div className="mt-3 space-y-2 font-bold text-slate-700">
            <p>Thursday: 1 PM - 7 PM</p>
            <p>Friday: 1 PM - 7 PM</p>
            <p>Saturday: 11 AM - 3 PM</p>
          </div>

          <p className="mt-5 font-black text-pink-600">Pickup Location</p>
          <p className="mt-2 font-bold text-slate-700">
            510 McCormick Drive | Suite B | Glen Burnie, MD 21061
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <a
            href="/shop"
            className="inline-flex items-center justify-center rounded-xl bg-pink-600 px-7 py-4 font-black text-white transition hover:bg-pink-700"
          >
            Back to Shop
          </a>

          <a
            href={MAP_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-xl border-2 border-teal-700 bg-white px-7 py-4 font-black text-teal-800 transition hover:bg-teal-50"
          >
            Get Directions
          </a>
        </div>
      </section>
    </main>
  );
}
