"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useViewMode } from "./ui/ViewMode";
import CustomerPhotosPanel from "./CustomerPhotosPanel";
import AllPhotosPanel from "./AllPhotosPanel";
import DocumentsPanel from "./DocumentsPanel";
import ProjectsPanel from "./ProjectsPanel";

interface Project {
  id: number;
  title: string;
  description?: string;
  status: string;
  createdAt: string;
  documents?: Document[];
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
  isVisibleToCustomer?: boolean;
}

interface Document {
  id: number;
  filename: string;
  originalName: string;
  documentType: string;
  uploadedAt: string;
  isPaid: boolean;
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

interface PaymentStatus {
  id: number;
  amount: number;
  status: string;
  description?: string;
  dueDate: string;
  createdAt: string;
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
  user: {
    id: number;
    name?: string;
    email: string;
  };
}

interface AdminObjectDetailViewProps {
  adminToken: string;
}

export default function AdminObjectDetailView({ adminToken }: AdminObjectDetailViewProps) {
  const { setMode } = useViewMode();
  const [object, setObject] = useState<ObjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all-photos' | 'customer-photos' | 'projects' | 'payments' | 'messages' | 'documents'>('all-photos');
  const [customer, setCustomer] = useState<any>(null);
  const [updatingPhotos, setUpdatingPhotos] = useState<Set<number>>(new Set());
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [imageUrls, setImageUrls] = useState<{[key: string]: string}>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteType, setDeleteType] = useState<'photo' | 'document' | 'message' | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [photoComments, setPhotoComments] = useState<any[]>([]);
  const [newPhotoComment, setNewPhotoComment] = useState('');
  const [sendingPhotoComment, setSendingPhotoComment] = useState(false);
  const [folders, setFolders] = useState<any[]>([]);
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [selectedCustomerFolder, setSelectedCustomerFolder] = useState<number | null>(null);
  const [tempSelectedFolder, setTempSelectedFolder] = useState<number | null>(null);

  const objectId = localStorage.getItem('selectedAdminObjectId');

  useEffect(() => {
    // Получаем информацию о заказчике из localStorage
    const customerData = localStorage.getItem('adminViewingCustomer');
    if (customerData) {
      setCustomer(JSON.parse(customerData));
    }
  }, []);

  // Загружаем объект и папки когда customer готов
  useEffect(() => {
    if (customer && objectId) {
      fetchObjectDetail();
      loadFolders();
    }
  }, [customer, objectId]);

