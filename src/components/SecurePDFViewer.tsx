"use client";

import React, { useState, useEffect } from 'react';
import PdfJsProjectViewer from './PdfJsProjectViewer';


interface SecurePDFViewerProps {
  documentId: number;
  fileName: string;
  onClose: () => void;
  source?: 'documents' | 'projects'; // Источник документа
  isAdmin?: boolean; // Флаг админа - для админа нет ограничений по оплате
  userEmail?: string; // Email пользователя для заказчиков
  adminToken?: string; // Токен админа
}

interface DocumentStatus {
  id: number;
  isPaid: boolean;
  originalName: string;
  documentType: string;
}

export default function SecurePDFViewer({ documentId, fileName, onClose, source = 'documents', isAdmin = false, userEmail, adminToken }: SecurePDFViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [documentStatus, setDocumentStatus] = useState<DocumentStatus | null>(null);
  const [scale, setScale] = useState(1.0);

  useEffect(() => {
    checkDocumentStatus();
  }, [documentId]);

  const checkDocumentStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      // Для документов из папки "Документы" всегда считаем оплаченными
      if (source === 'documents') {
        setDocumentStatus({
          id: documentId,
          isPaid: true,
          originalName: fileName,
          documentType: 'PDF'
        });
        setLoading(false);
        return;
      }

      // Для проектов проверяем реальный статус через API документов
      const response = await fetch(`/api/documents/${documentId}/info`);
      const result = await response.json();

      if (result.success) {
        setDocumentStatus({
          id: documentId,
          isPaid: result.document.isPaid,
          originalName: result.document.originalName,
          documentType: result.document.documentType
        });
        setLoading(false);
      } else {
        setError(result.message || 'Ошибка проверки статуса документа');
      }
    } catch (err) {
      console.error('Ошибка проверки статуса:', err);
      setError('Ошибка подключения к серверу');
    }
  };

  const downloadPDF = async () => {
    if (!isAdmin && !documentStatus?.isPaid) {
      alert('Документ не оплачен. Скачивание недоступно.');
      return;
    }

    try {
      // Для всех документов используем прямой URL через API документов
      const docResponse = await fetch(`/api/documents/${documentId}/info`);
      const docResult = await docResponse.json();

        if (docResult.success) {
        let fileUrl: string;
        if (docResult.document.objectId) {
          fileUrl = `/api/uploads/objects/${docResult.document.objectId}/${docResult.document.filename}`;
        } else if (docResult.document.projectId) {
          const base = `/api/uploads/projects/${docResult.document.projectId}/${encodeURIComponent(docResult.document.filename)}`;
          if (isAdmin && adminToken) {
            fileUrl = `${base}?token=${encodeURIComponent(adminToken)}`;
          } else if (userEmail) {
            fileUrl = `${base}?email=${encodeURIComponent(userEmail)}`;
          } else {
            alert('Не удалось скачать: нет данных для доступа к файлу');
            return;
          }
        } else {
          alert('Не удалось определить тип документа');
          return;
        }
        
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = fileName;
        link.click();
        return;
      } else {
        alert('Не удалось получить информацию о документе');
      }
    } catch (err) {
      console.error('Ошибка скачивания:', err);
      alert('Ошибка скачивания файла');
    }
  };


  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 3.0));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.5));
  };

  if (loading) {
    return (
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10000,
        backgroundColor: "rgba(0, 0, 0, 0.9)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "white"
      }}>
        <div style={{
          width: "50px",
          height: "50px",
          border: "4px solid rgba(255,255,255,0.3)",
          borderTop: "4px solid white",
          borderRadius: "50%",
          animation: "spin 1s linear infinite"
        }}></div>
        <p style={{ marginTop: "20px", fontSize: "1.2rem" }}>Проверка статуса документа...</p>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10000,
        backgroundColor: "rgba(0, 0, 0, 0.9)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        textAlign: "center"
      }}>
        <div style={{ fontSize: "4rem", marginBottom: "20px" }}>❌</div>
        <h3 style={{ fontSize: "1.5rem", marginBottom: "16px" }}>Ошибка</h3>
        <p style={{ fontSize: "1rem", marginBottom: "24px" }}>{error}</p>
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={checkDocumentStatus}
            style={{
              padding: "12px 24px",
              backgroundColor: "#3b82f6",
              border: "none",
              borderRadius: "8px",
              color: "white",
              cursor: "pointer",
              fontSize: "1rem"
            }}
          >
            🔄 Попробовать снова
          </button>
          <button
            onClick={onClose}
            style={{
              padding: "12px 24px",
              backgroundColor: "#ef4444",
              border: "none",
              borderRadius: "8px",
              color: "white",
              cursor: "pointer",
              fontSize: "1rem"
            }}
          >
            Закрыть
          </button>
        </div>
      </div>
    );
  }

  // Определяем, нужно ли показывать водяной знак
  const showWatermark = !isAdmin && !documentStatus?.isPaid;

  // Документ оплачен, показываем просмотрщик
  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 10000,
      backgroundColor: "rgba(0, 0, 0, 0.9)",
      display: "flex",
      flexDirection: "column"
    }}>
      {/* Заголовок и панель управления */}
      <div style={{
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        padding: "16px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid rgba(255, 255, 255, 0.1)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <h2 style={{
            fontFamily: "ChinaCyr, sans-serif",
            fontSize: "1.5rem",
            color: "white",
            margin: 0,
            maxWidth: "400px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap"
          }}>
            {fileName}
          </h2>
          <span style={{
            backgroundColor: showWatermark ? "rgba(239, 68, 68, 0.8)" : "rgba(34, 197, 94, 0.8)",
            color: "white",
            padding: "4px 8px",
            borderRadius: "4px",
            fontSize: "0.8rem"
          }}>
            {showWatermark ? "❌ Не оплачен" : "✅ Оплачен"}
          </span>
        </div>

                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  {/* Кнопка скачивания */}
                  <button
                    onClick={showWatermark ? undefined : downloadPDF}
                    disabled={showWatermark}
                    style={{
                      padding: "8px 12px",
                      backgroundColor: showWatermark ? "rgba(107, 114, 128, 0.5)" : "rgba(34, 197, 94, 0.8)",
                      border: "none",
                      borderRadius: "6px",
                      color: "white",
                      cursor: showWatermark ? "not-allowed" : "pointer",
                      fontSize: "0.9rem",
                      opacity: showWatermark ? 0.6 : 1
                    }}
                    title={showWatermark ? "Скачивание недоступно - документ не оплачен" : "Скачать документ"}
                  >
                    {showWatermark ? "Скачать (недоступно)" : "Скачать"}
                  </button>

                  {/* Кнопка закрытия */}
                  <button
                    onClick={onClose}
                    style={{
                      padding: "8px 12px",
                      backgroundColor: "rgba(239, 68, 68, 0.8)",
                      border: "none",
                      borderRadius: "6px",
                      color: "white",
                      cursor: "pointer",
                      fontSize: "0.9rem"
                    }}
                  >
                    Закрыть
                  </button>
                </div>
      </div>

      {/* Область просмотра PDF */}
      <div style={{
        flex: 1,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
        overflow: "auto",
        backgroundColor: "#f5f5f5"
      }}>
        <div style={{
          backgroundColor: "white",
          borderRadius: "8px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column"
        }}>
          {/* Информация о файле */}
          <div style={{
            padding: "12px 16px",
            backgroundColor: "#f8f9fa",
            borderBottom: "1px solid #dee2e6",
            fontSize: "0.9rem",
            color: "#495057",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <span>{fileName} • {showWatermark ? 'Не оплачен' : 'Оплачен'}</span>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={zoomOut}
                style={{
                  padding: "4px 8px",
                  backgroundColor: "#e9ecef",
                  border: "1px solid #ced4da",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "0.8rem"
                }}
              >
                -
              </button>
              <span style={{ fontSize: "0.8rem", minWidth: "50px", textAlign: "center" }}>
                {Math.round(scale * 100)}%
              </span>
              <button
                onClick={zoomIn}
                style={{
                  padding: "4px 8px",
                  backgroundColor: "#e9ecef",
                  border: "1px solid #ced4da",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "0.8rem"
                }}
              >
                +
              </button>
            </div>
          </div>
          
          {/* PDF в iframe */}
          <div style={{ flex: 1, position: "relative" }}>
            <PDFIframe
              documentId={documentId}
              fileName={fileName}
              scale={scale}
              userEmail={userEmail}
              isAdmin={isAdmin}
              adminToken={adminToken}
              usePdfJsForUnpaidProject={showWatermark}
            />
            
            {/* Водяной знак для неоплаченных документов */}
            {showWatermark && (
              <div style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "rgba(0, 0, 0, 0.35)", // Умеренное затемнение - можно читать текст
                backdropFilter: "blur(2px)", // Легкое размытие
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                pointerEvents: "none",
                zIndex: 10,
                // Дополнительная защита от скриншотов
                WebkitUserSelect: "none",
                MozUserSelect: "none",
                msUserSelect: "none",
                userSelect: "none",
                WebkitTouchCallout: "none",
                WebkitUserDrag: "none",
                KhtmlUserSelect: "none"
              }}>
                <div style={{
                  transform: "rotate(-45deg)",
                  fontSize: "3.5rem",
                  fontWeight: "bold",
                  color: "rgba(239, 68, 68, 0.85)", // Яркий красный
                  textShadow: "2px 2px 8px rgba(0,0,0,0.9), -2px -2px 8px rgba(0,0,0,0.9)", // Контрастная тень
                  userSelect: "none",
                  whiteSpace: "nowrap",
                  // Дополнительные стили для защиты
                  WebkitUserSelect: "none",
                  MozUserSelect: "none",
                  msUserSelect: "none",
                  WebkitTouchCallout: "none",
                  WebkitUserDrag: "none",
                  KhtmlUserSelect: "none",
                  position: "relative"
                }}>
                  НЕ ОПЛАЧЕНО
                </div>
                {/* Дополнительные водяные знаки по углам */}
                <div style={{
                  position: "absolute",
                  top: "10%",
                  left: "10%",
                  transform: "rotate(-45deg)",
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                  color: "rgba(239, 68, 68, 0.5)",
                  textShadow: "1px 1px 4px rgba(0,0,0,0.8)",
                  userSelect: "none"
                }}>
                  НЕ ОПЛАЧЕНО
                </div>
                <div style={{
                  position: "absolute",
                  top: "10%",
                  right: "10%",
                  transform: "rotate(-45deg)",
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                  color: "rgba(239, 68, 68, 0.5)",
                  textShadow: "1px 1px 4px rgba(0,0,0,0.8)",
                  userSelect: "none"
                }}>
                  НЕ ОПЛАЧЕНО
                </div>
                <div style={{
                  position: "absolute",
                  bottom: "10%",
                  left: "10%",
                  transform: "rotate(-45deg)",
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                  color: "rgba(239, 68, 68, 0.5)",
                  textShadow: "1px 1px 4px rgba(0,0,0,0.8)",
                  userSelect: "none"
                }}>
                  НЕ ОПЛАЧЕНО
                </div>
                <div style={{
                  position: "absolute",
                  bottom: "10%",
                  right: "10%",
                  transform: "rotate(-45deg)",
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                  color: "rgba(239, 68, 68, 0.5)",
                  textShadow: "1px 1px 4px rgba(0,0,0,0.8)",
                  userSelect: "none"
                }}>
                  НЕ ОПЛАЧЕНО
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Проекты: неоплаченные — pdf.js на canvas (сложнее скачать через UI); оплаченные — iframe (стабильно по HTTPS).
 * Объектные документы — iframe.
 */
function PDFIframe({ documentId, fileName, scale, userEmail, isAdmin, adminToken, usePdfJsForUnpaidProject }: {
  documentId: number;
  fileName: string;
  scale: number;
  userEmail?: string;
  isAdmin?: boolean;
  adminToken?: string;
  /** Только для проектов: true = неоплачен → canvas; false = оплачен → iframe */
  usePdfJsForUnpaidProject?: boolean;
}) {
  const [iframeSrc, setIframeSrc] = useState<string | null>(null);
  const [projectPdfUrl, setProjectPdfUrl] = useState<string | null>(null);
  const [authError, setAuthError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getIframeSrc = async () => {
      try {
        const docResponse = await fetch(`/api/documents/${documentId}/info`);
        const docResult = await docResponse.json();

        if (docResult.success) {
          const enc = encodeURIComponent(docResult.document.filename);
          if (docResult.document.objectId) {
            let fileUrl: string;
            if (isAdmin && adminToken) {
              fileUrl = `/api/uploads/objects/${docResult.document.objectId}/${docResult.document.filename}/admin?token=${encodeURIComponent(adminToken)}#toolbar=1&navpanes=1&scrollbar=1&zoom=${Math.round(scale * 100)}`;
            } else {
              const emailParam = userEmail ? `?email=${encodeURIComponent(userEmail)}` : '';
              fileUrl = `/api/uploads/objects/${docResult.document.objectId}/${docResult.document.filename}${emailParam}#toolbar=1&navpanes=1&scrollbar=1&zoom=${Math.round(scale * 100)}`;
            }
            setIframeSrc(fileUrl);
            setProjectPdfUrl(null);
            setAuthError(false);
          } else if (docResult.document.projectId) {
            const base = `/api/uploads/projects/${docResult.document.projectId}/${enc}`;
            if (isAdmin && adminToken) {
              setProjectPdfUrl(`${base}?token=${encodeURIComponent(adminToken)}`);
              setIframeSrc(null);
              setAuthError(false);
            } else if (userEmail) {
              setProjectPdfUrl(`${base}?email=${encodeURIComponent(userEmail)}`);
              setIframeSrc(null);
              setAuthError(false);
            } else {
              setProjectPdfUrl(null);
              setIframeSrc(null);
              setAuthError(true);
            }
          } else {
            console.error('Не удалось определить тип документа');
          }
        } else {
          console.error('Не удалось получить информацию о документе');
        }
      } catch (error) {
        console.error('Ошибка получения информации о документе:', error);
      }
      setLoading(false);
    };

    getIframeSrc();
  }, [documentId, fileName, scale, isAdmin, adminToken, userEmail]);

  const zoomHash = `#toolbar=1&navpanes=1&scrollbar=1&zoom=${Math.round(scale * 100)}`;

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        backgroundColor: '#f5f5f5'
      }}>
        <div style={{
          width: "40px",
          height: "40px",
          border: "4px solid rgba(0,0,0,0.1)",
          borderTop: "4px solid #3b82f6",
          borderRadius: "50%",
          animation: "spin 1s linear infinite"
        }}></div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (authError) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        backgroundColor: '#f5f5f5',
        padding: '24px',
        textAlign: 'center',
        color: '#64748b',
        fontFamily: 'Arial, sans-serif',
      }}>
        Не удалось открыть PDF: укажите email для доступа к файлам проекта.
      </div>
    );
  }

  if (projectPdfUrl) {
    if (usePdfJsForUnpaidProject) {
      return <PdfJsProjectViewer pdfUrl={projectPdfUrl} scale={scale} />;
    }
    return (
      <iframe
        src={projectPdfUrl.includes("#") ? projectPdfUrl : `${projectPdfUrl}${zoomHash}`}
        style={{
          width: "100%",
          height: "100%",
          border: "none",
          borderRadius: "0 0 8px 8px",
        }}
        title={fileName}
      />
    );
  }

  if (!iframeSrc) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        backgroundColor: '#f5f5f5'
      }}>
        <div style={{
          width: "40px",
          height: "40px",
          border: "4px solid rgba(0,0,0,0.1)",
          borderTop: "4px solid #3b82f6",
          borderRadius: "50%",
          animation: "spin 1s linear infinite"
        }}></div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <iframe
      src={iframeSrc}
      style={{
        width: "100%",
        height: "100%",
        border: "none",
        borderRadius: "0 0 8px 8px"
      }}
      title={fileName}
    />
  );
}
