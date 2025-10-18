"use client";

import React, { useState, useRef } from "react";
import { motion } from "framer-motion";

interface Photo {
  id: number;
  filename: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  isVisibleToCustomer: boolean;
  uploadedAt: string;
  url?: string;
}

interface CustomerPhotosPanelProps {
  objectId: number;
  adminToken: string;
  onPhotosUpdate: () => void;
}

export default function CustomerPhotosPanel({ objectId, adminToken, onPhotosUpdate }: CustomerPhotosPanelProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('isVisibleToCustomer', 'true'); // Все загружаемые файлы сразу доступны заказчику

        const response = await fetch(`/api/admin/objects/${objectId}/photos`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
          body: formData,
        });

        const data = await response.json();
        if (!data.success) {
          throw new Error(data.message || 'Ошибка загрузки файла');
        }

        setUploadProgress(((i + 1) / files.length) * 100);
      }

      // Обновляем список фото
      onPhotosUpdate();
    } catch (error) {
      console.error('Ошибка загрузки файлов:', error);
      alert('Ошибка загрузки файлов: ' + (error as Error).message);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return 'IMG';
    } else if (mimeType.startsWith('video/')) {
      return '🎥';
    }
    return 'FILE';
  };

  return (
    <div style={{
      backgroundColor: "rgba(255, 255, 255, 0.1)",
      borderRadius: "16px",
      padding: "24px",
      backdropFilter: "blur(10px)",
      border: "1px solid rgba(255, 255, 255, 0.1)",
      marginBottom: "24px"
    }}>
      <h3 style={{
        fontFamily: "ChinaCyr, sans-serif",
        fontSize: "1.5rem",
        color: "white",
        margin: "0 0 20px 0",
        display: "flex",
        alignItems: "center",
        gap: "12px"
      }}>
        Фото для заказчика
      </h3>

      {/* Зона загрузки */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        style={{
          border: dragActive 
            ? "2px dashed rgba(34, 197, 94, 0.8)" 
            : "2px dashed rgba(255, 255, 255, 0.3)",
          borderRadius: "12px",
          padding: "40px 20px",
          textAlign: "center",
          backgroundColor: dragActive 
            ? "rgba(34, 197, 94, 0.1)" 
            : "rgba(255, 255, 255, 0.05)",
          transition: "all 0.3s ease",
          cursor: "pointer",
          marginBottom: "20px"
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <div style={{
          fontSize: "3rem",
          marginBottom: "16px",
          color: dragActive ? "rgba(34, 197, 94, 1)" : "rgba(255, 255, 255, 0.6)"
        }}>
          {dragActive ? "Отпустить" : "Загрузить"}
        </div>
        <p style={{
          fontFamily: "Arial, sans-serif",
          fontSize: "1.1rem",
          color: "white",
          margin: "0 0 8px 0"
        }}>
          {dragActive ? "Отпустите файлы для загрузки" : "Перетащите файлы сюда или нажмите для выбора"}
        </p>
        <p style={{
          fontFamily: "Arial, sans-serif",
          fontSize: "0.9rem",
          color: "rgba(255, 255, 255, 0.6)",
          margin: 0
        }}>
          Поддерживаются: JPG, PNG, GIF, WebP, MP4, AVI, MOV (до 50MB) • Можно выбрать несколько файлов
        </p>

        {/* Прогресс загрузки */}
        {isUploading && (
          <div style={{
            marginTop: "20px",
            width: "100%",
            maxWidth: "300px",
            margin: "20px auto 0"
          }}>
            <div style={{
              backgroundColor: "rgba(255, 255, 255, 0.2)",
              borderRadius: "8px",
              height: "8px",
              overflow: "hidden"
            }}>
              <div style={{
                backgroundColor: "rgba(34, 197, 94, 1)",
                height: "100%",
                width: `${uploadProgress}%`,
                transition: "width 0.3s ease"
              }}></div>
            </div>
            <p style={{
              fontFamily: "Arial, sans-serif",
              fontSize: "0.9rem",
              color: "rgba(255, 255, 255, 0.8)",
              margin: "8px 0 0 0"
            }}>
              Загрузка: {Math.round(uploadProgress)}%
            </p>
          </div>
        )}
      </div>

      {/* Скрытый input для выбора файлов */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*"
        style={{ display: "none" }}
        onChange={(e) => handleFileUpload(e.target.files)}
      />

      {/* Информация о панели */}
      <div style={{
        backgroundColor: "rgba(34, 197, 94, 0.1)",
        borderRadius: "8px",
        padding: "16px",
        border: "1px solid rgba(34, 197, 94, 0.3)"
      }}>
        <p style={{
          fontFamily: "Arial, sans-serif",
          fontSize: "0.9rem",
          color: "white",
          margin: "0 0 8px 0",
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          Все файлы в этой панели автоматически доступны заказчику
        </p>
        <p style={{
          fontFamily: "Arial, sans-serif",
          fontSize: "0.85rem",
          color: "rgba(255, 255, 255, 0.7)",
          margin: 0
        }}>
          Заказчик может просматривать только те фото и видео, которые находятся в этой панели
        </p>
      </div>
    </div>
  );
}
