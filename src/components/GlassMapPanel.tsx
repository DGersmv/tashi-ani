"use client";
import dynamic from "next/dynamic";
import { useState, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import AnimatedGlassBorder from "./AnimatedGlassBorder";
import MapLoader from "./MapLoader";

const CesiumMap = dynamic(() => import("./CesiumMap"), { ssr: false });

export default function GlassMapPanel() {
  const [borderReady, setBorderReady] = useState(false);
  const [panelReady, setPanelReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const panelRef = useRef<HTMLDivElement>(null);

  // Колбэк для border
  const handleBorderComplete = useCallback(() => setBorderReady(true), []);
  // Колбэк для панели
  const handlePanelAnimComplete = useCallback(() => setPanelReady(true), []);
  // Колбэк для карты
  const handleLoaded = useCallback(() => setLoading(false), []);

  // Panel padding чтобы не доходить до border (например, 5px)
  const panelPad = 5;

  return (
    <div
      ref={panelRef}
      style={{
        position: "fixed",
        right: 48,
        top: "22vh",
        zIndex: 40,
        width: "50vw",
        maxWidth: 960,
        height: "42vh",
        borderRadius: "2.2rem",
        overflow: "visible",
        pointerEvents: "none",
      }}
    >
      {/* 1. SVG-бордер всегда виден */}
<AnimatedGlassBorder
  panelRef={panelRef as React.RefObject<HTMLDivElement>}
  onComplete={handleBorderComplete}
  duration={2.1}
/>

      {/* 2. Панель появляется только после border, scale из правого-нижнего угла */}
      {borderReady && (
        <motion.div
          initial={{
            opacity: 0,
            scale: 0.1,
            x: "40%",
            y: "40%",
            borderRadius: "2.2rem",
          }}
          animate={{
            opacity: 1,
            scale: 1,
            x: 0,
            y: 0,
            borderRadius: "2.2rem",
          }}
          transition={{
            duration: 0.77,
            ease: [0.44, 0.13, 0.35, 1.08],
          }}
          style={{
            position: "absolute",
            inset: panelPad,
            width: `calc(100% - ${panelPad * 2}px)`,
            height: `calc(100% - ${panelPad * 2}px)`,
            borderRadius: "2.2rem",
            overflow: "hidden",
            background: "rgba(255,255,255,0.15)",
            backdropFilter: "blur(32px)",
            border: "2.5px solid rgba(36,250,255,0.16)",
            boxShadow: "0 0 56px 18px #00fff944, 0 8px 30px #10c9e5b0",
            zIndex: 50,
            pointerEvents: "auto",
          }}
          onAnimationComplete={handlePanelAnimComplete}
        >
          {/* 3+4. Карта всегда рендерится после появления панели */}
          {panelReady && (
            <div
              style={{
                position: "relative",
                zIndex: 20,
                width: "100%",
                height: "100%",
              }}
            >
              <CesiumMap onLoaded={handleLoaded} />
              {/* Лоадер всегда поверх карты, пока карта не загрузилась */}
              {loading && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 30,
                    background: "rgba(15,23,36,0.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "opacity 0.5s",
                  }}
                >
                  <MapLoader />
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
