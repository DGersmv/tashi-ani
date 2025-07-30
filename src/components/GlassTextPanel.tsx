// src/components/GlassTextPanel.tsx
"use client";
import React, { useRef } from "react";
import { motion } from "framer-motion"; // Добавили импорт — теперь motion работает как магия!

export default function GlassTextPanel({ children }: { children: React.ReactNode }) {
  const panelRef = useRef<HTMLDivElement>(null);

  return (
    <motion.div
      ref={panelRef}
      className="bg-white/10 backdrop-blur-xl shadow-lg flex flex-col"
      whileHover={{ scale: 1.02, boxShadow: "0 0 72px 24px #00fff977" }} // Красивый hover: лёгкий zoom + сияние
      transition={{ duration: 0.25, ease: "easeInOut" }} // Плавность на hover
      style={{
        width: "100%",
        maxWidth: "clamp(320px, 42vw, 840px)", // Идеальные пропорции: responsive ширина
        minHeight: 400,
        borderRadius: "2.2rem", // Сглаженные углы для современного вида
        overflow: "hidden",
        pointerEvents: "auto",
        background: "rgba(255, 255, 255, 0.18)", // Чуть ярче для "стекла"
        border: "1.5px solid rgba(36, 250, 255, 0.22)", // Тоньше border для элегантности
        boxShadow: "0 0 48px 16px #00fff944, 0 8px 28px #10c9e5a0", // Мягкие тени, как в Neomorphism 2025
        padding: "36px 28px", // Воздушный padding
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: "1.4rem",
        boxSizing: "border-box",
        marginLeft: "clamp(120px, 12vw, 150px)", // Отступ слева от logo — пропорциональный, симметричный
        transition: "all 0.3s ease", // Плавные изменения на resize/hover
      }}
    >
      {children}
    </motion.div>
  );
}