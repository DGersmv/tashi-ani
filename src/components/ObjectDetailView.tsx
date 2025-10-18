"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useViewMode } from "./ui/ViewMode";
import SecurePDFViewer from "./SecurePDFViewer";

interface Project {
  id: number;
  title: string;
  description?: string;
  status: string;
  createdAt: string;
  _count: {
    photos: number;
    documents: number;
    messages: number;
  };
}

interface Photo {
  id: number;
  filename: string;
  originalName: string;
  uploadedAt: string;
}

interface Document {
  id: number;
  filename: string;
  originalName: string;
  documentType: string;
  uploadedAt: string;
}

interface Message {
  id: number;
  content: string;
  isAdminMessage: boolean;
  createdAt: string;
  user: {
    name?: string;
    email: string;
  };
}

interface ObjectDetail {
  id: number;
  title: string;
  description?: string;
  address?: string;
  status: string;
  createdAt: string;
  projects: Project[];
  photos: Photo[];
  documents: Document[];
  messages: Message[];
}

interface ObjectDetailViewProps {
  userEmail: string;
}

export default function ObjectDetailView({ userEmail }: ObjectDetailViewProps) {
  const { setMode } = useViewMode();
  const [object, setObject] = useState<ObjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'projects' | 'photos' | 'documents' | 'messages'>('projects');
  const [selectedPDF, setSelectedPDF] = useState<{ id: number; name: string } | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  const objectId = localStorage.getItem('selectedObjectId');

  const fetchObjectDetail = async () => {
    if (!objectId) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/user/objects/${objectId}?email=${encodeURIComponent(userEmail)}`);
      const data = await response.json();
      if (data.success) {
        setObject(data.object);
      } else {
        setError(data.message || "Не удалось загрузить объект");
      }
    } catch (err) {
      console.error('Ошибка загрузки объекта:', err);
      setError("Ошибка сети при загрузке объекта");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (objectId && userEmail) {
      fetchObjectDetail();
    }
  }, [objectId, userEmail]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !objectId) return;
    
    setSendingMessage(true);
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newMessage.trim(),
          objectId: parseInt(objectId),
          isAdminMessage: false
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setNewMessage('');
        // Обновляем список сообщений
        await fetchObjectDetail();
      } else {
        console.error('Ошибка отправки сообщения:', data.message);
      }
    } catch (err) {
      console.error('Ошибка отправки сообщения:', err);
    } finally {
      setSendingMessage(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
      case 'IN_PROGRESS':
        return 'rgba(59, 130, 246, 0.8)';
      case 'COMPLETED':
        return 'rgba(34, 197, 94, 0.8)';
      case 'PLANNING':
        return 'rgba(245, 158, 11, 0.8)';
      case 'ON_HOLD':
        return 'rgba(239, 68, 68, 0.8)';
      default:
        return 'rgba(59, 130, 246, 0.8)';
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", color: "white", padding: "40px" }}>
        <div style={{
          width: "40px",
          height: "40px",
          border: "3px solid rgba(255,255,255,0.3)",
          borderTop: "3px solid white",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
          margin: "0 auto 20px"
        }}></div>
        <p style={{ fontFamily: "Arial, sans-serif" }}>Загрузка объекта...</p>
      </div>
    );
  }

  if (error || !object) {
    return (
      <div style={{
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        borderRadius: "12px",
        padding: "24px",
        textAlign: "center",
        color: "white",
        backdropFilter: "blur(10px)"
      }}>
        <p style={{ fontFamily: "Arial, sans-serif" }}>❌ {error || "Объект не найден"}</p>
        <button
          onClick={() => setMode("objects")}
          style={{
            marginTop: "16px",
            padding: "8px 16px",
            borderRadius: "6px",
            border: "none",
            backgroundColor: "rgba(59, 130, 246, 0.8)",
            color: "white",
            fontFamily: "Arial, sans-serif",
            cursor: "pointer"
          }}
        >
          ← Назад к объектам
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", paddingTop: "20px" }}>
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
              marginRight: "16px",
              padding: "8px",
              borderRadius: "6px",
              transition: "all 0.3s ease"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            ←
          </button>
          <h2 style={{
            fontFamily: "ChinaCyr, sans-serif",
            fontSize: "2rem",
            margin: 0
          }}>
            {object.title}
          </h2>
        </div>
        {object.description && (
          <p style={{
            fontFamily: "Arial, sans-serif",
            fontSize: "1rem",
            color: "rgba(255,255,255,0.8)",
            margin: 0,
            marginLeft: "48px"
          }}>
            {object.description}
          </p>
        )}
        {object.address && (
          <p style={{
            fontFamily: "Arial, sans-serif",
            fontSize: "0.9rem",
            color: "rgba(255,255,255,0.6)",
            margin: 0,
            marginLeft: "48px",
            marginTop: "4px"
          }}>
            📍 {object.address}
          </p>
        )}
      </div>

      {/* Табы */}
      <div style={{
        display: "flex",
        gap: "8px",
        marginBottom: "24px",
        marginLeft: "48px"
      }}>
        {[
          { key: 'projects', label: 'Проекты', count: object.projects.length },
          { key: 'photos', label: 'Фото', count: object.photos.length },
          { key: 'documents', label: 'Документы', count: object.documents.length },
          { key: 'messages', label: 'Сообщения', count: object.messages.length }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              border: "none",
              backgroundColor: activeTab === tab.key ? "rgba(59, 130, 246, 0.8)" : "rgba(255, 255, 255, 0.1)",
              color: "white",
              fontFamily: "Arial, sans-serif",
              cursor: "pointer",
              transition: "all 0.3s ease"
            }}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Контент табов */}
      <div style={{ marginLeft: "48px" }}>
        {activeTab === 'projects' && (
          <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "24px"
          }}>
            {object.projects.map((project) => (
              <div
                key={project.id}
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.05)",
                  borderRadius: "12px",
                  padding: "20px",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255, 255, 255, 0.1)"
                }}
              >
                {/* Заголовок проекта */}
                <div style={{
                  marginBottom: "16px",
                  paddingBottom: "16px",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.1)"
                }}>
                  <h4 style={{
                    fontFamily: "ChinaCyr, sans-serif",
                    fontSize: "1.3rem",
                    color: "white",
                    margin: "0 0 8px 0"
                  }}>
                    {project.title}
                  </h4>
                  {project.description && (
                    <p style={{
                      fontFamily: "Arial, sans-serif",
                      fontSize: "0.9rem",
                      color: "rgba(255,255,255,0.7)",
                      margin: "0 0 12px 0"
                    }}>
                      {project.description}
                    </p>
                  )}
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}>
                    <div style={{
                      backgroundColor: getStatusColor(project.status),
                      color: "white",
                      padding: "4px 12px",
                      borderRadius: "4px",
                      fontSize: "0.8rem",
                      fontFamily: "Arial, sans-serif",
                      fontWeight: "600"
                    }}>
                      {project.status === 'PLANNING' ? 'Планирование' :
                       project.status === 'IN_PROGRESS' ? 'В работе' :
                       project.status === 'COMPLETED' ? 'Завершен' : project.status}
                    </div>
                    <div style={{
                      fontSize: "0.8rem",
                      color: "rgba(255,255,255,0.6)",
                      fontFamily: "Arial, sans-serif"
                    }}>
                      {formatDate(project.createdAt)}
                    </div>
                  </div>
                </div>

                {/* Документы проекта */}
                {project.documents && project.documents.length > 0 && (
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                    gap: "12px"
                  }}>
                    {project.documents.map((document: any) => (
                      <div
                        key={document.id}
                        style={{
                          backgroundColor: "rgba(255, 255, 255, 0.08)",
                          borderRadius: "8px",
                          padding: "12px",
                          border: "1px solid rgba(255, 255, 255, 0.1)"
                        }}
                      >
                        <div style={{
                          fontFamily: "Arial, sans-serif",
                          fontSize: "0.9rem",
                          color: "white",
                          marginBottom: "8px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap"
                        }}>
                          {document.originalName}
                        </div>
                        <div style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "8px"
                        }}>
                          <span style={{
                            fontSize: "0.75rem",
                            color: "rgba(255,255,255,0.6)",
                            fontFamily: "Arial, sans-serif"
                          }}>
                            {(document.fileSize / 1024).toFixed(1)} KB
                          </span>
                          <span style={{
                            padding: "2px 6px",
                            borderRadius: "3px",
                            fontSize: "0.7rem",
                            fontFamily: "Arial, sans-serif",
                            backgroundColor: document.isPaid ? "rgba(34, 197, 94, 0.2)" : "rgba(239, 68, 68, 0.2)",
                            color: document.isPaid ? "#22c55e" : "#ef4444",
                            border: `1px solid ${document.isPaid ? "#22c55e" : "#ef4444"}`
                          }}>
                            {document.isPaid ? "Оплачен" : "Не оплачен"}
                          </span>
                        </div>
                        {document.mimeType === 'application/pdf' && (
                          <button
                            onClick={() => {
                              // Открываем PDF в модальном окне с водяным знаком для неоплаченных
                              setSelectedPDF({
                                id: document.id,
                                name: document.originalName
                              });
                            }}
                            style={{
                              width: "100%",
                              padding: "6px",
                              backgroundColor: "rgba(59, 130, 246, 0.8)",
                              border: "none",
                              borderRadius: "4px",
                              color: "white",
                              cursor: "pointer",
                              fontSize: "0.8rem",
                              fontFamily: "Arial, sans-serif"
                            }}
                          >
                            Просмотр
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Сообщение если нет документов */}
                {(!project.documents || project.documents.length === 0) && (
                  <div style={{
                    textAlign: "center",
                    padding: "20px",
                    color: "rgba(255,255,255,0.5)",
                    fontFamily: "Arial, sans-serif",
                    fontSize: "0.9rem"
                  }}>
                    Документы не загружены
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'photos' && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: "16px"
          }}>
            {object.photos.map((photo) => (
              <div
                key={photo.id}
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  borderRadius: "12px",
                  padding: "16px",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  textAlign: "center"
                }}
              >
                <div style={{
                  fontSize: "2rem",
                  marginBottom: "8px"
                }}>
                  📷
                </div>
                <p style={{
                  fontFamily: "Arial, sans-serif",
                  fontSize: "0.85rem",
                  color: "white",
                  margin: "0 0 4px 0"
                }}>
                  {photo.originalName}
                </p>
                <p style={{
                  fontFamily: "Arial, sans-serif",
                  fontSize: "0.75rem",
                  color: "rgba(255,255,255,0.6)",
                  margin: 0
                }}>
                  {formatDate(photo.uploadedAt)}
                </p>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'documents' && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
            gap: "16px"
          }}>
            {object.documents.map((doc) => (
              <div
                key={doc.id}
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  borderRadius: "12px",
                  padding: "16px",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255, 255, 255, 0.1)"
                }}
              >
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: "8px"
                }}>
                  <div style={{
                    fontSize: "1.5rem",
                    marginRight: "12px"
                  }}>
                    📄
                  </div>
                  <div>
                    <p style={{
                      fontFamily: "Arial, sans-serif",
                      fontSize: "0.9rem",
                      color: "white",
                      margin: 0
                    }}>
                      {doc.originalName}
                    </p>
                    <p style={{
                      fontFamily: "Arial, sans-serif",
                      fontSize: "0.75rem",
                      color: "rgba(255,255,255,0.6)",
                      margin: 0
                    }}>
                      {doc.documentType}
                    </p>
                  </div>
                </div>
                <p style={{
                  fontFamily: "Arial, sans-serif",
                  fontSize: "0.75rem",
                  color: "rgba(255,255,255,0.5)",
                  margin: "0 0 12px 0"
                }}>
                  {formatDate(doc.uploadedAt)}
                </p>
                {doc.mimeType === 'application/pdf' && (
                  <button
                    onClick={() => {
                      // Открываем PDF в модальном окне - документы всегда считаются оплаченными
                      setSelectedPDF({
                        id: doc.id,
                        name: doc.originalName
                      });
                    }}
                    style={{
                      width: "100%",
                      padding: "8px",
                      backgroundColor: "rgba(59, 130, 246, 0.8)",
                      border: "none",
                      borderRadius: "6px",
                      color: "white",
                      cursor: "pointer",
                      fontSize: "0.85rem",
                      fontFamily: "Arial, sans-serif"
                    }}
                  >
                    Просмотр
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'messages' && (
          <div>
            {/* Панель отправки сообщения */}
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
                Сообщения
              </h3>
              <div style={{
                display: "flex",
                gap: "12px",
                alignItems: "flex-end"
              }}>
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Введите сообщение..."
                  style={{
                    flex: 1,
                    minHeight: "80px",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid rgba(255, 255, 255, 0.3)",
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    color: "white",
                    fontFamily: "Arial, sans-serif",
                    fontSize: "0.9rem",
                    resize: "vertical"
                  }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sendingMessage}
                  style={{
                    backgroundColor: (!newMessage.trim() || sendingMessage) ? "rgba(107, 114, 128, 0.5)" : "rgba(34, 197, 94, 0.8)",
                    border: "none",
                    color: "white",
                    padding: "12px 24px",
                    borderRadius: "8px",
                    fontSize: "1rem",
                    fontFamily: "Arial, sans-serif",
                    cursor: (!newMessage.trim() || sendingMessage) ? "not-allowed" : "pointer",
                    transition: "all 0.3s ease",
                    opacity: (!newMessage.trim() || sendingMessage) ? 0.6 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (newMessage.trim() && !sendingMessage) {
                      e.currentTarget.style.backgroundColor = "rgba(34, 197, 94, 1)";
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (newMessage.trim() && !sendingMessage) {
                      e.currentTarget.style.backgroundColor = "rgba(34, 197, 94, 0.8)";
                      e.currentTarget.style.transform = "translateY(0)";
                    }
                  }}
                >
                  {sendingMessage ? "Отправка..." : "Отправить"}
                </button>
              </div>
            </div>

            {/* Список сообщений */}
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: "12px"
            }}>
              {object.messages.map((message) => (
              <div
                key={message.id}
                style={{
                  backgroundColor: message.isAdminMessage ? "rgba(59, 130, 246, 0.1)" : "rgba(255, 255, 255, 0.1)",
                  borderRadius: "12px",
                  padding: "16px",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255, 255, 255, 0.1)"
                }}
              >
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "8px"
                }}>
                  <p style={{
                    fontFamily: "Arial, sans-serif",
                    fontSize: "0.85rem",
                    color: message.isAdminMessage ? "rgba(59, 130, 246, 1)" : "rgba(34, 197, 94, 1)",
                    margin: 0,
                    fontWeight: "600"
                  }}>
                    {message.isAdminMessage ? "Команда" : (message.user.name || message.user.email)}
                  </p>
                  <p style={{
                    fontFamily: "Arial, sans-serif",
                    fontSize: "0.75rem",
                    color: "rgba(255,255,255,0.6)",
                    margin: 0
                  }}>
                    {formatDate(message.createdAt)}
                  </p>
                </div>
                <p style={{
                  fontFamily: "Arial, sans-serif",
                  fontSize: "0.9rem",
                  color: "white",
                  margin: 0
                }}>
                  {message.content}
                </p>
              </div>
            ))}
            </div>
          </div>
        )}

        {/* Сообщение если нет данных */}
        {(activeTab === 'projects' && object.projects.length === 0) ||
         (activeTab === 'photos' && object.photos.length === 0) ||
         (activeTab === 'documents' && object.documents.length === 0) ||
         (activeTab === 'messages' && object.messages.length === 0) ? (
          <div style={{
            textAlign: "center",
            color: "rgba(255,255,255,0.6)",
            padding: "40px",
            fontFamily: "Arial, sans-serif"
          }}>
            <p>Пока нет данных в этой категории</p>
          </div>
        ) : null}
      </div>

      {/* PDF Viewer */}
      {selectedPDF && (
        <SecurePDFViewer
          documentId={selectedPDF.id}
          fileName={selectedPDF.name}
          onClose={() => setSelectedPDF(null)}
          source={activeTab === 'projects' ? "projects" : "documents"}
          isAdmin={false} // Заказчик - не админ, поэтому будут водяные знаки для неоплаченных
        />
      )}
    </div>
  );
}
