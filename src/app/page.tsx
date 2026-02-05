"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useViewMode } from "@/components/ui/ViewMode";
import CompanyDescription from "@/components/CompanyDescription";
import GlassMapPanel from "@/components/GlassMapPanel";
import PortfolioMultiPanels from "@/components/PhotoGlassGrid";
import ServicesGrid from "@/components/ServicesGrid";
import BackgroundSlideshow3D from "@/components/BackgroundSlideshow3D";
import DashboardGrid from "@/components/DashboardGrid";
import AdminDashboard from "@/components/AdminDashboard";
import UserObjectsGrid from "@/components/UserObjectsGrid";
import ObjectDetailView from "@/components/ObjectDetailView";
import AdminObjectsManager from "@/components/AdminObjectsManager";
import AdminObjectDetailView from "@/components/AdminObjectDetailView";
import CustomerPhotoViewer from "@/components/CustomerPhotoViewer";
import Header from "@/components/Header";
import NotificationToast from "@/components/NotificationToast";

export default function Home() {
  const { mode } = useViewMode();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [showNotificationToast, setShowNotificationToast] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadComments, setUnreadComments] = useState(0);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    
    const checkAuth = () => {
      const userEmail = localStorage.getItem('userEmail');
      const isLoggedIn = localStorage.getItem('isLoggedIn');
      const userToken = localStorage.getItem('userToken');
      const adminToken = localStorage.getItem('adminToken');
      const isAdminStatus = localStorage.getItem('isAdmin');
      
      setIsAuthenticated(!!(userEmail && (isLoggedIn === 'true' || userToken)));
      setIsAdmin(!!(adminToken || isAdminStatus === 'true'));
    };

    checkAuth();
  }, [isClient]);

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

  // Функция для обновления состояния после входа
  const handleAuthUpdate = () => {
    const userEmail = localStorage.getItem('userEmail');
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const userToken = localStorage.getItem('userToken');
    const adminToken = localStorage.getItem('adminToken');
    const isAdminStatus = localStorage.getItem('isAdmin');
    
    setIsAuthenticated(!!(userEmail && (isLoggedIn === 'true' || userToken)));
    setIsAdmin(!!(adminToken || isAdminStatus === 'true'));
    
    // Загружаем уведомления после входа
    loadUnreadNotifications();
  };

  return (
    <main className="relative main-content">
      {/* Фон — только слайдшоу фото, без 3D */}
      <div className="fixed inset-0 -z-20">
        <BackgroundSlideshow3D enable3D={false} />
      </div>

      {/* Header */}
      <Header 
        isLoggedIn={isAuthenticated}
        isAdmin={isAdmin}
        onAuthUpdate={handleAuthUpdate}
      />

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
        ) : mode === "dashboard" && isAuthenticated ? (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
          >
            <DashboardGrid />
          </motion.div>
        ) : mode === "objects" && isAuthenticated ? (
          <motion.div
            key="objects"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
          >
            <UserObjectsGrid userEmail={localStorage.getItem('userEmail') || ''} />
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
        ) : mode === "home" ? (
          <motion.div
            key="home"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
          >
            {/* Один общий контейнер */}
            <div className="page-wrap">
              <div
                className="
                  w-full
                  grid grid-cols-1 lg:grid-cols-2
                  gap-8 lg:gap-14
                  px-4 md:px-6
                  items-start
                "
              >
                {/* Левая колонка: текст */}
                <div className="w-full flex justify-start">
                  <div className="max-w-[720px] text-left">
                    <CompanyDescription />
                  </div>
                </div>

                {/* Правая колонка: карта */}
                <div className="w-full flex justify-center">
                  <GlassMapPanel />
                </div>
              </div>
            </div>
          </motion.div>
        ) : mode === "portfolio" ? (
          <motion.div
             key="portfolio"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35 }}
          
          >
          <div className="page-wrap">
            <PortfolioMultiPanels />
          </div>
          </motion.div>
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
