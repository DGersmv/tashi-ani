"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useViewMode } from "./ViewMode";

/** Синхронизирует mode с URL */
export default function ModeSync() {
  const pathname = usePathname();
  const { setMode } = useViewMode();

  useEffect(() => {
    if (pathname?.startsWith("/portfolio")) {
      setMode("portfolio");
    } else if (pathname?.startsWith("/services")) {
      setMode("services");
    } else {
      setMode("home");
    }
  }, [pathname, setMode]);

  return null;
}
