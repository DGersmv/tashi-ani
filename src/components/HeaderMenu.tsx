"use client";
import React, { useEffect, useState } from "react";
import { useViewMode } from "@/components/ui/ViewMode";
import LoginPanel from "@/components/LoginPanel";

const PHONE = "+7 921 952-61-17";
const WHATSAPP_URL = `https://wa.me/79219526117`;

interface HeaderMenuProps {
  isLoggedIn?: boolean;
  isAdmin?: boolean;
  onAuthUpdate?: () => void;
}

export default function HeaderMenu({ isLoggedIn: propIsLoggedIn, isAdmin: propIsAdmin, onAuthUpdate }: HeaderMenuProps = {}) {
  const [open, setOpen] = useState(false);
  const [isWide, setIsWide] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(propIsLoggedIn || false);
  const [userEmail, setUserEmail] = useState("");
  const [isAdmin, setIsAdmin] = useState(propIsAdmin || false);
  const { setMode, mode } = useViewMode();

  useEffect(() => {
    const on = () => setIsWide(window.innerWidth > 1200);
    on();
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);

  // Синхронизация с пропсами
  useEffect(() => {
    if (propIsLoggedIn !== undefined) {
      setIsLoggedIn(propIsLoggedIn);
    }
    if (propIsAdmin !== undefined) {
      setIsAdmin(propIsAdmin);
    }
  }, [propIsLoggedIn, propIsAdmin]);

  // Проверяем статус входа при загрузке
  useEffect(() => {
    const savedEmail = localStorage.getItem('userEmail');
    const savedLoginStatus = localStorage.getItem('isLoggedIn');
    const adminToken = localStorage.getItem('adminToken');
    
    if (savedEmail && savedLoginStatus === 'true') {
      setIsLoggedIn(true);
      setUserEmail(savedEmail);
    }
    
    if (adminToken) {
      setIsAdmin(true);
      setIsLoggedIn(true);
      setUserEmail('2277277@bk.ru');
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setOpen(true), 60);
    return () => clearTimeout(t);
  }, []);

  const handleLoginSuccess = (email: string, isAdmin?: boolean) => {
    setUserEmail(email);
    setIsLoggedIn(true);
    
    if (isAdmin) {
      setIsAdmin(true);
      setMode("admin-dashboard");
    } else {
      setIsAdmin(false);
      setMode("dashboard");
    }
    
    // Сохраняем данные в localStorage для персистентности
    localStorage.setItem('userEmail', email);
    localStorage.setItem('isLoggedIn', 'true');
    
    if (isAdmin) {
      localStorage.setItem('isAdmin', 'true');
      // Сохраняем adminToken если он есть в localStorage
      const adminToken = localStorage.getItem('adminToken');
      console.log('HeaderMenu: сохраняем adminToken', adminToken ? `${adminToken.substring(0, 20)}...` : 'null');
    }
    
    // Вызываем обновление состояния в родительском компоненте
    if (onAuthUpdate) {
      onAuthUpdate();
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserEmail("");
    setIsAdmin(false);
    setMode("home");

    // Очищаем localStorage
    localStorage.removeItem('userEmail');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('adminToken');
  };

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
        minWidth: "320px",
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
        borderRadius: 16, // Меньше радиус для мобильных
        backdropFilter: "blur(18px)",
        background: "linear-gradient(180deg, rgba(255,255,255,.18), rgba(255,255,255,.12))",
        border: "2px solid rgba(90, 107, 151, 0.6)",
        boxShadow: "0 8px 24px rgba(0,0,0,.25), inset 0 0 0 1px rgba(255,255,255,.22)",
        padding: "8px 12px", // Меньше padding для мобильных
        overflow: "hidden",
      };

  // единый шрифт для всех пунктов — ChinaCyr (fallback Montserrat)
  const linkFont: React.CSSProperties = {
    fontFamily: "ChinaCyr, var(--font-montserrat), sans-serif",
    whiteSpace: "nowrap",
    flexShrink: 1, // Позволяет элементам сжиматься
    minWidth: 0, // Позволяет тексту обрезаться
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
            gap: isWide ? 14 : 6, // Уменьшили gap для мобильных
            flexWrap: isWide ? "nowrap" : "wrap",
            justifyContent: isWide ? "space-between" : "center",
            overflow: "hidden",
            minWidth: 0, // Позволяет элементам сжиматься
          }}
        >
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="menu-link"
            style={linkFont}
          >
            {PHONE}
          </a>

          <button
            type="button"
            className={`menu-link ${mode === "home" ? 'active' : ''}`}
            onClick={() => setMode("home")}
            style={linkFont}
          >
            Главная
          </button>

          <button
            type="button"
            className={`menu-link ${mode === "services" ? 'active' : ''}`}
            onClick={() => setMode("services")}
            style={linkFont}
          >
            Услуги
          </button>

          <button
            type="button"
            className={`menu-link ${mode === "portfolio" ? 'active' : ''}`}
            onClick={() => setMode("portfolio")}
            style={linkFont}
          >
            Портфолио
          </button>

          <a className="menu-link" href="#" style={linkFont}>
            Отзывы
          </a>

          <a className="menu-link" href="#" style={linkFont}>
            Контакты
          </a>

              {!isLoggedIn ? (
                <button
                  type="button"
                  className="menu-link"
                  onClick={() => setIsLoginOpen(true)}
                  style={linkFont}
                >
                  Вход
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    className={`menu-link ${mode === "dashboard" || mode === "admin-dashboard" ? 'active' : ''}`}
                    onClick={() => setMode(isAdmin ? "admin-dashboard" : "dashboard")}
                    style={{ 
                      ...linkFont, 
                      color: mode === "dashboard" || mode === "admin-dashboard" ? "rgba(211, 163, 115, 1)" : "rgba(211, 163, 115, 0.9)",
                    }}
                  >
                    {isAdmin ? "Админ" : "Кабинет"}
                  </button>
                  <button
                    type="button"
                    className="menu-link"
                    onClick={handleLogout}
                    style={{ 
                      ...linkFont, 
                      color: "rgba(239, 68, 68, 0.9)"
                    }}
                  >
                    Выйти
                  </button>
                </>
              )}
        </div>
      </nav>

      {/* Панель входа */}
      <LoginPanel 
        isOpen={isLoginOpen} 
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

    </div>
  );
}
