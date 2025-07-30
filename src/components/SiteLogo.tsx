// SiteLogo.tsx
"use client";
import Image from "next/image";
import { motion } from "framer-motion";

export default function SiteLogo() {
  return (
    <motion.a
      href="/"
      className="site-logo-glass"
      initial={{ opacity: 0, scale: 0.2, x: -80, y: -80 }}
      animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
      transition={{ duration: 1.13, type: "spring", stiffness: 44, damping: 13 }}
      style={{
        position: "absolute",
        top: "28px",
        left: "32px",
        zIndex: 120,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "120px",
        height: "120px",
        borderRadius: "50%",
        background: "#40826d",
        boxShadow: "0 8px 32px 0 #0003, 0 2px 8px rgba(127, 165, 162, 0.11)",
        border: "2.5px solid #fff8",
        transition: "background .25s, box-shadow .25s, transform .20s",
      }}
    >
      <Image
        src="/logo_new.png"
        alt="TASHI ANI STUDIO"
        width={96}
        height={96}
        style={{
          borderRadius: "50%",
          background: "transparent",
          boxShadow: "0 2px 12px rgba(12, 39, 37, 0.44)",
          padding: "8px",
          transition: "transform .17s",
        }}
        priority
      />
    </motion.a>
  );
}