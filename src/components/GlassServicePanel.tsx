"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface ServicePanelProps {
  service: {
    id: string;
    name: string;
    order: number;
    folderPath: string;
    imageCount: number;
    images: string[];
    hasPreview: boolean;
  };
  index: number;
}

export default function GlassServicePanel({ service, index }: ServicePanelProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Предзагрузка изображения для лучшего качества
  useEffect(() => {
    if (service.hasPreview) {
      const img = new Image();
      img.onload = () => setImageLoaded(true);
      img.onerror = () => console.log('Ошибка предзагрузки:', `${service.folderPath}/1.png`);
      img.src = `${service.folderPath}/1.png`;
    }
  }, [service.hasPreview, service.folderPath]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.6, 
        delay: index * 0.1,
        ease: [0.44, 0.13, 0.35, 1.08]
      }}
      whileHover={{ 
        y: -8, 
        scale: 1.02,
        transition: { type: "spring", stiffness: 300, damping: 20 }
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="group cursor-pointer w-full h-full"
    >
      <div
        className="relative w-full h-full rounded-2xl overflow-hidden"
        style={{
          background: "rgba(255, 255, 255, 0.12)",
          backdropFilter: "blur(24px)",
          border: "2px solid rgba(211, 163, 115, 0.4)",
          boxShadow: isHovered 
            ? "0 20px 40px rgba(0, 0, 0, 0.3), 0 0 20px rgba(211, 163, 115, 0.2)"
            : "0 8px 24px rgba(0, 0, 0, 0.15), inset 0 0 0 1px rgba(255, 255, 255, 0.1)",
          transition: "all 0.3s ease"
        }}
      >
        {/* Фоновое изображение 1.png */}
        {service.hasPreview && (
          <div className="absolute inset-0 overflow-hidden">
            {imageLoaded ? (
              <img
                src={`${service.folderPath}/1.png`}
                alt={`Превью ${service.name}`}
                className="w-full h-full object-cover opacity-30"
                style={{
                  filter: "saturate(0.9) brightness(0.8)",
                  transform: isHovered ? "scale(1.05)" : "scale(1)",
                  transition: "transform 0.6s ease"
                }}
                loading="eager"
                onError={(e) => {
                  console.log('Ошибка загрузки изображения:', e.currentTarget.src);
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-full h-full bg-gray-800/20 animate-pulse" />
            )}
          </div>
        )}

        {/* Градиентная вуаль */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(135deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.4) 100%)"
          }}
        />

        {/* Контент панели */}
        <div className="relative z-10 p-4 h-full flex flex-col justify-between">
          {/* Заголовок услуги */}
          <div className="flex-1 flex flex-col justify-center">
            <motion.h3
              className="text-white font-bold text-lg leading-tight mb-2 text-center"
              style={{
                fontFamily: "'ChinaCyr', Arial, sans-serif",
                textShadow: "0 2px 4px rgba(0,0,0,0.5)"
              }}
              animate={{ 
                y: isHovered ? -2 : 0,
                transition: { duration: 0.2 }
              }}
            >
              {service.name}
            </motion.h3>
            
            {/* Счетчик изображений */}
            <motion.div
              className="text-white/80 text-xs text-center mb-2"
              animate={{ 
                opacity: isHovered ? 1 : 0.8,
                transition: { duration: 0.2 }
              }}
            >
              {service.imageCount} {service.imageCount === 1 ? 'файл' : 'файлов'}
            </motion.div>
          </div>

          {/* Индикатор клика */}
          <motion.div
            className="text-white/60 text-xs flex items-center justify-center gap-1"
            animate={{ 
              x: isHovered ? 4 : 0,
              opacity: isHovered ? 1 : 0.6,
              transition: { duration: 0.2 }
            }}
          >
            <span>Нажмите</span>
            <motion.span
              animate={{ x: isHovered ? 4 : 0 }}
              transition={{ duration: 0.2 }}
            >
              →
            </motion.span>
          </motion.div>
        </div>

        {/* Светящаяся рамка при hover */}
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            background: "linear-gradient(45deg, transparent, rgba(211, 163, 115, 0.1), transparent)",
            opacity: isHovered ? 1 : 0,
            transition: "opacity 0.3s ease"
          }}
        />
      </div>
    </motion.div>
  );
}
