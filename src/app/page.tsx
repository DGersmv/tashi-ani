"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useViewMode } from "@/components/ui/ViewMode";
import CompanyDescription from "@/components/CompanyDescription";
import GlassMapPanel from "@/components/GlassMapPanel";
import PortfolioMultiPanels from "@/components/PhotoGlassGrid";
import ServicesGrid from "@/components/ServicesGrid";
import BackgroundSlideshow from "@/components/BackgroundSlideshow";
import DashboardGrid from "@/components/DashboardGrid";
import AdminDashboard from "@/components/AdminDashboard";
import UserObjectsGrid from "@/components/UserObjectsGrid";
import ObjectDetailView from "@/components/ObjectDetailView";
import AdminObjectsManager from "@/components/AdminObjectsManager";
import AdminObjectDetailView from "@/components/AdminObjectDetailView";
import Header from "@/components/Header";

export default function Home() {
  const { mode } = useViewMode();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    
    const checkAuth = () => {
      const userEmail = localStorage.getItem('userEmail');
      const isLoggedIn = localStorage.getItem('isLoggedIn');
      const adminToken = localStorage.getItem('adminToken');
      const isAdminStatus = localStorage.getItem('isAdmin');
      
      setIsAuthenticated(!!(userEmail && isLoggedIn === 'true'));
      setIsAdmin(!!(adminToken || isAdminStatus === 'true'));
    };

    checkAuth();
  }, [isClient]);

  // Функция для обновления состояния после входа
  const handleAuthUpdate = () => {
    const userEmail = localStorage.getItem('userEmail');
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const adminToken = localStorage.getItem('adminToken');
    const isAdminStatus = localStorage.getItem('isAdmin');
    
    setIsAuthenticated(!!(userEmail && isLoggedIn === 'true'));
    setIsAdmin(!!(adminToken || isAdminStatus === 'true'));
  };

  return (
    <main className="relative main-content">
      {/* Фон */}
      <div className="fixed inset-0 -z-20">
        <BackgroundSlideshow />
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
    </main>
  );
}
