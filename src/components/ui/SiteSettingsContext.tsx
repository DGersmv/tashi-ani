"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import type { SiteSettingsPayload } from "@/app/api/site-settings/route";

const defaultSettings: SiteSettingsPayload = {
  menuFont: "ChinaCyr",
  headingFont: "ChinaCyr",
  contactPhone: "+7 921 952-61-17",
  contactWhatsApp: "https://wa.me/79219526117",
  contactTelegram: "https://t.me/tashiani",
  contactEmail: "info@tashi-ani.ru",
  mapCenterLon: 30.36,
  mapCenterLat: 59.94,
  mapLogoPath: "/points/default.png",
  siteLogoPath: "/logo_new.png",
};

const SiteSettingsContext = createContext<SiteSettingsPayload>(defaultSettings);

export function SiteSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SiteSettingsPayload>(defaultSettings);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/site-settings", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data && typeof data === "object") {
          const next = { ...defaultSettings, ...data };
          setSettings(next);
          if (typeof document !== "undefined") {
            const menuStack = `${next.menuFont || "ChinaCyr"}, Arial, Helvetica, sans-serif`;
            const headingStack = `${next.headingFont || "ChinaCyr"}, Arial, Helvetica, sans-serif`;
            document.documentElement.style.setProperty("--font-menu", menuStack);
            document.documentElement.style.setProperty("--font-heading", headingStack);
          }
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const menuStack = `${settings.menuFont || "ChinaCyr"}, Arial, Helvetica, sans-serif`;
    const headingStack = `${settings.headingFont || "ChinaCyr"}, Arial, Helvetica, sans-serif`;
    document.documentElement.style.setProperty("--font-menu", menuStack);
    document.documentElement.style.setProperty("--font-heading", headingStack);
  }, [settings.menuFont, settings.headingFont]);

  return (
    <SiteSettingsContext.Provider value={settings}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}
