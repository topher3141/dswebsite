import type { Metadata } from "next";

const FACEBOOK_GROUP_URL = "https://www.facebook.com/groups/1956095674576022";
const LOGO_URL = "https://i.imgur.com/euamaJ6.png";

export const metadata: Metadata = {
  title: "Join Our Team | Deals & Steals",
  description:
    "Interested in working at Deals & Steals? Learn what it is like to join our fast-moving local retail team in Glen Burnie, Maryland.",
};

const PERKS = [
  {
    icon: "⚡",
    title: "Never boring",
    text: "New truckloads, new products, and new challenges keep every week different.",
    accent: "bg-pink-100 text-pink-700",
  },
  {
    icon: "🏷️",
    title: "Employee deals",
    text: "Work around the closeouts, overstock, and unexpected finds our customers love.",
    accent: "bg-teal-100 text-teal-800",
  },
  {
    icon: "↗",
    title: "Room to grow",
    text: "We are a growing local business, and dependable people have room to take on more.",
    accent: "bg-pink-100 text-pink-700",
  },
  {
    icon: "🤝",
    title: "Real teamwork",
    text: "We pitch in, help each other, and do what needs to be done to keep the store moving.",
    accent: "bg-teal-100 text-teal-800",
  },
];

const ROLES = [
  {
    title: "Retail Team Member",
    type: "Part-Time / Full-Time",
    description:
      "Help customers, process and price incoming product, stock merchandise, organize the sales floor, and keep the store ready for the next rush of deals.",
    tags: ["Customer Service", "Product Processing", "Stocking", "Merchandising"],
  },
  {
    title: "E-Commerce Team Member",
    type: "Part-Time / Full-Time",
    description:
      "Photograph and list products online, write accurate descriptions, manage online inventory and orders, and help keep our e-commerce channels current and organized.",
    tags: ["Online Listings", "Product Photography", "Order Fulfillment"],
  },
];

const TRAITS = [
  "Dependable and on time",
  "Comfortable in a fast-paced environment",
  "Willing to jump in wherever needed",
  "Friendly and helpful with customers",
  "Able to work independently and as part of a team",
  "Comfortable with the physical side of retail when the role requires it",
];

function ArrowIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden="true"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

