"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import GlassServicePanel from "./GlassServicePanel";

interface ServicePanel {
  id: string;
  name: string;
  order: number;
  folderPath: string;
  imageCount: number;
  images: string[];
  hasPreview: boolean;
}

export default function ServicesGrid() {
  const [panels, setPanels] = useState<ServicePanel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPanels = async () => {
      try {
        const response = await fetch('/api/services/panels', { 
          cache: 'no-store' 
        });
        const data = await response.json();
        setPanels(data.panels || []);
      } catch (error) {
        console.error('Ошибка загрузки панелей услуг:', error);
        setPanels([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPanels();
  }, []);


  if (loading) {
    return (
      <div className="w-full flex justify-center items-center py-20">
        <motion.div
          className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );
  }

  if (panels.length === 0) {
    return (
      <div className="w-full text-center py-20">
        <p className="text-white/60 text-lg">
          Нет доступных услуг
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4">
      {/* Заголовок секции */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <h2 
          className="text-3xl md:text-4xl font-bold text-white mb-4"
          style={{ fontFamily: "'ChinaCyr', Arial, sans-serif" }}
        >
          Наши услуги
        </h2>
        <p className="text-white/80 text-lg max-w-2xl mx-auto">
          Выберите подходящий пакет услуг для вашего проекта
        </p>
      </motion.div>

      {/* Сетка панелей - вертикальные колонки */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6"
      >
        {panels.map((panel, index) => (
          <motion.div
            key={panel.id}
            className="w-full"
            layout
            style={{
              width: '100%',
              height: '280px', // Еще меньше для 4 колонок
              maxWidth: '100%'
            }}
          >
            <GlassServicePanel 
              service={panel} 
              index={index}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Дополнительная информация */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="text-center mt-12"
      >
        <p className="text-white/60 text-sm">
          Нажмите на панель для просмотра детальной информации
        </p>
      </motion.div>
    </div>
  );
}