  const fetchObjectDetail = async () => {
    if (!objectId) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/objects/${objectId}?userId=${customer?.id}`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setObject(data.object);
        // Загружаем изображения с авторизацией
        await loadImagesWithAuth(data.object);
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

  const loadImagesWithAuth = async (objectData: any) => {
    if (!objectData?.photos) return;
    
    const newImageUrls: {[key: string]: string} = {};
    
    for (const photo of objectData.photos) {
      if ((photo as any).mimeType?.startsWith('image/')) {
        try {
          const response = await fetch(`/api/uploads/objects/${objectData.id}/${photo.filename}/admin`, {
            headers: {
              Authorization: `Bearer ${adminToken}`,
            },
          });
          
          if (response.ok) {
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            newImageUrls[photo.filename] = url;
          }
        } catch (error) {
          console.error(`Ошибка загрузки изображения ${photo.filename}:`, error);
        }
      }
    }
    
    setImageUrls(newImageUrls);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !objectId) return;
    
    setSendingMessage(true);
    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          content: newMessage.trim(),
          objectId: parseInt(objectId),
          isAdminMessage: true
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

  const handlePhotosUpdate = () => {
    fetchObjectDetail();
    loadFolders(); // Обновляем папки при обновлении фото
  };

  // Загрузка папок
  const loadFolders = async () => {
    if (!objectId) return;
    
    setLoadingFolders(true);
    try {
      const response = await fetch(`/api/admin/objects/${objectId}/folders`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setFolders(data.folders || []);
      }
    } catch (error) {
      console.error("Ошибка загрузки папок:", error);
    } finally {
      setLoadingFolders(false);
    }
  };

  // Назначить фото в папку (временное состояние)
  const assignPhotoToFolder = (photoId: number, folderId: number | null) => {
    setTempSelectedFolder(folderId);
  };

  // Сохранить назначение папки
  const savePhotoFolderAssignment = async (photoId: number, folderId: number | null) => {
    if (!objectId) return;

    try {
      const response = await fetch(`/api/admin/objects/${objectId}/photos/${photoId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${adminToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ folderId }),
      });

      const data = await response.json();
      if (data.success) {
        // Обновляем состояние объекта с новыми данными
        if (object) {
          setObject(prevObject => ({
            ...prevObject!,
            photos: prevObject!.photos.map(photo => 
              photo.id === photoId 
                ? { 
                    ...photo, 
                    folderId: data.photo.folderId,
                    folder: data.photo.folderId ? { id: data.photo.folderId, name: data.photo.folderName || '' } : null
                  }
                : photo
            )
          }));
        }
        
        // Обновляем selectedPhoto если оно открыто
        if (selectedPhoto && selectedPhoto.id === photoId) {
          setSelectedPhoto({
            ...selectedPhoto,
            folderId: data.photo.folderId,
            folder: data.photo.folderId ? { id: data.photo.folderId, name: data.photo.folderName || '' } : null
          } as any);
        }
        
        // Обновляем список папок
        loadFolders();
      } else {
        alert(data.message || "Ошибка назначения фото в папку");
      }
    } catch (error) {
      console.error("Ошибка назначения фото:", error);
      alert("Ошибка назначения фото в папку");
    }
  };

  const handleCreateProject = async () => {
    const title = prompt('Введите название проекта:');
    if (!title) return;

    const description = prompt('Введите описание проекта (необязательно):') || '';

    try {
      const response = await fetch(`/api/admin/objects/${objectId}/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ title, description })
      });

      const result = await response.json();

      if (result.success) {
        // Обновляем данные объекта
        await fetchObjectDetail();
      } else {
        alert(`Ошибка создания проекта: ${result.message}`);
      }
    } catch (error) {
      console.error('Ошибка создания проекта:', error);
      alert('Ошибка создания проекта');
    }
  };

  // Оптимистичное обновление видимости фото
  const togglePhotoVisibility = async (photoId: number, newVisibility: boolean) => {
    // Добавляем фото в список обновляющихся
    setUpdatingPhotos(prev => new Set(prev).add(photoId));
    
    // Сначала обновляем локальное состояние
    if (object) {
      setObject(prevObject => ({
        ...prevObject!,
        photos: prevObject!.photos.map(photo => 
          photo.id === photoId 
            ? { ...photo, isVisibleToCustomer: newVisibility }
            : photo
        )
      }));
    }

    // Затем отправляем запрос на сервер
    try {
      const response = await fetch(`/api/admin/objects/${object?.id}/photos`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          photoId,
          isVisibleToCustomer: newVisibility
        }),
      });
      
      const data = await response.json();
      if (!data.success) {
        // Если запрос не удался, откатываем изменения
        if (object) {
          setObject(prevObject => ({
            ...prevObject!,
            photos: prevObject!.photos.map(photo => 
              photo.id === photoId 
                ? { ...photo, isVisibleToCustomer: !newVisibility }
                : photo
            )
          }));
        }
        alert('Ошибка: ' + data.message);
      }
    } catch (error) {
      // Если запрос не удался, откатываем изменения
      if (object) {
        setObject(prevObject => ({
          ...prevObject!,
          photos: prevObject!.photos.map(photo => 
            photo.id === photoId 
              ? { ...photo, isVisibleToCustomer: !newVisibility }
              : photo
          )
        }));
      }
      alert('Ошибка сети');
    } finally {
      // Убираем фото из списка обновляющихся
      setUpdatingPhotos(prev => {
        const newSet = new Set(prev);
        newSet.delete(photoId);
        return newSet;
      });
    }
  };

  // Удаление фото
  const deletePhoto = async (photoId: number) => {
    setDeleteType('photo');
    setDeleteId(photoId);
    setShowDeleteConfirm(true);
  };

  const confirmDeletePhoto = async () => {
    if (!deleteId) return;

    try {
      const response = await fetch(`/api/admin/objects/${object?.id}/photos`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`
        },
        body: JSON.stringify({ photoId: deleteId })
      });

      if (!response.ok) {
        throw new Error('Ошибка удаления фото');
      }

      // Обновляем локальное состояние
      if (object) {
        setObject(prevObject => ({
          ...prevObject!,
          photos: prevObject!.photos.filter(photo => photo.id !== deleteId)
        }));
      }

      setShowDeleteConfirm(false);
      setDeleteType(null);
      setDeleteId(null);

    } catch (error) {
      console.error('Ошибка удаления фото:', error);
      alert('Ошибка удаления фото');
    }
  };

  // Удаление документа
  const deleteDocument = async (documentId: number) => {
    setDeleteType('document');
    setDeleteId(documentId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteDocument = async () => {
    if (!deleteId) return;

    try {
      const response = await fetch(`/api/admin/objects/${object?.id}/documents?documentId=${deleteId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${adminToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Ошибка удаления документа');
      }

      // Обновляем локальное состояние
      if (object) {
        setObject(prevObject => ({
          ...prevObject!,
          documents: prevObject!.documents.filter(doc => doc.id !== deleteId)
        }));
      }

      setShowDeleteConfirm(false);
      setDeleteType(null);
      setDeleteId(null);

    } catch (error) {
      console.error('Ошибка удаления документа:', error);
      alert('Ошибка удаления документа');
    }
  };

  // Удаление сообщения
  const deleteMessage = async (messageId: number) => {
    setDeleteType('message');
    setDeleteId(messageId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteMessage = async () => {
    if (!deleteId) return;

    try {
      const response = await fetch(`/api/messages?messageId=${deleteId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${adminToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Ошибка удаления сообщения');
      }

      // Обновляем локальное состояние
      if (object) {
        setObject(prevObject => ({
          ...prevObject!,
          messages: prevObject!.messages.filter(msg => msg.id !== deleteId)
        }));
      }

      setShowDeleteConfirm(false);
      setDeleteType(null);
      setDeleteId(null);

    } catch (error) {
      console.error('Ошибка удаления сообщения:', error);
      alert('Ошибка удаления сообщения');
    }
  };

  // Универсальная функция подтверждения удаления
  const handleConfirmDelete = async () => {
    switch (deleteType) {
      case 'photo':
        await confirmDeletePhoto();
        break;
      case 'document':
        await confirmDeleteDocument();
        break;
      case 'message':
        await confirmDeleteMessage();
        break;
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeleteType(null);
    setDeleteId(null);
  };

  const fetchPhotoComments = async (photoId: number) => {
    try {
      const response = await fetch(`/api/photo-comments?photoId=${photoId}`);
      const data = await response.json();
      if (data.success) {
        setPhotoComments(data.comments);
      }
    } catch (err) {
      console.error('Ошибка загрузки комментариев к фото:', err);
    }
  };

  const sendPhotoComment = async () => {
    if (!newPhotoComment.trim() || !selectedPhoto) return;
    
    setSendingPhotoComment(true);
    try {
      const response = await fetch('/api/photo-comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          photoId: selectedPhoto.id,
          content: newPhotoComment.trim()
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setNewPhotoComment('');
        // Обновляем список комментариев
        await fetchPhotoComments(selectedPhoto.id);
      } else {
        console.error('Ошибка отправки комментария:', data.message);
      }
    } catch (err) {
      console.error('Ошибка отправки комментария:', err);
    } finally {
      setSendingPhotoComment(false);
    }
  };

  useEffect(() => {
    if (objectId && customer && adminToken) {
      fetchObjectDetail();
    }
  }, [objectId, customer, adminToken]);

  // Загружаем комментарии при открытии фото
  useEffect(() => {
    if (selectedPhoto) {
      fetchPhotoComments(selectedPhoto.id);
    }
  }, [selectedPhoto]);

  // Очистка blob URLs при размонтировании
  useEffect(() => {
    return () => {
      Object.values(imageUrls).forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [imageUrls]);

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
          onClick={() => setMode("admin-objects")}
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
    <div className="admin-object-detail-container" style={{ 
      maxWidth: "1200px", 
      margin: "0 auto",
      paddingTop: "200px" // СДВИНУЛ ЕЩЕ БОЛЬШЕ!
    }}>
      {/* Заголовок */}
      <div style={{
        marginBottom: "32px",
        color: "white",
        marginTop: "50px" // СДВИНУЛ ЗАГОЛОВОК ВНИЗ!
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          marginBottom: "16px"
        }}>
          <button
            onClick={() => setMode("admin-objects")}
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
            {object?.title}
          </h2>
        </div>
        <div style={{
          marginLeft: "48px",
          display: "flex",
          flexDirection: "column",
          gap: "8px"
        }}>
          {object?.description && (
            <p style={{
              fontFamily: "Arial, sans-serif",
              fontSize: "1rem",
              color: "rgba(255,255,255,0.8)",
              margin: 0
            }}>
              {object?.description}
            </p>
          )}
          {object?.address && (
            <p style={{
              fontFamily: "Arial, sans-serif",
              fontSize: "0.9rem",
              color: "rgba(255,255,255,0.6)",
              margin: 0
            }}>
              📍 {object?.address}
            </p>
          )}
          <p style={{
            fontFamily: "Arial, sans-serif",
            fontSize: "0.9rem",
            color: "rgba(255,255,255,0.7)",
            margin: 0
          }}>
            Заказчик: {object?.user?.name || object?.user?.email}
          </p>
        </div>
      </div>

      {/* Табы */}
      <div style={{
        display: "flex",
        gap: "12px",
        marginBottom: "32px",
        marginLeft: "48px",
        flexWrap: "wrap",
        padding: "4px",
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        borderRadius: "12px",
        backdropFilter: "blur(10px)"
      }}>
        {[
          { key: 'all-photos', label: 'Все фото', count: object?.photos?.length || 0, icon: '' },
          { key: 'customer-photos', label: 'Фото для заказчика', count: object?.photos?.filter(p => p.isVisibleToCustomer).length || 0, icon: '' },
          { key: 'projects', label: 'Проекты', count: object.projects?.flatMap(project => project.documents || []).length || 0, icon: '' },
          { key: 'payments', label: 'Статусы оплаты', count: 0, icon: '' }, // Пока заглушка
          { key: 'messages', label: 'Сообщения', count: object.messages?.length || 0, icon: '' },
          { key: 'documents', label: 'Документы', count: object.documents?.length || 0, icon: '' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            style={{
              padding: "12px 20px",
              borderRadius: "8px",
              border: "none",
              backgroundColor: activeTab === tab.key ? "rgba(59, 130, 246, 0.9)" : "rgba(255, 255, 255, 0.1)",
              color: "white",
              fontFamily: "Arial, sans-serif",
              cursor: "pointer",
              transition: "all 0.3s ease",
              fontSize: "0.9rem",
              fontWeight: "500",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              minWidth: "140px",
              justifyContent: "center"
            }}
            onMouseEnter={(e) => {
              if (activeTab !== tab.key) {
                e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.2)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== tab.key) {
                e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
                e.currentTarget.style.transform = "translateY(0)";
              }
            }}
          >
            <span style={{ fontSize: "1.1rem" }}>{tab.icon}</span>
            <span>{tab.label}</span>
            <span style={{
              backgroundColor: activeTab === tab.key ? "rgba(255, 255, 255, 0.3)" : "rgba(255, 255, 255, 0.2)",
              color: "white",
              padding: "2px 8px",
              borderRadius: "12px",
              fontSize: "0.75rem",
              fontWeight: "600",
              minWidth: "20px",
              textAlign: "center"
            }}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Контент табов */}
      <div style={{ marginLeft: "48px" }}>
        {activeTab === 'all-photos' && (
          <div>
            <AllPhotosPanel 
              objectId={objectId || "0"} 
              adminToken={adminToken} 
              onPhotosUpdate={handlePhotosUpdate} 
            />
            
            {/* Сетка фотографий с превью */}
            {object.photos && object.photos.length > 0 ? (
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: "20px",
                marginTop: "24px"
              }}>
                {object.photos.map((photo) => (
                  <div
                    key={photo.id}
                    onClick={() => {
                      setSelectedPhoto(photo);
                      setTempSelectedFolder((photo as any).folderId || null);
                    }}
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.1)",
                      borderRadius: "16px",
                      padding: "0",
                      backdropFilter: "blur(10px)",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                      overflow: "hidden",
                      transition: "all 0.3s ease",
                      cursor: "pointer"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-4px)";
                      e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.3)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    {/* Превью изображения */}
                    <div style={{
                      width: "100%",
                      height: "200px",
                      backgroundColor: "rgba(0,0,0,0.3)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      position: "relative",
                      overflow: "hidden"
                    }}>
                      {(photo as any).mimeType?.startsWith('image/') ? (
                        <img
                          src={imageUrls[photo.filename] || `/api/uploads/objects/${object.id}/${photo.filename}/admin`}
                          alt={photo.originalName}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover"
                          }}
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            (e.currentTarget.nextElementSibling as HTMLElement)?.style && ((e.currentTarget.nextElementSibling as HTMLElement).style.display = "flex");
                          }}
                        />
                      ) : null}
                      <div style={{
                        display: (photo as any).mimeType?.startsWith('image/') ? "none" : "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "100%",
                        height: "100%",
                        fontSize: "3rem"
                      }}>
                        {(photo as any).mimeType?.startsWith('video/') ? '🎥' : '📷'}
                      </div>
                      
                      {/* Статус видимости */}
                      <div style={{
                        position: "absolute",
                        top: "8px",
                        right: "8px",
                        backgroundColor: photo.isVisibleToCustomer ? "rgba(34, 197, 94, 0.9)" : "rgba(239, 68, 68, 0.9)",
                        color: "white",
                        padding: "4px 8px",
                        borderRadius: "12px",
                        fontSize: "0.75rem",
                        fontFamily: "Arial, sans-serif",
                        fontWeight: "600"
                      }}>
                        {photo.isVisibleToCustomer ? "Видно" : "Скрыто"}
                      </div>
                    </div>
                    
                    {/* Информация о файле */}
                    <div style={{ padding: "16px" }}>
                      <h4 style={{
                        fontFamily: "Arial, sans-serif",
                        fontSize: "0.9rem",
                        color: "white",
                        margin: "0 0 8px 0",
                        fontWeight: "600",
                        wordBreak: "break-word"
                      }}>
                        {photo.originalName}
                      </h4>
                      
                      <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "12px"
                      }}>
                        <span style={{
                          fontSize: "0.75rem",
                          color: "rgba(255,255,255,0.7)",
                          fontFamily: "Arial, sans-serif"
                        }}>
                          {formatDate(photo.uploadedAt)}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePhotoVisibility(photo.id, !photo.isVisibleToCustomer);
                          }}
                          disabled={updatingPhotos.has(photo.id)}
                          style={{
                            background: photo.isVisibleToCustomer ? "rgba(239, 68, 68, 0.8)" : "rgba(34, 197, 94, 0.8)",
                            border: "none",
                            color: "white",
                            padding: "6px 12px",
                            borderRadius: "6px",
                            fontSize: "0.75rem",
                            fontFamily: "Arial, sans-serif",
                            cursor: updatingPhotos.has(photo.id) ? "not-allowed" : "pointer",
                            opacity: updatingPhotos.has(photo.id) ? 0.6 : 1,
                            transition: "all 0.2s ease",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px"
                          }}
                          onMouseEnter={(e) => {
                            if (!updatingPhotos.has(photo.id)) {
                              e.currentTarget.style.opacity = "0.8";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!updatingPhotos.has(photo.id)) {
                              e.currentTarget.style.opacity = "1";
                            }
                          }}
                        >
                          {updatingPhotos.has(photo.id) ? (
                            <>
                              <div style={{
                                width: "12px",
                                height: "12px",
                                border: "2px solid rgba(255,255,255,0.3)",
                                borderTop: "2px solid white",
                                borderRadius: "50%",
                                animation: "spin 1s linear infinite"
                              }}></div>
                              Обновление...
                            </>
                          ) : (
                            photo.isVisibleToCustomer ? "Скрыть" : "Показать"
                          )}
                        </button>
                      </div>

                      {/* Информация о папке */}
                      {(photo as any).folder && (
                        <div style={{ 
                          marginBottom: "12px",
                          padding: "8px",
                          background: "rgba(211, 163, 115, 0.15)",
                          borderRadius: "6px",
                          border: "1px solid rgba(211, 163, 115, 0.3)"
                        }}>
                          <div style={{
                            fontSize: "0.75rem",
                            color: "rgba(255,255,255,0.7)",
                            marginBottom: "2px",
                            fontFamily: "Arial, sans-serif"
                          }}>
                            📁 Папка:
                          </div>
                          <div style={{
                            fontSize: "0.85rem",
                            color: "#d3a373",
                            fontWeight: 600,
                            fontFamily: "Arial, sans-serif"
                          }}>
                            {(photo as any).folder.name}
                          </div>
                        </div>
                      )}

                      <div style={{
                        display: "flex",
                        gap: "8px"
                      }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deletePhoto(photo.id);
                          }}
                          style={{
                            flex: 1,
                            background: "rgba(239, 68, 68, 0.8)",
                            border: "none",
                            color: "white",
                            padding: "6px 12px",
                            borderRadius: "6px",
                            fontSize: "0.75rem",
                            fontFamily: "Arial, sans-serif",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            marginLeft: "8px"
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.opacity = "0.8";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.opacity = "1";
                          }}
                        >
                          🗑️ Удалить
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                textAlign: "center",
                color: "rgba(255,255,255,0.6)",
                padding: "60px 20px",
                fontFamily: "Arial, sans-serif"
              }}>
                <div style={{ fontSize: "3rem", marginBottom: "16px" }}>📷</div>
                <p style={{ fontSize: "1.2rem", marginBottom: "8px" }}>Пока нет фотографий</p>
                <p style={{ fontSize: "0.9rem" }}>Загрузите фотографии через панель выше</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'customer-photos' && (
          <div>
            {/* Панель загрузки */}
            <CustomerPhotosPanel 
              objectId={object.id} 
              adminToken={adminToken}
              onPhotosUpdate={handlePhotosUpdate}
              onFolderSelect={setSelectedCustomerFolder}
              selectedFolder={selectedCustomerFolder}
            />

            {/* Сетка фото для заказчика */}
            {(() => {
              // Фильтруем фото в зависимости от выбранной папки
              let filteredPhotos = object.photos.filter(p => p.isVisibleToCustomer);
              
              if (selectedCustomerFolder !== null) {
                // Если выбрана конкретная папка, показываем только фото из этой папки
                filteredPhotos = filteredPhotos.filter(photo => 
                  (photo as any).folderId === selectedCustomerFolder
                );
              }
              
              return filteredPhotos.length > 0 ? (
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: "20px",
                  marginTop: "24px"
                }}>
                  {filteredPhotos.map((photo) => (
                  <div
                    key={photo.id}
                    onClick={() => {
                      setSelectedPhoto(photo);
                      setTempSelectedFolder((photo as any).folderId || null);
                    }}
                    style={{
                      backgroundColor: "rgba(34, 197, 94, 0.1)",
                      borderRadius: "16px",
                      padding: "0",
                      backdropFilter: "blur(10px)",
                      border: "1px solid rgba(34, 197, 94, 0.3)",
                      overflow: "hidden",
                      transition: "all 0.3s ease",
                      cursor: "pointer"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-4px)";
                      e.currentTarget.style.boxShadow = "0 8px 32px rgba(34, 197, 94, 0.3)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    {/* Превью изображения */}
                    <div style={{
                      width: "100%",
                      height: "200px",
                      backgroundColor: "rgba(0,0,0,0.3)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      position: "relative",
                      overflow: "hidden"
                    }}>
                      {(photo as any).mimeType?.startsWith('image/') ? (
                        <img
                          src={imageUrls[photo.filename] || `/api/uploads/objects/${object.id}/${photo.filename}/admin`}
                          alt={photo.originalName}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover"
                          }}
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            (e.currentTarget.nextElementSibling as HTMLElement)?.style && ((e.currentTarget.nextElementSibling as HTMLElement).style.display = "flex");
                          }}
                        />
                      ) : null}
                      <div style={{
                        display: (photo as any).mimeType?.startsWith('image/') ? "none" : "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "100%",
                        height: "100%",
                        fontSize: "3rem"
                      }}>
                        {(photo as any).mimeType?.startsWith('video/') ? '🎥' : '📷'}
                      </div>
                      
                      {/* Статус видимости */}
                      <div style={{
                        position: "absolute",
                        top: "8px",
                        right: "8px",
                        backgroundColor: "rgba(34, 197, 94, 0.9)",
                        color: "white",
                        padding: "4px 8px",
                        borderRadius: "12px",
                        fontSize: "0.75rem",
                        fontFamily: "Arial, sans-serif",
                        fontWeight: "600"
                      }}>
                        Видно заказчику
                      </div>
                    </div>
                    
                    {/* Информация о файле */}
                    <div style={{ padding: "16px" }}>
                      <h4 style={{
                        fontFamily: "Arial, sans-serif",
                        fontSize: "0.9rem",
                        color: "white",
                        margin: "0 0 8px 0",
                        fontWeight: "600",
                        wordBreak: "break-word"
                      }}>
                        {photo.originalName}
                      </h4>
                      
                      <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}>
                        <span style={{
                          fontSize: "0.75rem",
                          color: "rgba(34, 197, 94, 1)",
                          fontFamily: "Arial, sans-serif",
                          fontWeight: "600"
                        }}>
                          ✓ Видно заказчику
                        </span>
                        <span style={{
                          fontSize: "0.75rem",
                          color: "rgba(255,255,255,0.7)",
                          fontFamily: "Arial, sans-serif"
                        }}>
                          {formatDate(photo.uploadedAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                textAlign: "center",
                color: "rgba(255,255,255,0.6)",
                padding: "60px 20px",
                fontFamily: "Arial, sans-serif"
              }}>
                <div style={{ fontSize: "3rem", marginBottom: "16px" }}>👁️</div>
                <p style={{ fontSize: "1.2rem", marginBottom: "8px" }}>
                  {selectedCustomerFolder !== null 
                    ? "В этой папке нет фото" 
                    : "Нет фото для заказчика"
                  }
                </p>
                <p style={{ fontSize: "0.9rem" }}>
                  {selectedCustomerFolder !== null 
                    ? "Назначьте фото в эту папку из вкладки 'Все фото'" 
                    : "Загрузите фотографии и сделайте их видимыми для заказчика"
                  }
                </p>
              </div>
            )
            })()}
          </div>
        )}

        {activeTab === 'projects' && (
          <div>
            <h3 style={{
              fontFamily: "ChinaCyr, sans-serif",
              fontSize: "1.5rem",
              color: "white",
              margin: "0 0 24px 0",
              display: "flex",
              alignItems: "center",
              gap: "12px"
            }}>
              Проекты
            </h3>
            
            {/* Документы проектов с проверкой оплаты */}
            <DocumentsPanel
              objectId={parseInt(objectId || "0")}
              documents={object.projects?.flatMap(project => project.documents || []) || [] as any}
              adminToken={adminToken}
              onDocumentsUpdate={fetchObjectDetail}
              requirePaymentCheck={true}
            />
          </div>
        )}

        {activeTab === 'payments' && (
          <div style={{
            textAlign: "center",
            color: "rgba(255,255,255,0.6)",
            padding: "60px 20px",
            fontFamily: "Arial, sans-serif"
          }}>
            <div style={{ fontSize: "3rem", marginBottom: "16px" }}>💰</div>
            <p style={{ fontSize: "1.2rem", marginBottom: "16px" }}>Статусы оплаты</p>
            <p>Функция будет добавлена в следующей версии</p>
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
                    backgroundColor: (!newMessage.trim() || sendingMessage) ? "rgba(107, 114, 128, 0.5)" : "rgba(59, 130, 246, 0.8)",
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
                      e.currentTarget.style.backgroundColor = "rgba(59, 130, 246, 1)";
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (newMessage.trim() && !sendingMessage) {
                      e.currentTarget.style.backgroundColor = "rgba(59, 130, 246, 0.8)";
                      e.currentTarget.style.transform = "translateY(0)";
                    }
                  }}
                >
                  {sendingMessage ? "Отправка..." : "Отправить"}
                </button>
              </div>
            </div>

            {/* Список сообщений */}
            {object.messages.length > 0 ? (
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
                    <div style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      marginTop: "12px"
                    }}>
                      <button
                        onClick={() => deleteMessage(message.id)}
                        style={{
                          background: "rgba(239, 68, 68, 0.8)",
                          border: "none",
                          color: "white",
                          padding: "6px 12px",
                          borderRadius: "6px",
                          fontSize: "0.75rem",
                          fontFamily: "Arial, sans-serif",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.opacity = "0.8";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.opacity = "1";
                        }}
                      >
                        🗑️ Удалить
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                textAlign: "center",
                color: "rgba(255,255,255,0.6)",
                padding: "40px",
                fontFamily: "Arial, sans-serif"
              }}>
                <p>Пока нет сообщений</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'documents' && (
          <DocumentsPanel
            objectId={object.id}
            documents={object.documents}
            adminToken={adminToken}
            onDocumentsUpdate={fetchObjectDetail}
          />
        )}

        {/* Сообщение если нет данных */}
        {(activeTab === 'all-photos' && object.photos.length === 0) ||
         (activeTab === 'customer-photos' && object.photos.filter(p => p.isVisibleToCustomer).length === 0) ||
         (activeTab === 'projects' && object.projects.length === 0) ||
         (activeTab === 'messages' && object.messages.length === 0) ||
         (activeTab === 'documents' && object.documents.length === 0) ? (
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
      
      {/* Модальное окно подтверждения удаления */}
      {showDeleteConfirm && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          pointerEvents: "auto"
        }}>
          <div style={{
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(10px)",
            borderRadius: "16px",
            padding: "32px",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            maxWidth: "400px",
            width: "90%",
            textAlign: "center"
          }}>
            <h3 style={{
              fontFamily: "ChinaCyr, sans-serif",
              fontSize: "1.5rem",
              color: "white",
              margin: "0 0 20px 0"
            }}>
              Подтверждение удаления
            </h3>
            <p style={{
              fontFamily: "Arial, sans-serif",
              fontSize: "1rem",
              color: "rgba(255, 255, 255, 0.8)",
              margin: "0 0 24px 0",
              lineHeight: "1.5"
            }}>
              {deleteType === 'photo' && 'Вы уверены, что хотите удалить это фото?'}
              {deleteType === 'document' && 'Вы уверены, что хотите удалить этот документ?'}
              {deleteType === 'message' && 'Вы уверены, что хотите удалить это сообщение?'}
            </p>
            <div style={{
              display: "flex",
              gap: "12px",
              justifyContent: "center"
            }}>
              <button
                onClick={handleCancelDelete}
                style={{
                  backgroundColor: "rgba(107, 114, 128, 0.8)",
                  border: "none",
                  color: "white",
                  padding: "12px 24px",
                  borderRadius: "8px",
                  fontSize: "0.9rem",
                  fontFamily: "Arial, sans-serif",
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(107, 114, 128, 1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(107, 114, 128, 0.8)";
                }}
              >
                Отмена
              </button>
              <button
                onClick={handleConfirmDelete}
                style={{
                  backgroundColor: "rgba(239, 68, 68, 0.8)",
                  border: "none",
                  color: "white",
                  padding: "12px 24px",
                  borderRadius: "8px",
                  fontSize: "0.9rem",
                  fontFamily: "Arial, sans-serif",
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.8)";
                }}
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Viewer */}
      {selectedPhoto && (
        <div style={{
          position: "fixed",
          top: "120px",
          left: "20px",
          right: "20px",
          bottom: "20px",
          backgroundColor: "rgba(0,0,0,0.9)",
          borderRadius: "12px",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <div style={{
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(255,255,255,0.1)",
            padding: "20px",
            display: "flex",
            gap: "20px",
            overflow: "hidden"
          }}>
            {/* Левая часть - Фото */}
            <div style={{
              flex: "1",
              display: "flex",
              flexDirection: "column",
              gap: "20px"
            }}>
              {/* Header */}
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
                <button
                  onClick={async () => {
                    console.log('Закрытие просмотрщика:', {
                      selectedPhoto: selectedPhoto?.id,
                      tempSelectedFolder,
                      currentFolderId: (selectedPhoto as any)?.folderId
                    });
                    
                    // Сохраняем назначение папки перед закрытием
                    if (selectedPhoto && tempSelectedFolder !== (selectedPhoto as any).folderId) {
                      console.log('Сохраняем изменения папки');
                      await savePhotoFolderAssignment(selectedPhoto.id, tempSelectedFolder);
                    }
                    
                    // Закрываем просмотрщик
                    setSelectedPhoto(null);
                    setPhotoComments([]);
                    setNewPhotoComment('');
                    setTempSelectedFolder(null);
                  }}
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

              {/* Photo */}
              <div style={{
                flex: "1",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: "400px"
              }}>
                <img
                  src={imageUrls[selectedPhoto.filename] || `/api/uploads/objects/${object?.id}/${selectedPhoto.filename}/admin`}
                  alt={selectedPhoto.originalName}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "100%",
                    objectFit: "contain",
                    borderRadius: "8px"
                  }}
                />
              </div>

              {/* Navigation */}
              <div style={{
                display: "flex",
                justifyContent: "center",
                gap: "10px"
              }}>
                <button
                  onClick={async () => {
                    // Сначала сохраняем текущее назначение папки
                    if (selectedPhoto && tempSelectedFolder !== (selectedPhoto as any).folderId) {
                      await savePhotoFolderAssignment(selectedPhoto.id, tempSelectedFolder);
                    }
                    
                    // Затем переходим к предыдущему фото
                    const currentIndex = object?.photos.findIndex(p => p.id === selectedPhoto.id) || 0;
                    const prevIndex = currentIndex > 0 ? currentIndex - 1 : (object?.photos.length || 1) - 1;
                    if (object?.photos[prevIndex]) {
                      setSelectedPhoto(object.photos[prevIndex]);
                      setTempSelectedFolder((object.photos[prevIndex] as any).folderId || null);
                    }
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
                >
                  ← Предыдущее
                </button>
                <button
                  onClick={async () => {
                    // Сначала сохраняем текущее назначение папки
                    if (selectedPhoto && tempSelectedFolder !== (selectedPhoto as any).folderId) {
                      await savePhotoFolderAssignment(selectedPhoto.id, tempSelectedFolder);
                    }
                    
                    // Затем переходим к следующему фото
                    const currentIndex = object?.photos.findIndex(p => p.id === selectedPhoto.id) || 0;
                    const nextIndex = currentIndex < (object?.photos.length || 1) - 1 ? currentIndex + 1 : 0;
                    if (object?.photos[nextIndex]) {
                      setSelectedPhoto(object.photos[nextIndex]);
                      setTempSelectedFolder((object.photos[nextIndex] as any).folderId || null);
                    }
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
                >
                  Следующее →
                </button>
              </div>
            </div>

            {/* Правая часть - Комментарии */}
            <div style={{
              width: "350px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              backgroundColor: "rgba(255,255,255,0.05)",
              borderRadius: "8px",
              padding: "16px",
              maxHeight: "80vh",
              overflow: "hidden"
            }}>
              {/* Селектор папки */}
              <div style={{
                padding: "12px",
                background: "rgba(211, 163, 115, 0.15)",
                borderRadius: "8px",
                border: "1px solid rgba(211, 163, 115, 0.3)"
              }}>
                <label style={{
                  display: "block",
                  fontSize: "0.85rem",
                  color: "rgba(255,255,255,0.9)",
                  marginBottom: "12px",
                  fontFamily: "Arial, sans-serif",
                  fontWeight: 600
                }}>
                  📁 Назначить в папку
                </label>
                
                {/* Список папок с галочками */}
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  maxHeight: "200px",
                  overflowY: "auto"
                }}>
                  {/* Опция "Не назначена" */}
                  <label style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 12px",
                    background: tempSelectedFolder === null 
                      ? "rgba(211, 163, 115, 0.2)" 
                      : "rgba(255, 255, 255, 0.05)",
                    borderRadius: "6px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    border: tempSelectedFolder === null 
                      ? "1px solid rgba(211, 163, 115, 0.5)" 
                      : "1px solid rgba(255, 255, 255, 0.1)"
                  }}>
                    <input
                      type="radio"
                      name="folder"
                      checked={tempSelectedFolder === null}
                      onChange={() => assignPhotoToFolder(selectedPhoto.id, null)}
                      style={{
                        accentColor: "#d3a373",
                        transform: "scale(1.1)"
                      }}
                    />
                    <span style={{
                      fontSize: "0.9rem",
                      color: "white",
                      fontFamily: "Arial, sans-serif"
                    }}>
                      📷 Не назначена
                    </span>
                  </label>

                  {/* Список папок */}
                  {folders.map((folder) => (
                    <label key={folder.id} style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "8px 12px",
                      background: tempSelectedFolder === folder.id 
                        ? "rgba(211, 163, 115, 0.2)" 
                        : "rgba(255, 255, 255, 0.05)",
                      borderRadius: "6px",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      border: tempSelectedFolder === folder.id 
                        ? "1px solid rgba(211, 163, 115, 0.5)" 
                        : "1px solid rgba(255, 255, 255, 0.1)"
                    }}>
                      <input
                        type="radio"
                        name="folder"
                        checked={tempSelectedFolder === folder.id}
                        onChange={() => assignPhotoToFolder(selectedPhoto.id, folder.id)}
                        style={{
                          accentColor: "#d3a373",
                          transform: "scale(1.1)"
                        }}
                      />
                      <span style={{
                        fontSize: "0.9rem",
                        color: "white",
                        fontFamily: "Arial, sans-serif"
                      }}>
                        📁 {folder.name}
                      </span>
                      <span style={{
                        fontSize: "0.75rem",
                        color: "rgba(255, 255, 255, 0.6)",
                        fontFamily: "Arial, sans-serif",
                        marginLeft: "auto"
                      }}>
                        ({folder.photoCount} фото)
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Заголовок комментариев */}
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid rgba(255,255,255,0.2)",
                paddingBottom: "12px"
              }}>
                <h3 style={{
                  color: "white",
                  fontSize: "1.1rem",
                  fontFamily: "Arial, sans-serif",
                  margin: 0
                }}>
                  Комментарии ({photoComments.length})
                </h3>
              </div>

              {/* Список комментариев */}
              <div style={{
                flex: "1",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: "12px"
              }}>
                {photoComments.map((comment) => (
                  <div
                    key={comment.id}
                    style={{
                      backgroundColor: comment.isAdminComment ? "rgba(59, 130, 246, 0.1)" : "rgba(255, 255, 255, 0.1)",
                      borderRadius: "8px",
                      padding: "12px",
                      border: `1px solid ${comment.isAdminComment ? "rgba(59, 130, 246, 0.3)" : "rgba(255, 255, 255, 0.1)"}`
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
                        color: comment.isAdminComment ? "rgba(59, 130, 246, 1)" : "rgba(34, 197, 94, 1)",
                        margin: 0,
                        fontWeight: "600"
                      }}>
                        {comment.isAdminComment ? "Команда" : (comment.user.name || comment.user.email)}
                      </p>
                      <p style={{
                        fontFamily: "Arial, sans-serif",
                        fontSize: "0.75rem",
                        color: "rgba(255,255,255,0.6)",
                        margin: 0
                      }}>
                        {new Date(comment.createdAt).toLocaleDateString('ru-RU', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <p style={{
                      fontFamily: "Arial, sans-serif",
                      fontSize: "0.9rem",
                      color: "white",
                      margin: 0,
                      lineHeight: "1.4"
                    }}>
                      {comment.content}
                    </p>
                  </div>
                ))}
                
                {photoComments.length === 0 && (
                  <div style={{
                    textAlign: "center",
                    color: "rgba(255,255,255,0.5)",
                    fontFamily: "Arial, sans-serif",
                    fontSize: "0.9rem",
                    padding: "20px"
                  }}>
                    Пока нет комментариев
                  </div>
                )}
              </div>

              {/* Форма добавления комментария */}
              <div style={{
                borderTop: "1px solid rgba(255,255,255,0.2)",
                paddingTop: "12px"
              }}>
                <textarea
                  value={newPhotoComment}
                  onChange={(e) => setNewPhotoComment(e.target.value)}
                  placeholder="Добавить комментарий..."
                  style={{
                    width: "100%",
                    minHeight: "60px",
                    padding: "8px",
                    borderRadius: "6px",
                    border: "1px solid rgba(255, 255, 255, 0.3)",
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    color: "white",
                    fontFamily: "Arial, sans-serif",
                    fontSize: "0.9rem",
                    resize: "vertical",
                    marginBottom: "8px"
                  }}
                />
                <button
                  onClick={sendPhotoComment}
                  disabled={!newPhotoComment.trim() || sendingPhotoComment}
                  style={{
                    width: "100%",
                    backgroundColor: (!newPhotoComment.trim() || sendingPhotoComment) ? "rgba(107, 114, 128, 0.5)" : "rgba(34, 197, 94, 0.8)",
                    border: "none",
                    color: "white",
                    padding: "8px 16px",
                    borderRadius: "6px",
                    fontSize: "0.9rem",
                    fontFamily: "Arial, sans-serif",
                    cursor: (!newPhotoComment.trim() || sendingPhotoComment) ? "not-allowed" : "pointer",
                    transition: "all 0.3s ease",
                    opacity: (!newPhotoComment.trim() || sendingPhotoComment) ? 0.6 : 1
                  }}
                >
                  {sendingPhotoComment ? "Отправка..." : "Отправить комментарий"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
}
