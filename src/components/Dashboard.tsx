"use client";

import React from "react";
import { motion } from "framer-motion";

interface DashboardProps {
  userEmail: string;
  onLogout: () => void;
}

export default function Dashboard({ userEmail, onLogout }: DashboardProps) {
  const panels = [
    {
      id: "project",
      title: "Проект",
      icon: "📋",
      description: "Управление проектами"
    },
    {
      id: "photos",
      title: "Фото",
      icon: "📸",
      description: "Галерея фотографий"
    },
    {
      id: "3d-tour",
      title: "3D Тур",
      icon: "🌐",
      description: "Интерактивные туры"
    },
    {
      id: "approvals",
      title: "Согласования",
      icon: "✅",
      description: "Статус согласований"
    }
  ];

  return (
    <div className="min-h-screen relative">
      {/* Фон */}
      <div className="fixed inset-0 -z-20">
        <div 
          className="w-full h-full"
          style={{
            background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
            backgroundAttachment: "fixed"
          }}
        />
      </div>

      {/* Контент */}
      <div className="relative z-10 pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Приветствие */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h1 
              className="text-4xl md:text-5xl font-bold text-white mb-4"
              style={{ fontFamily: "ChinaCyr, sans-serif" }}
            >
              Добро пожаловать!
            </h1>
            <p className="text-xl text-gray-300 mb-2">
              Личный кабинет
            </p>
            <p className="text-lg text-gray-400">
              {userEmail}
            </p>
          </motion.div>

          {/* Панели */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {panels.map((panel, index) => (
              <motion.div
                key={panel.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.6, 
                  delay: index * 0.1 
                }}
                className="group cursor-pointer"
              >
                <div
                  className="
                    relative
                    w-full
                    aspect-square
                    rounded-2xl
                    overflow-hidden
                    transition-all
                    duration-300
                    group-hover:scale-105
                    group-hover:shadow-2xl
                  "
                  style={{
                    background: "rgba(255,255,255,0.1)",
                    backdropFilter: "blur(20px)",
                    border: "2px solid rgba(211, 163, 115, 0.3)",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.3)"
                  }}
                >
                  {/* Градиентный оверлей */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background: "linear-gradient(135deg, rgba(211, 163, 115, 0.2), rgba(211, 163, 115, 0.1))"
                    }}
                  />

                  {/* Контент панели */}
                  <div className="relative z-10 h-full flex flex-col items-center justify-center p-6 text-center">
                    {/* Иконка */}
                    <div 
                      className="text-6xl mb-4 transition-transform duration-300 group-hover:scale-110"
                    >
                      {panel.icon}
                    </div>

                    {/* Заголовок */}
                    <h3 
                      className="text-xl font-bold text-white mb-2"
                      style={{ fontFamily: "ChinaCyr, sans-serif" }}
                    >
                      {panel.title}
                    </h3>

                    {/* Описание */}
                    <p className="text-sm text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      {panel.description}
                    </p>
                  </div>

                  {/* Свечение при hover */}
                  <div
                    className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      boxShadow: "inset 0 0 20px rgba(211, 163, 115, 0.3)"
                    }}
                  />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Кнопка выхода */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="text-center"
          >
            <button
              onClick={onLogout}
              className="
                px-8 py-3
                bg-transparent
                border-2
                border-red-400
                text-red-400
                rounded-xl
                font-semibold
                transition-all
                duration-300
                hover:bg-red-400
                hover:text-white
                hover:shadow-lg
              "
              style={{ fontFamily: "ChinaCyr, sans-serif" }}
            >
              Выйти
            </button>
          </motion.div>

        </div>
      </div>
    </div>
  );
}

