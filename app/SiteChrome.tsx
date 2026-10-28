const FACEBOOK_GROUP_URL = "https://www.facebook.com/groups/1956095674576022";
const LOYALTY_URL = "https://app.squareup.com/loyalty/ML6ZZS746Y0MJ";
const MAP_URL = "https://maps.app.goo.gl/X5aRKYCCKWmEKzUD6";
const LOGO_URL = "https://i.imgur.com/euamaJ6.png";

function Icon({ name, className = "" }) {
  const common = `h-6 w-6 ${className}`;

  if (name === "facebook") {
    return (
      <svg
        className={common}
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M14 8.5V7.2c0-.7.2-1.2 1.2-1.2H17V3h-2.7C11.6 3 10 4.6 10 7v1.5H8v3h2V21h4v-9.5h2.7l.3-3H14z" />
      </svg>
    );
  }

  if (name === "arrow") {
    return (
      <svg
        className={common}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M5 12h14" />
        <path d="M13 6l6 6-6 6" />
      </svg>
    );
  }

  if (name === "map") {
    return (
      <svg
        className={common}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 21s7-5.1 7-11a7 7 0 1 0-14 0c0 5.9 7 11 7 11z" />
        <circle cx="12" cy="10" r="2.5" />
      </svg>
    );
  }

  if (name === "user") {
    return (
      <svg
        className={common}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c1.8-4.2 5-6 8-6s6.2 1.8 8 6" />
      </svg>
    );
  }

  return null;
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b-4 border-pink-500 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between">
        <a href="/" className="inline-flex items-center gap-3">
          <img
            src={LOGO_URL}
            alt="Deals & Steals logo"
            className="h-11 w-auto object-contain md:h-12 lg:h-14"
          />
        </a>

        <nav className="flex flex-wrap items-center gap-4 text-sm font-bold text-slate-700 md:gap-6">
          <a href="/#difference" className="hover:text-pink-600">
            Why Us
          </a>
          <a href="/#hours" className="hover:text-pink-600">
            Hours
          </a>
          <a href="/#visit" className="hover:text-pink-600">
            Visit Us
          </a>
          <a
            href="https://www.retailogic.dev/"
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
  );
}
export function SiteFooter() {
  return (
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
            <a
              href={FACEBOOK_GROUP_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 hover:text-pink-600"
            >
              <Icon name="facebook" className="h-3.5 w-3.5" /> Join Our Facebook
              Group
            </a>
            <a
              href={LOYALTY_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 hover:text-pink-600"
            >
              <Icon name="user" className="h-3.5 w-3.5" /> Join Loyalty Rewards
            </a>
            <a
              href="/returns"
              className="inline-flex items-center gap-2 hover:text-pink-600"
            >
              Returns &amp; Store Credit
            </a>
            <a
              href={MAP_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 hover:text-pink-600"
            >
              <Icon name="map" className="h-3.5 w-3.5" /> Get Directions
            </a>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-8 max-w-7xl border-t border-slate-200 pt-5 text-center text-sm font-medium text-slate-500">
        <a
          href={MAP_URL}
          target="_blank"
          rel="noreferrer"
          className="hover:text-pink-600 transition"
        >
          510 McCormick Drive | Suite B | Glen Burnie, MD 21061
        </a>
      </div>
    </footer>
  );
}
