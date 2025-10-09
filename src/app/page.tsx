"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useViewMode } from "@/components/ui/ViewMode";
import CompanyDescription from "@/components/CompanyDescription";
import GlassMapPanel from "@/components/GlassMapPanel";
import PortfolioMultiPanels from "@/components/PhotoGlassGrid";
import ServicesGrid from "@/components/ServicesGrid";
import BackgroundSlideshow from "@/components/BackgroundSlideshow";

export default function Page() {
  const { mode } = useViewMode();


  return (
    <main className="relative">
      {/* Фон */}
      <div className="fixed inset-0 -z-20">
        <BackgroundSlideshow />
      </div>

      {/* Главная */}
      {mode === "home" && (
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
            <div className="w-full flex justify-start">
              <div className="max-w-[720px] text-left">
                <CompanyDescription />
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="w-full flex justify-center"
            >
              <GlassMapPanel />
            </motion.div>
          </div>
        </div>
      )}

      {/* Услуги */}
      {mode === "services" && (
        <div className="page-wrap py-8">
          <ServicesGrid />
        </div>
      )}

      {/* Портфолио */}
      {mode === "portfolio" && (
        <div className="page-wrap">
          <PortfolioMultiPanels />
        </div>
      )}
    </main>
  );
}
