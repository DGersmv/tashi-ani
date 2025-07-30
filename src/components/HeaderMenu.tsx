// HeaderMenu.tsx
"use client";
import React, { useEffect, useState } from "react";

const PHONE = "+7 921 952-61-17";
const WHATSAPP_URL = `https://wa.me/79219526117`;

export default function HeaderMenu() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <header style={{
      position: 'absolute',
      top: '32px',
      right: '48px',
      zIndex: 100,
      display: "flex",
      alignItems: "center",
      gap: 0,
    }}>
      <nav className={`menu-strip${mounted ? " open" : ""}`}>
        <div className="menu-links" style={{ gap: 20 }}>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="menu-link"
            style={{
              fontWeight: 700,
              whiteSpace: "nowrap",
              fontSize: "1em",
              minWidth: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {PHONE}
          </a>
          <a href="#" className="menu-link">Услуги</a>
          <a href="#" className="menu-link">Портфолио</a>
          <a href="#" className="menu-link">Отзывы</a>
          <a href="#" className="menu-link">Контакты</a>
          <a href="#" className="menu-link" style={{
            fontWeight: 700,
            marginLeft: 12
          }}>
            Вход
          </a>
        </div>
      </nav>
    </header>
  );
}