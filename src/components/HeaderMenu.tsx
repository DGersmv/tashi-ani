"use client";
import React, { useEffect, useState } from "react";
import { useViewMode } from "@/components/ui/ViewMode";

const PHONE = "+7 921 952-61-17";
const WHATSAPP_URL = `https://wa.me/79219526117`;

export default function HeaderMenu() {
  const [open, setOpen] = useState(false);
  const [isWide, setIsWide] = useState(false);
  const { setMode } = useViewMode();

  useEffect(() => {
    const on = () => setIsWide(window.innerWidth > 1200);
    on();
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setOpen(true), 60);
    return () => clearTimeout(t);
  }, []);

  const bar: React.CSSProperties = {
    position: "relative",
    marginTop: 12,
    width: "100%",
    paddingRight: isWide ? 32 : 0,
    zIndex: 200,
  };

  // ↑↑ ничего кроме размеров panel не трогаем
  const panel: React.CSSProperties = isWide
    ? {
        // расширили панель на десктопе
        width: "min(58vw, calc(100vw - 64px))",
        maxWidth: "980px",
        minWidth: "640px",
        marginLeft: "auto",
        borderRadius: 9999,
        backdropFilter: "blur(18px)",
        background: "linear-gradient(180deg, rgba(255,255,255,.18), rgba(255,255,255,.12))",
        border: "2px solid rgba(211, 163, 115, 0.6)",
        boxShadow: "0 8px 24px rgba(0,0,0,.25), inset 0 0 0 1px rgba(255,255,255,.22)",
        padding: "12px 22px", // немного больше внутренний отступ
        overflow: "hidden",
      }
    : {
        width: "96vw",
        margin: "10px auto 0",
        borderRadius: 9999,
        backdropFilter: "blur(18px)",
        background: "linear-gradient(180deg, rgba(255,255,255,.18), rgba(255,255,255,.12))",
        border: "2px solid rgba(90, 107, 151, 0.6)",
        boxShadow: "0 8px 24px rgba(0,0,0,.25), inset 0 0 0 1px rgba(255,255,255,.22)",
        padding: "12px 18px",
        overflow: "hidden",
      };

  // единый шрифт для всех пунктов — ChinaCyr (fallback Montserrat)
  const linkFont: React.CSSProperties = {
    fontFamily: "ChinaCyr, var(--font-montserrat), sans-serif",
    whiteSpace: "nowrap",
  };

  return (
    <div style={bar}>
      <nav className={`menu-strip${open ? " open" : ""}`} style={panel}>
        <div
          className="menu-links"
          style={{
            display: "flex",
            alignItems: "center",
            width: "100%",
            gap: 14,
            flexWrap: isWide ? "nowrap" : "wrap",
            justifyContent: isWide ? "space-between" : "center",
            overflow: "hidden",
          }}
        >
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="menu-link"
            style={{ ...linkFont, fontWeight: 700 }}
          >
            {PHONE}
          </a>

          <button
           type="button"
            className="menu-link"
            onClick={() => setMode("home")}
          >
            Главная
          </button>

          <a className="menu-link" href="#" style={linkFont}>
            Услуги
          </a>

          
          <button
            type="button"
            className="menu-link"
            onClick={() => setMode("portfolio")}
          >
            Портфолио
          </button>

          <a className="menu-link" href="#" style={linkFont}>
            Отзывы
          </a>

          <a className="menu-link" href="#" style={linkFont}>
            Контакты
          </a>

          <a className="menu-link" href="#" style={{ ...linkFont, fontWeight: 700 }}>
            Вход
          </a>
        </div>
      </nav>
    </div>
  );
}
