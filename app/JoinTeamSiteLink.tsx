"use client";

import { usePathname } from "next/navigation";

export default function JoinTeamSiteLink() {
  const pathname = usePathname();

  if (pathname !== "/") return null;

  return (
    <div className="border-b border-teal-200 bg-teal-50 px-4 py-2.5 text-center text-sm font-bold text-slate-800">
      Interested in working with us?{" "}
      <a
        href="/join-our-team"
        className="font-black text-pink-600 underline decoration-2 underline-offset-4 transition hover:text-pink-700"
      >
        Join Our Team →
      </a>
    </div>
  );
}
