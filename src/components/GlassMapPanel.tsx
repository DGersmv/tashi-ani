"use client";
import React from "react";
import { motion } from "framer-motion";
import OpenGlobusViewer from "./OpenGlobusViewer";
import { useViewMode } from "@/components/ui/ViewMode";

export default function GlassMapPanel() {
  const { setMode } = useViewMode();
  const pad = 5;

  return (
    <div className="mapWrapper">
      {/* Анимация появления без вертикального сдвига */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.44, 0.13, 0.35, 1.08] }}
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          borderRadius: "inherit",
          overflow: "hidden",
          pointerEvents: "auto",
        }}
      >
        <motion.div
          className="group cursor-pointer"
          onClick={() => setMode("portfolio")}
          whileHover={{ y: -6, scale: 1.015, filter: "saturate(1.06)" }}
          transition={{ type: "spring", stiffness: 220, damping: 20 }}
          style={{
            position: "absolute",
            inset: pad,
            borderRadius: "inherit",
            overflow: "hidden",
            background: "rgba(255,255,255,0.15)",
            backdropFilter: "blur(32px)",
            border: "2.5px solid rgba(36,250,255,0.16)",
            boxShadow: "0 0 56px 10px #00fff944, 0 6px 10px #10c9e5b0",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Контент карты */}
          <div
            style={{
              position: "relative",
              width: "100%",
              height: "100%",
              borderRadius: "inherit",
              overflow: "hidden",
              opacity: 0.5,
              transition: "opacity 0.6s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.5")}
          >
            <OpenGlobusViewer />
          </div>
        </motion.div>
      </motion.div>

 <style jsx>{`
        .mapWrapper {
          width: 96vw;
          aspect-ratio: 21 / 12;
          border-radius: 1.7rem;
          margin: 0 auto;
        }
        @media (min-width: 1024px) {
          .mapWrapper {
            position: fixed;             /* фиксируем */
            top: var(--hero-top);        /* тот же уровень, что и текст */
            right: 3%;                   /* прижимаем вправо */
            width: 30vw;
            aspect-ratio: 21 / 9;
            border-radius: 2.2rem;
            margin: 0;                   /* убираем auto-margin */
            z-index: 120;                /* поверх фона, но ниже меню */
          }
        }
      `}</style>
    </div>
  );
}
