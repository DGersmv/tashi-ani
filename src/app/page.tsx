"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useViewMode } from "@/components/ui/ViewMode";
import CompanyDescription from "@/components/CompanyDescription";
import GlassMapPanel from "@/components/GlassMapPanel";
import PortfolioMultiPanels from "@/components/PhotoGlassGrid";
import BackgroundSlideshow from "@/components/BackgroundSlideshow";

export default function Home() {
  const { mode } = useViewMode();

  return (
    <main className="relative">
      {/* Фон */}
      <div className="fixed inset-0 -z-20">
        <BackgroundSlideshow />
      </div>

      {/* Затемняющий слой для режима портфолио */}
      <motion.div
        aria-hidden
        className="fixed inset-0 -z-10 pointer-events-none"
        initial={false}
        animate={{ opacity: mode === "portfolio" ? 1 : 0 }}
        transition={{ duration: 0.45 }}
        style={{ backgroundColor: "rgba(10,10,10,1)" }}
      />

      <AnimatePresence initial={false} mode="wait">
        {mode === "home" ? (
          <motion.div
            key="home"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
          >
            {/* Один общий контейнер */}
            <div className="page-wrap">
              <div
                className="
                  w-full
                  grid grid-cols-1 lg:grid-cols-2
                  gap-8 lg:gap-14
                  px-4 md:px-6
                  items-start
                "
              >
                {/* Левая колонка: текст */}
                <div className="w-full flex justify-start">
                  <div className="max-w-[720px] text-left">
                    <CompanyDescription />
                  </div>
                </div>

                {/* Правая колонка: карта */}
                <div className="w-full flex justify-center">
                  <GlassMapPanel />
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
             key="portfolio"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35 }}
          
          >
            <PortfolioMultiPanels />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