export default function JoinOurTeamPage() {
  return (
    <div className="min-h-screen bg-[#f7efe5] text-slate-900">
      <header className="sticky top-0 z-40 border-b-4 border-pink-500 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between">
          <a href="/" className="inline-flex items-center">
            <img
              src={LOGO_URL}
              alt="Deals & Steals logo"
              className="h-11 w-auto object-contain md:h-12 lg:h-14"
            />
          </a>

          <nav className="flex flex-wrap items-center gap-4 text-sm font-bold text-slate-700 md:gap-6">
            <a href="/#difference" className="transition hover:text-pink-600">
              Why Us
            </a>
            <a href="/#hours" className="transition hover:text-pink-600">
              Hours
            </a>
            <a href="/#visit" className="transition hover:text-pink-600">
              Visit Us
            </a>
            <a
              href="#roles"
              className="rounded-full bg-pink-600 px-4 py-2 text-white shadow-sm transition hover:bg-pink-700"
            >
              Join Our Team
            </a>
          </nav>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden bg-white">
          <div className="absolute inset-y-0 right-0 hidden w-[52%] bg-gradient-to-l from-[#c7f2ed] via-[#effbf9] to-transparent lg:block" />
          <div className="absolute -right-16 top-6 hidden h-80 w-80 rounded-full bg-pink-200/60 blur-3xl lg:block" />
          <div className="absolute bottom-0 right-[28%] hidden h-64 w-64 rounded-full bg-teal-200/60 blur-3xl lg:block" />

          <div className="relative mx-auto grid max-w-7xl gap-12 px-5 py-16 md:py-24 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:py-28">
            <div>
              <span className="inline-flex rounded-full bg-teal-100 px-4 py-2 text-sm font-black uppercase tracking-[0.18em] text-teal-800">
                Join Our Team
              </span>
              <h1 className="mt-6 max-w-3xl text-5xl font-black leading-[0.95] tracking-tight text-slate-950 sm:text-6xl lg:text-7xl">
                Work somewhere that&apos;s
                <span className="block text-pink-600">never boring.</span>
              </h1>
              <p className="mt-6 max-w-2xl text-lg font-medium leading-8 text-slate-600 md:text-xl">
                Deals &amp; Steals is a fast-moving local retailer where the inventory changes constantly,
                the work stays interesting, and every day looks a little different.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="#roles"
                  className="inline-flex items-center gap-2 rounded-full bg-pink-600 px-6 py-3.5 font-black text-white shadow-lg shadow-pink-200 transition hover:-translate-y-0.5 hover:bg-pink-700"
                >
                  See Roles We Hire For
                  <ArrowIcon />
                </a>
                <a
                  href="#what-we-look-for"
                  className="inline-flex items-center rounded-full border-2 border-slate-200 bg-white px-6 py-3.5 font-black text-slate-800 transition hover:border-teal-300 hover:bg-teal-50"
                >
                  What We Look For
                </a>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-xl">
              <div className="absolute -left-5 -top-5 h-full w-full rotate-[-3deg] rounded-[2.5rem] bg-pink-500" />
              <div className="relative overflow-hidden rounded-[2.5rem] border-4 border-slate-950 bg-slate-950 p-7 text-white shadow-2xl sm:p-9">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.2em] text-teal-300">
                      Deals &amp; Steals
                    </p>
                    <h2 className="mt-2 text-3xl font-black">Not typical retail.</h2>
                  </div>
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-pink-500 text-3xl">
                    📦
                  </div>
                </div>

                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  {["Fresh truckloads", "Unexpected finds", "Local customers", "Hands-on work"].map((item) => (
                    <div key={item} className="rounded-2xl border border-white/10 bg-white/10 p-4">
                      <div className="mb-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-teal-300 text-slate-950">
                        <CheckIcon />
                      </div>
                      <p className="font-black">{item}</p>
                    </div>
                  ))}
                </div>

                <p className="mt-7 border-t border-white/15 pt-6 text-sm font-semibold leading-6 text-slate-300">
                  If you like staying busy, solving problems, and helping turn a truckload of merchandise
                  into a great shopping experience, you&apos;ll probably feel at home here.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-black/5 bg-[#f7efe5] py-16 md:py-20">
          <div className="mx-auto max-w-7xl px-5">
            <div className="max-w-2xl">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-pink-600">Why work here?</p>
              <h2 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">A small team with a lot going on.</h2>
            </div>

            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {PERKS.map((perk) => (
                <article key={perk.title} className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-sm">
                  <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl text-xl font-black ${perk.accent}`}>
                    {perk.icon}
                  </div>
                  <h3 className="mt-5 text-xl font-black">{perk.title}</h3>
                  <p className="mt-2 leading-7 text-slate-600">{perk.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="roles" className="scroll-mt-28 bg-white py-16 md:py-24">
          <div className="mx-auto max-w-7xl px-5">
            <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div className="max-w-3xl">
                <p className="text-sm font-black uppercase tracking-[0.2em] text-teal-700">Opportunities</p>
                <h2 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">Roles we hire for</h2>
                <p className="mt-4 text-lg leading-8 text-slate-600">
                  Our needs change as the business grows. These are some of the roles that make Deals &amp; Steals run.
                </p>
              </div>
              <span className="inline-flex w-fit rounded-full bg-pink-100 px-4 py-2 text-sm font-black text-pink-700">
                Glen Burnie, Maryland
              </span>
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-2">
              {ROLES.map((role, index) => (
                <article
                  key={role.title}
                  className="group relative overflow-hidden rounded-[2rem] border-2 border-slate-200 bg-[#fffdfa] p-7 transition hover:-translate-y-1 hover:border-pink-300 hover:shadow-xl sm:p-8"
                >
                  <div className={`absolute right-0 top-0 h-24 w-24 rounded-bl-[4rem] ${index % 2 === 0 ? "bg-pink-100" : "bg-teal-100"}`} />
                  <div className="relative">
                    <p className="text-sm font-black uppercase tracking-[0.14em] text-slate-500">{role.type}</p>
                    <h3 className="mt-3 text-3xl font-black">{role.title}</h3>
                    <p className="mt-4 max-w-xl leading-7 text-slate-600">{role.description}</p>

                    <div className="mt-6 flex flex-wrap gap-2">
                      {role.tags.map((tag) => (
                        <span key={tag} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-700">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <a
                      href="#apply"
                      className="mt-7 inline-flex items-center gap-2 font-black text-pink-600 transition group-hover:gap-3"
                    >
                      I&apos;m interested
                      <ArrowIcon />
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="what-we-look-for" className="scroll-mt-28 bg-slate-950 py-16 text-white md:py-24">
          <div className="mx-auto grid max-w-7xl gap-12 px-5 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-teal-300">What matters here</p>
              <h2 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
                Attitude and work ethic beat the perfect résumé.
              </h2>
              <p className="mt-5 text-lg leading-8 text-slate-300">
                Retail experience can help, but being dependable, helpful, and ready to work matters more.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {TRAITS.map((trait) => (
                <div key={trait} className="flex gap-3 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-300 text-slate-950">
                    <CheckIcon />
                  </span>
                  <span className="font-bold leading-6 text-slate-100">{trait}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="apply" className="scroll-mt-28 bg-[#f7efe5] py-16 md:py-24">
          <div className="mx-auto max-w-5xl px-5">
            <div className="overflow-hidden rounded-[2.5rem] border-4 border-slate-950 bg-white shadow-xl">
              <div className="grid lg:grid-cols-[1.1fr_.9fr]">
                <div className="p-8 sm:p-10 lg:p-12">
                  <p className="text-sm font-black uppercase tracking-[0.2em] text-pink-600">Interested?</p>
                  <h2 className="mt-3 text-4xl font-black tracking-tight">Tell us you want to join the team.</h2>
                  <p className="mt-5 text-lg leading-8 text-slate-600">
                    Hiring needs can change quickly. If one of these roles sounds like a fit, reach out and let us know
                    what kind of work you are interested in.
                  </p>
                  <a
                    href={FACEBOOK_GROUP_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-7 inline-flex items-center gap-2 rounded-full bg-pink-600 px-6 py-3.5 font-black text-white shadow-lg shadow-pink-200 transition hover:-translate-y-0.5 hover:bg-pink-700"
                  >
                    Connect With Us on Facebook
                    <ArrowIcon />
                  </a>
                  <p className="mt-4 text-sm font-semibold text-slate-500">
                    Prefer in person? Stop by the store during regular hours and ask about current opportunities.
                  </p>
                </div>

                <div className="flex min-h-72 items-center justify-center bg-teal-300 p-8 text-center sm:p-10">
                  <div>
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-white text-4xl shadow-lg">
                      👋
                    </div>
                    <p className="mt-6 text-sm font-black uppercase tracking-[0.2em] text-teal-950/70">Come say hi</p>
                    <p className="mt-2 text-3xl font-black leading-tight text-slate-950">Great people make great deals happen.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-black/10 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-8 text-sm font-semibold text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Deals &amp; Steals. All rights reserved.</p>
          <a href="/" className="font-black text-slate-700 transition hover:text-pink-600">
            Back to Deals &amp; Steals
          </a>
        </div>
      </footer>
    </div>
  );
}