"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";

export default function JoinTeamSiteLink() {
  const pathname = usePathname();
  const [nav, setNav] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (pathname !== "/") {
      setNav(null);
      return;
    }

    setNav(document.querySelector<HTMLElement>("header nav"));
  }, [pathname]);

  if (pathname !== "/" || !nav) return null;

  return createPortal(
    <a href="/join-our-team" className="transition hover:text-pink-600">
      Join Our Team
    </a>,
    nav
  );
}
