"use client";
import React from "react";
import { motion } from "framer-motion";

interface SplitTextProps {
  text: string;
  className?: string;
  duration?: number;      // скорость анимации
  letterDelay?: number;   // задержка между буквами
  ease?: any;
  from?: Record<string, any>;
  to?: Record<string, any>;
  textAlign?: "left" | "center" | "right";
  mode?: "line" | "chars"; // 🔑 режим
  delay?: number;          // задержка старта всей строки
}

export default function SplitText({
  text,
  className = "",
  duration = 0.3,
  letterDelay = 0.005,
  ease = [0.42, 0, 0.58, 1],
  from = { opacity: 0, y: 16 },
  to = { opacity: 1, y: 0 },
  textAlign = "left",
  mode = "chars",
  delay = 0,
}: SplitTextProps) {
  const letters = Array.from(text);

  if (mode === "line") {
    // 🔹 Анимация строки целиком
    return (
      <motion.div
        className={`inline-block ${className}`}
        style={{ textAlign }}
        initial={from}
        animate={to}
        transition={{ duration, ease, delay }}
      >
        {text}
      </motion.div>
    );
  }

  // 🔹 Анимация по буквам
  return (
    <div className={`inline-block ${className}`} style={{ textAlign }}>
      {letters.map((char, i) => (
        <motion.span
          key={i}
          initial={from}
          animate={to}
          transition={{
            delay: delay + i * letterDelay,
            duration,
            ease,
          }}
          style={{ display: "inline-block" }}
        >
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </div>
  );
}
