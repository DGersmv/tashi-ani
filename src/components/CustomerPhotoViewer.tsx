"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useViewMode } from "./ui/ViewMode";

interface Photo {
  id: number;
  filename: string;
  originalName: string;
  filePath: string;
  mimeType: string;
  isVisibleToCustomer: boolean;
  uploadedAt: string;
  comments: PhotoComment[];
}

interface PhotoComment {
  id: number;
  content: string;
  isAdminComment: boolean;
  createdAt: string;
  user: {
    name: string;
    email: string;
  };
}

interface CustomerPhotoViewerProps {
  userEmail: string;
}

export default function CustomerPhotoViewer({ userEmail }: CustomerPhotoViewerProps) {
  const { setMode } = useViewMode();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    const fetchPhotos = async () => {
      if (!userEmail) {
        setError("Email пользователя не найден.");
        setLoading(false);
        return;
      }

      try {
        const objectId = localStorage.getItem('selectedObjectId');
        if (!objectId) {
          setError("Объект не выбран.");
          setLoading(false);
          return;
        }

        const response = await fetch(`/api/user/objects/${objectId}/photos?email=${encodeURIComponent(userEmail)}`);
        if (!response.ok) {
          throw new Error(`Ошибка HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.success) {
          setPhotos(data.photos);
        } else {
          setError(data.message || "Не удалось загрузить фото.");
        }
      } catch (err: any) {
        setError(err.message || "Произошла ошибка при загрузке фото.");
      } finally {
        setLoading(false);
      }
    };

    fetchPhotos();
  }, [userEmail]);

  const handleCommentSubmit = async (photoId: number) => {
    if (!newComment.trim()) return;

    setSubmittingComment(true);
    try {
      const response = await fetch('/api/photo-comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          photoId,
          content: newComment.trim(),
          userEmail
        }),
      });

      if (response.ok) {
        // Обновляем фото с новым комментарием
        const updatedPhotos = photos.map(photo => {
          if (photo.id === photoId) {
            return {
              ...photo,
              comments: [...photo.comments, {
                id: Date.now(), // Временный ID
                content: newComment.trim(),
                isAdminComment: false,
                createdAt: new Date().toISOString(),
                user: {
                  name: "Вы",
                  email: userEmail
                }
              }]
            };
          }
          return photo;
        });
        setPhotos(updatedPhotos);
        setNewComment("");
      }
    } catch (error) {
      console.error('Ошибка при отправке комментария:', error);
    } finally {
      setSubmittingComment(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div style={{ 
        maxWidth: "1200px", 
        margin: "0 auto",
        paddingTop: "120px",
        textAlign: "center",
        color: "white"
      }}>
        <div style={{
          width: "40px",
          height: "40px",
          border: "3px solid rgba(255,255,255,0.3)",
          borderBottomColor: "white",
          borderRadius: "50%",
          display: "inline-block",
          animation: "spin 1s linear infinite"
        }}></div>
        <p style={{ marginTop: "16px", fontFamily: "Arial, sans-serif" }}>Загрузка фото...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        maxWidth: "1200px", 
        margin: "0 auto",
        paddingTop: "120px",
        textAlign: "center",
        color: "white"
      }}>
        <p style={{ fontFamily: "Arial, sans-serif" }}>❌ {error}</p>
        <button
          onClick={() => setMode("objects")}
          style={{
            backgroundColor: "rgba(34, 197, 94, 0.8)",
            border: "none",
            color: "white",
            padding: "12px 24px",
            borderRadius: "8px",
            fontSize: "1rem",
            fontFamily: "Arial, sans-serif",
            cursor: "pointer",
            marginTop: "16px",
            transition: "all 0.3s ease"
          }}
        >
          ← Вернуться к объектам
        </button>
      </div>
    );
  }

  return (
    <div style={{ 
      maxWidth: "1200px", 
      margin: "0 auto",
      paddingTop: "120px"
    }}>
      {/* Заголовок */}
      <div style={{
        marginBottom: "32px",
        color: "white"
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          marginBottom: "16px"
        }}>
          <button
            onClick={() => setMode("objects")}
            style={{
              background: "none",
              border: "none",
              color: "rgba(255,255,255,0.8)",
              fontSize: "1.5rem",
              cursor: "pointer",
              marginRight: "10px",
              transition: "color 0.3s ease",
              fontFamily: "Arial, sans-serif"
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = "white"}
            onMouseLeave={(e) => e.currentTarget.style.color = "rgba(255,255,255,0.8)"}
          >
            ←
          </button>
          <h1 style={{
            fontSize: "2.5rem",
            fontWeight: 800,
            fontFamily: "ChinaCyr, sans-serif"
          }}>
            Фото объекта
          </h1>
        </div>
        <p style={{
          fontSize: "1.1rem",
          color: "rgba(255,255,255,0.8)",
          fontFamily: "Arial, sans-serif"
        }}>
          Просматривайте и комментируйте фото вашего объекта.
        </p>
      </div>

      {photos.length === 0 ? (
        <div style={{
          backgroundColor: "rgba(255,255,255,0.1)",
          borderRadius: "12px",
          padding: "24px",
          textAlign: "center",
          color: "white",
          fontFamily: "Arial, sans-serif"
        }}>
          <p>Фото для этого объекта пока не загружены.</p>
        </div>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "24px"
        }}>
          {photos.map((photo) => (
            <motion.div
              key={photo.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              style={{
                background: "rgba(255,255,255,0.1)",
                backdropFilter: "blur(10px)",
                borderRadius: "12px",
                border: "1px solid rgba(255,255,255,0.2)",
                padding: "16px",
                color: "white",
                cursor: "pointer",
                transition: "all 0.3s ease"
              }}
              whileHover={{ scale: 1.02, boxShadow: "0 8px 16px rgba(0,0,0,0.2)" }}
              onClick={() => setSelectedPhoto(photo)}
            >
              <div style={{
                width: "100%",
                height: "200px",
                borderRadius: "8px",
                overflow: "hidden",
                marginBottom: "12px",
                backgroundColor: "rgba(255,255,255,0.1)"
              }}>
                <img
                  src={`/api/uploads/objects/${photo.objectId}/${photo.filename}?email=${encodeURIComponent(userEmail)}`}
                  alt={photo.originalName}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover"
                  }}
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                    e.currentTarget.nextElementSibling.style.display = "flex";
                  }}
                />
                <div style={{
                  display: "none",
                  width: "100%",
                  height: "100%",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.7)",
                  fontFamily: "Arial, sans-serif"
                }}>
                  📷 Фото
                </div>
              </div>
              
              <h3 style={{
                fontSize: "1.1rem",
                fontWeight: 600,
                marginBottom: "8px",
                fontFamily: "Arial, sans-serif"
              }}>
                {photo.originalName}
              </h3>
              { (photo as any).folder && (
                <div style={{
                  fontSize: "0.85rem",
                  color: "#d3a373",
                  fontFamily: "Arial, sans-serif",
                  marginBottom: "8px"
                }}>
                  📁 {(photo as any).folder.name}
                </div>
              )}
              
              <div style={{
                fontSize: "0.85rem",
                color: "rgba(255,255,255,0.7)",
                fontFamily: "Arial, sans-serif",
                marginBottom: "8px"
              }}>
                Загружено: {formatDate(photo.uploadedAt)}
              </div>
              
              <div style={{
                fontSize: "0.85rem",
                color: "rgba(255,255,255,0.7)",
                fontFamily: "Arial, sans-serif"
              }}>
                Комментариев: {photo.comments.length}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Модальное окно для просмотра фото */}
      {selectedPhoto && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.9)",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px"
        }}>
          <div style={{
            maxWidth: "90vw",
            maxHeight: "90vh",
            backgroundColor: "rgba(255,255,255,0.1)",
            borderRadius: "12px",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "20px"
          }}>
            {/* Кнопка закрытия */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <h2 style={{
                color: "white",
                fontSize: "1.5rem",
                fontFamily: "Arial, sans-serif",
                margin: 0
              }}>
                {selectedPhoto.originalName}
              </h2>
              <div style={{
                display: "flex",
                gap: "10px",
                alignItems: "center"
              }}>
                <button
                  onClick={() => {
                    window.open(`/api/uploads/objects/${selectedPhoto.objectId}/${selectedPhoto.filename}?email=${encodeURIComponent(userEmail)}`, '_blank');
                  }}
                  style={{
                    backgroundColor: "rgba(34, 197, 94, 0.8)",
                    border: "none",
                    color: "white",
                    padding: "8px 16px",
                    borderRadius: "6px",
                    fontSize: "0.9rem",
                    fontFamily: "Arial, sans-serif",
                    cursor: "pointer",
                    transition: "all 0.3s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(34, 197, 94, 1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "rgba(34, 197, 94, 0.8)";
                  }}
                >
                  🔍 Полный экран
                </button>
                <button
                  onClick={() => setSelectedPhoto(null)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "white",
                    fontSize: "2rem",
                    cursor: "pointer",
                    padding: "0",
                    width: "40px",
                    height: "40px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  ×
                </button>
              </div>
            </div>

            {/* Фото */}
            <div style={{
              maxWidth: "80vw",
              maxHeight: "60vh",
              display: "flex",
              justifyContent: "center"
            }}>
              <img
                src={`/api/uploads/objects/${selectedPhoto.objectId}/${selectedPhoto.filename}?email=${encodeURIComponent(userEmail)}`}
                alt={selectedPhoto.originalName}
                style={{
                  maxWidth: "100%",
                  maxHeight: "100%",
                  objectFit: "contain",
                  borderRadius: "8px",
                  cursor: "pointer"
                }}
                onClick={() => {
                  // Открыть фото в новом окне для полноэкранного просмотра
                  window.open(`/api/uploads/objects/${selectedPhoto.objectId}/${selectedPhoto.filename}?email=${encodeURIComponent(userEmail)}`, '_blank');
                }}
              />
            </div>

            {/* Комментарии */}
            <div style={{
              maxHeight: "200px",
              overflowY: "auto",
              borderTop: "1px solid rgba(255,255,255,0.2)",
              paddingTop: "16px"
            }}>
              <h3 style={{
                color: "white",
                fontSize: "1.1rem",
                fontFamily: "Arial, sans-serif",
                marginBottom: "12px"
              }}>
                Комментарии ({selectedPhoto.comments.length})
              </h3>
              
              {selectedPhoto.comments.map((comment) => (
                <div key={comment.id} style={{
                  backgroundColor: "rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                  padding: "12px",
                  marginBottom: "8px"
                }}>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "4px"
                  }}>
                    <span style={{
                      color: comment.isAdminComment ? "rgba(34, 197, 94, 1)" : "rgba(59, 130, 246, 1)",
                      fontSize: "0.9rem",
                      fontWeight: 600,
                      fontFamily: "Arial, sans-serif"
                    }}>
                      {comment.isAdminComment ? "👨‍💼 Администратор" : "👤 " + comment.user.name}
                    </span>
                    <span style={{
                      color: "rgba(255,255,255,0.6)",
                      fontSize: "0.8rem",
                      fontFamily: "Arial, sans-serif"
                    }}>
                      {formatDate(comment.createdAt)}
                    </span>
                  </div>
                  <p style={{
                    color: "white",
                    fontSize: "0.9rem",
                    fontFamily: "Arial, sans-serif",
                    margin: 0
                  }}>
                    {comment.content}
                  </p>
                </div>
              ))}

              {/* Форма добавления комментария */}
              <div style={{
                marginTop: "16px",
                paddingTop: "16px",
                borderTop: "1px solid rgba(255,255,255,0.2)"
              }}>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Добавить комментарий..."
                  style={{
                    width: "100%",
                    minHeight: "60px",
                    backgroundColor: "rgba(255,255,255,0.1)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    borderRadius: "6px",
                    padding: "8px",
                    color: "white",
                    fontSize: "0.9rem",
                    fontFamily: "Arial, sans-serif",
                    resize: "vertical"
                  }}
                />
                <button
                  onClick={() => handleCommentSubmit(selectedPhoto.id)}
                  disabled={!newComment.trim() || submittingComment}
                  style={{
                    backgroundColor: newComment.trim() && !submittingComment ? "rgba(34, 197, 94, 0.8)" : "rgba(255,255,255,0.2)",
                    border: "none",
                    color: "white",
                    padding: "8px 16px",
                    borderRadius: "6px",
                    fontSize: "0.9rem",
                    fontFamily: "Arial, sans-serif",
                    cursor: newComment.trim() && !submittingComment ? "pointer" : "not-allowed",
                    marginTop: "8px",
                    transition: "all 0.3s ease"
                  }}
                >
                  {submittingComment ? "Отправка..." : "Отправить"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}