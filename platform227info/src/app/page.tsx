"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useViewMode } from "@/components/ui/ViewMode";
import BackgroundSlideshow from "@/components/BackgroundSlideshow";
import DashboardGrid from "@/components/DashboardGrid";
import AdminDashboard from "@/components/AdminDashboard";
import UserObjectsGrid from "@/components/UserObjectsGrid";
import ObjectDetailView from "@/components/ObjectDetailView";
import AdminObjectsManager from "@/components/AdminObjectsManager";
import AdminObjectDetailView from "@/components/AdminObjectDetailView";
import CustomerPhotoViewer from "@/components/CustomerPhotoViewer";
import NotificationToast from "@/components/NotificationToast";
import LoginPanel from "@/components/LoginPanel";

export default function Home() {
  const { mode, setMode } = useViewMode();
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

    const userEmail = localStorage.getItem("userEmail");
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    const userToken = localStorage.getItem("userToken");
    const adminToken = localStorage.getItem("adminToken");
    const isAdminStatus = localStorage.getItem("isAdmin");

    const authenticated = !!(userEmail && (isLoggedIn === "true" || userToken));
    const admin = !!(adminToken || isAdminStatus === "true");

    setIsAuthenticated(authenticated);
    setIsAdmin(admin);

    if (authenticated && mode === "home") {
      setMode(admin ? "admin-dashboard" : "objects");
    }
  }, [isClient, mode, setMode]);

  const loadUnreadNotifications = async () => {
    const userEmail = localStorage.getItem("userEmail");
    const adminToken = localStorage.getItem("adminToken");
    const isAdminUser = !!(adminToken || localStorage.getItem("isAdmin") === "true");

    if (!userEmail) return;

    try {
      const response = await fetch(
        `/api/notifications/unread?email=${encodeURIComponent(userEmail)}&isAdmin=${isAdminUser}`
      );
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

  const handleLoginSuccess = (email: string, isAdminUser?: boolean) => {
    setIsAuthenticated(true);
    setIsAdmin(!!isAdminUser);

    localStorage.setItem("userEmail", email);
    localStorage.setItem("isLoggedIn", "true");

    if (isAdminUser) {
      localStorage.setItem("isAdmin", "true");
      setMode("admin-dashboard");
    } else {
      localStorage.removeItem("isAdmin");
      setMode("objects");
    }

    loadUnreadNotifications();
    window.dispatchEvent(new Event("auth-changed"));
  };

  const handleAdminLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("isAdmin");
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userToken");
    setIsAuthenticated(false);
    setIsAdmin(false);
    setMode("home");
    window.dispatchEvent(new Event("auth-changed"));
  };

  return (
    <main className="relative main-content">
      <div className="fixed inset-0 -z-20">
        <BackgroundSlideshow />
      </div>

      <AnimatePresence initial={false} mode="wait">
        {!isAuthenticated ? (
          <motion.div
            key="login"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
          >
            <LoginPanel
              isOpen
              onClose={() => {}}
              onLoginSuccess={handleLoginSuccess}
              showCloseButton={false}
              allowBackdropClose={false}
            />
          </motion.div>
        ) : mode === "admin-dashboard" && isAdmin ? (
          <motion.div
            key="admin-dashboard"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
          >
            <AdminDashboard
              userEmail={localStorage.getItem("userEmail") || "admin"}
              onLogout={handleAdminLogout}
            />
          </motion.div>
        ) : mode === "dashboard" ? (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
          >
            <DashboardGrid />
          </motion.div>
        ) : mode === "objects" ? (
          <motion.div
            key="objects"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
          >
            <UserObjectsGrid userEmail={localStorage.getItem("userEmail") || ""} />
          </motion.div>
        ) : mode === "object-detail" ? (
          <motion.div
            key="object-detail"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
          >
            <ObjectDetailView userEmail={localStorage.getItem("userEmail") || ""} />
          </motion.div>
        ) : mode === "admin-objects" && isAdmin ? (
          <motion.div
            key="admin-objects"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
          >
            <AdminObjectsManager adminToken={localStorage.getItem("adminToken") || ""} />
          </motion.div>
        ) : mode === "admin-object-detail" && isAdmin ? (
          <motion.div
            key="admin-object-detail"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
          >
            <AdminObjectDetailView adminToken={localStorage.getItem("adminToken") || ""} />
          </motion.div>
        ) : mode === "photo-viewer" ? (
          <motion.div
            key="photo-viewer"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
          >
            <CustomerPhotoViewer userEmail={localStorage.getItem("userEmail") || ""} />
          </motion.div>
        ) : (
          <motion.div
            key="fallback"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
          >
            <DashboardGrid />
          </motion.div>
        )}
      </AnimatePresence>

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
