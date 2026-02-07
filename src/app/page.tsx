"use client";

import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useViewMode } from "@/components/ui/ViewMode";
import CompanyDescription from "@/components/CompanyDescription";
import GlassMapPanel from "@/components/GlassMapPanel";
import PortfolioMultiPanels from "@/components/PhotoGlassGrid";
import ServicesGrid from "@/components/ServicesGrid";
import BackgroundSlideshow3D from "@/components/BackgroundSlideshow3D";
import AdminDashboard from "@/components/AdminDashboard";
import UserObjectsGrid from "@/components/UserObjectsGrid";
import ObjectDetailView from "@/components/ObjectDetailView";
import AdminObjectsManager from "@/components/AdminObjectsManager";
import AdminObjectDetailView from "@/components/AdminObjectDetailView";
import CustomerPhotoViewer from "@/components/CustomerPhotoViewer";
import { useAuth } from "@/components/ui/AuthContext";
import NotificationToast from "@/components/NotificationToast";

export default function Home() {
  const { mode } = useViewMode();
  const prevModeRef = useRef<string | undefined>(undefined);
  // Та же анимация, что при закрытии панели входа: текст построчно + панель карты
  const isEnteringHome =
    mode === "home" && prevModeRef.current !== undefined && prevModeRef.current !== "home";
  useEffect(() => {
    prevModeRef.current = mode;
  }, [mode]);

  const { isLoggedIn: isAuthenticated, isAdmin } = useAuth();
  const [isClient, setIsClient] = useState(false);
  const [showNotificationToast, setShowNotificationToast] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadComments, setUnreadComments] = useState(0);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Функция для загрузки непрочитанных уведомлений
  const loadUnreadNotifications = async () => {
    const userEmail = localStorage.getItem('userEmail');
    const adminToken = localStorage.getItem('adminToken');
    const isAdminUser = !!(adminToken || localStorage.getItem('isAdmin') === 'true');

    if (!userEmail) return;

    try {
      const response = await fetch(`/api/notifications/unread?email=${encodeURIComponent(userEmail)}&isAdmin=${isAdminUser}`);
      const data = await response.json();

      if (data.success && data.total > 0) {
        setUnreadMessages(data.unreadMessages || 0);
        setUnreadComments(data.unreadComments || 0);
        setShowNotificationToast(true);
      }
    } catch (error) {
      console.error("Ошибка загрузки уведомлений:", error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) loadUnreadNotifications();
  }, [isAuthenticated]);

  return (
    <main className="relative main-content">
      {/* Фон — только слайдшоу фото, без 3D */}
      <div className="fixed inset-0 -z-20">
        <BackgroundSlideshow3D enable3D={false} />
      </div>

      {/* Затемняющий слой для режима портфолио */}
      <motion.div
        aria-hidden
        className="fixed inset-0 -z-10 pointer-events-none"
        initial={false}
        animate={{ opacity: mode === "portfolio" ? 1 : 0 }}
        transition={{ duration: 0.45 }}
        style={{ backgroundColor: "rgba(10,10,10,1)" }}
      />

      <AnimatePresence initial={false} mode="wait">
        {mode === "admin-dashboard" && isAdmin ? (
          <motion.div
            key="admin-dashboard"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
          >
            <AdminDashboard 
              userEmail="2277277@bk.ru" 
              onLogout={() => {
                localStorage.removeItem('adminToken');
                localStorage.removeItem('isAdmin');
                window.location.reload();
              }}
            />
          </motion.div>
        ) : (mode === "dashboard" || mode === "objects") && isAuthenticated && !isAdmin ? (
          <motion.div
            key="customer-dashboard"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
          >
            <UserObjectsGrid userEmail={localStorage.getItem("userEmail") || ""} />
          </motion.div>
        ) : mode === "object-detail" && isAuthenticated ? (
          <motion.div
            key="object-detail"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
          >
            <ObjectDetailView userEmail={localStorage.getItem('userEmail') || ''} />
          </motion.div>
        ) : mode === "admin-objects" && isAdmin ? (
          <motion.div
            key="admin-objects"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
          >
            <AdminObjectsManager adminToken={localStorage.getItem('adminToken') || ''} />
          </motion.div>
        ) : mode === "admin-object-detail" && isAdmin ? (
          <motion.div
            key="admin-object-detail"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
          >
            <AdminObjectDetailView adminToken={typeof window !== 'undefined' ? localStorage.getItem('adminToken') || '' : ''} />
          </motion.div>
        ) : mode === "home" || mode === "portfolio" || mode === "services" ? (
          <div key="main-with-home" style={{ position: "relative" }}>
            {/* Главная (текст + карта) всегда в DOM при home/portfolio/services — карта не перезагружается */}
            {/* Слой главной всегда в потоке (задаёт высоту), при Услуги/Портфолио просто скрыт */}
            <motion.div
              initial={false}
              animate={{
                opacity: mode === "home" ? 1 : 0,
                visibility: mode === "home" ? "visible" : "hidden",
                pointerEvents: mode === "home" ? "auto" : "none",
              }}
              transition={{ duration: 0.35 }}
              style={{
                position: "relative",
                left: 0,
                right: 0,
                top: 0,
                zIndex: 1,
              }}
            >
              <div className="page-wrap page-wrap--home">
                <div className="home-grid" style={{ overflow: "hidden", minWidth: 0 }}>
                  <div
                    className="w-full flex justify-start min-w-0"
                    style={{ alignSelf: "start", paddingLeft: 0, marginLeft: 0 }}
                  >
                    <div className="max-w-[720px] min-w-0 w-full text-left" style={{ marginLeft: 0, paddingLeft: 0 }}>
                      <CompanyDescription enteredHome={isEnteringHome} forceHidden={mode !== "home"} />
                    </div>
                  </div>
                  <div className="w-full flex justify-end min-w-0" style={{ alignSelf: "start" }}>
                    <GlassMapPanel enteredHome={isEnteringHome} forceHidden={mode !== "home"} />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Услуги/Портфолио — поверх главной, без участия в потоке, чтобы при переходе на Главную не улетали вниз */}
            <AnimatePresence initial={false} mode="wait">
              {mode === "portfolio" && (
                <motion.div
                  key="portfolio"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.35 }}
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top: 0,
                    bottom: 0,
                    zIndex: 2,
                  }}
                >
                  <div className="page-wrap">
                    <PortfolioMultiPanels />
                  </div>
                </motion.div>
              )}
              {mode === "services" && (
                <motion.div
                  key="services"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.35 }}
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    top: 0,
                    bottom: 0,
                    zIndex: 2,
                  }}
                >
                  <div className="page-wrap">
                    <ServicesGrid />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : mode === "photo-viewer" && isAuthenticated ? (
          <motion.div
            key="photo-viewer"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
          >
            <CustomerPhotoViewer userEmail={localStorage.getItem('userEmail') || ''} />
          </motion.div>
        ) : (
          <motion.div
            key="services"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35 }}
          >
            <div className="page-wrap">
              <ServicesGrid />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast уведомлений */}
      {showNotificationToast && (
        <NotificationToast
          unreadMessages={unreadMessages}
          unreadComments={unreadComments}
          onClose={() => setShowNotificationToast(false)}
        />
      )}
    </main>
  );
}
