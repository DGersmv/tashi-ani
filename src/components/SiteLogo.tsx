"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";

export default function SiteLogo() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const on = () => setIsMobile(window.innerWidth <= 650);
    on();
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);

  return (
    <div
      style={{
        ...(isMobile
          ? {
              position: "static",
              margin: "18px auto 8px",
              zIndex: "auto",
            }
          : {
              position: "fixed",
              top: 22,
              left: 24,
              zIndex: 300,
            }),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: isMobile ? 96 : 140,
        height: isMobile ? 96 : 140,
        borderRadius: "50%",
        background: "#40826d",
        boxShadow: "0 8px 32px 0 #0003, 0 2px 8px rgba(127,165,162,0.11)",
        border: "2.5px solid #fff8",
      }}
    >
      <Image
        src="/logo_new.png"
        alt="TASHI ANI STUDIO"
        width={isMobile ? 72 : 112}
        height={isMobile ? 72 : 112}
        style={{ borderRadius: "50%", padding: 9, boxShadow: "0 2px 12px rgba(12,39,37,0.44)" }}
        priority
      />
    </div>
  );
}
