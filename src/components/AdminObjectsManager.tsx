"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useViewMode } from "./ui/ViewMode";

interface Object {
  id: number;
  title: string;
  description?: string;
  address?: string;
  status: string;
  createdAt: string;
  projectsCount: number;
  photosCount: number;
  documentsCount: number;
  messagesCount: number;
}

interface Customer {
  id: number;
  email: string;
  name: string;
}

interface AdminObjectsManagerProps {
  adminToken: string;
}

export default function AdminObjectsManager({ adminToken }: AdminObjectsManagerProps) {
  const { setMode } = useViewMode();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [objects, setObjects] = useState<Object[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newObjectTitle, setNewObjectTitle] = useState("");
  const [newObjectDescription, setNewObjectDescription] = useState("");
  const [newObjectAddress, setNewObjectAddress] = useState("");
  const [isAddingObject, setIsAddingObject] = useState(false);

  useEffect(() => {
    // Получаем информацию о заказчике из localStorage
    const customerData = localStorage.getItem('adminViewingCustomer');
    if (customerData) {
      setCustomer(JSON.parse(customerData));
    }
  }, []);

  const fetchObjects = async () => {
    if (!customer) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/users/${customer.id}`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        // Преобразуем данные из API в нужный формат
        const objectsWithCounts = data.user.objects.map((obj: any) => ({
          id: obj.id,
          title: obj.title,
          description: obj.description,
          address: obj.address,
          status: obj.status,
          createdAt: obj.createdAt,
          projectsCount: obj._count?.projects || 0,
          photosCount: obj._count?.photos || 0,
          documentsCount: obj._count?.documents || 0,
          messagesCount: obj._count?.messages || 0,
        }));
        setObjects(objectsWithCounts);
      } else {
        setError(data.message || "Не удалось загрузить объекты");
      }
    } catch (err) {
      console.error('Ошибка загрузки объектов:', err);
      setError("Ошибка сети при загрузке объектов");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (customer) {
      fetchObjects();
    }
  }, [customer]);

  const handleAddObject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;
    
    setIsAddingObject(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/objects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ 
          userId: customer.id,
          title: newObjectTitle,
          description: newObjectDescription,
          address: newObjectAddress
        }),
      });
      const data = await response.json();
      if (data.success) {
        setNewObjectTitle("");
        setNewObjectDescription("");
        setNewObjectAddress("");
        setShowAddForm(false);
        fetchObjects(); // Обновляем список
      } else {
        setError(data.message || "Не удалось добавить объект");
      }
    } catch (err) {
      setError("Ошибка сети при добавлении объекта");
    } finally {
      setIsAddingObject(false);
    }
  };

  const handleDeleteObject = async (id: number) => {
    if (!window.confirm("Вы уверены, что хотите удалить этот объект?")) return;
    setError(null);
    try {
      const response = await fetch("/api/admin/objects", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ id }),
      });
      const data = await response.json();
      if (data.success) {
        fetchObjects(); // Обновляем список
      } else {
        setError(data.message || "Не удалось удалить объект");
      }
    } catch (err) {
      setError("Ошибка сети при удалении объекта");
    }
  };

  const handleViewObjectDetail = (objectId: number) => {
    // Сохраняем ID объекта в localStorage и переходим к детальному просмотру
    localStorage.setItem('selectedAdminObjectId', objectId.toString());
    setMode("admin-object-detail");
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
        return 'rgba(59, 130, 246, 0.8)';
      case 'INACTIVE':
        return 'rgba(239, 68, 68, 0.8)';
      case 'ARCHIVED':
        return 'rgba(156, 163, 175, 0.8)';
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
        <p style={{ fontFamily: "Arial, sans-serif" }}>Загрузка объектов...</p>
      </div>
    );
  }

  if (!customer) {
    return (
      <div style={{
        backgroundColor: "rgba(239, 68, 68, 0.1)",
        borderRadius: "12px",
        padding: "24px",
        textAlign: "center",
        color: "white",
        backdropFilter: "blur(10px)"
      }}>
        <p style={{ fontFamily: "Arial, sans-serif" }}>❌ Информация о заказчике не найдена</p>
        <button
          onClick={() => setMode("admin-dashboard")}
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
          ← Назад к заказчикам
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", paddingTop: "150px" }}>
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
            onClick={() => setMode("admin-dashboard")}
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
            Объекты заказчика: {customer.name}
          </h2>
        </div>
        <p style={{
          fontFamily: "Arial, sans-serif",
          fontSize: "1rem",
          color: "rgba(255,255,255,0.8)",
          margin: 0,
          marginLeft: "48px"
        }}>
          {customer.email}
        </p>
      </div>

      {/* Кнопка добавления объекта */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "32px",
        marginLeft: "48px"
      }}>
        <h3 style={{
          fontFamily: "ChinaCyr, sans-serif",
          fontSize: "1.5rem",
          color: "white",
          margin: 0
        }}>
          Объекты ({objects.length})
        </h3>
        
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          style={{
            padding: "12px 24px",
            borderRadius: "8px",
            border: "none",
            background: "rgba(34, 197, 94, 0.8)",
            color: "white",
            fontFamily: "ChinaCyr, sans-serif",
            fontSize: "1rem",
            fontWeight: "600",
            cursor: "pointer",
            transition: "all 0.2s",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = "rgba(34, 197, 94, 1)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = "rgba(34, 197, 94, 0.8)";
          }}
        >
          + Добавить объект
        </button>
      </div>

      {/* Форма добавления объекта */}
      {showAddForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          style={{
            background: "rgba(255,255,255,0.1)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: 16,
            padding: 24,
            marginBottom: 32,
            marginLeft: "48px",
            color: "white"
          }}
        >
          <h3 style={{
            fontFamily: "ChinaCyr, sans-serif",
            fontSize: "1.5rem",
            marginBottom: 20,
            textAlign: "center"
          }}>
            Добавить новый объект
          </h3>
          
          <form onSubmit={handleAddObject} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <input
              type="text"
              placeholder="Название объекта"
              value={newObjectTitle}
              onChange={(e) => setNewObjectTitle(e.target.value)}
              required
              style={{
                padding: "12px 16px",
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.3)",
                background: "rgba(255,255,255,0.1)",
                color: "white",
                fontSize: "1rem",
                fontFamily: "Arial, sans-serif"
              }}
            />
            <input
              type="text"
              placeholder="Описание объекта (необязательно)"
              value={newObjectDescription}
              onChange={(e) => setNewObjectDescription(e.target.value)}
              style={{
                padding: "12px 16px",
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.3)",
                background: "rgba(255,255,255,0.1)",
                color: "white",
                fontSize: "1rem",
                fontFamily: "Arial, sans-serif"
              }}
            />
            <input
              type="text"
              placeholder="Адрес объекта (необязательно)"
              value={newObjectAddress}
              onChange={(e) => setNewObjectAddress(e.target.value)}
              style={{
                padding: "12px 16px",
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.3)",
                background: "rgba(255,255,255,0.1)",
                color: "white",
                fontSize: "1rem",
                fontFamily: "Arial, sans-serif"
              }}
            />
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                style={{
                  padding: "12px 24px",
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.3)",
                  background: "transparent",
                  color: "white",
                  fontSize: "1rem",
                  cursor: "pointer"
                }}
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={isAddingObject}
                style={{
                  padding: "12px 24px",
                  borderRadius: 8,
                  border: "none",
                  background: isAddingObject ? "rgba(34, 197, 94, 0.5)" : "rgba(34, 197, 94, 0.8)",
                  color: "white",
                  fontSize: "1rem",
                  cursor: isAddingObject ? "not-allowed" : "pointer"
                }}
              >
                {isAddingObject ? "Добавляем..." : "Добавить"}
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Ошибки */}
      {error && (
        <div style={{
          background: "rgba(239, 68, 68, 0.1)",
          border: "1px solid rgba(239, 68, 68, 0.3)",
          borderRadius: 8,
          padding: 16,
          marginBottom: 24,
          marginLeft: "48px",
          color: "#ef4444",
          fontFamily: "Arial, sans-serif"
        }}>
          {error}
        </div>
      )}

      {/* Сетка объектов */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
        gap: "24px",
        paddingLeft: "48px"
      }}>
        {objects.length === 0 ? (
          <div style={{
            gridColumn: "1 / -1",
            textAlign: "center",
            color: "rgba(255,255,255,0.6)",
            padding: "60px 20px",
            fontFamily: "Arial, sans-serif"
          }}>
            <p style={{ fontSize: "1.2rem", marginBottom: "16px" }}>Объекты не найдены</p>
            <p>Нажмите "Добавить объект" чтобы создать первый</p>
          </div>
        ) : (
          objects.map((object, index) => (
            <motion.div
              key={object.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.1)",
                borderRadius: "16px",
                padding: "24px",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                transition: "all 0.3s ease",
                cursor: "pointer"
              }}
              onClick={() => handleViewObjectDetail(object.id)}
              whileHover={{
                scale: 1.02,
                backgroundColor: "rgba(255, 255, 255, 0.15)"
              }}
            >
              {/* Заголовок объекта */}
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "12px"
              }}>
                <h3 style={{
                  fontFamily: "ChinaCyr, sans-serif",
                  fontSize: "1.3rem",
                  color: "rgba(211, 163, 115, 1)",
                  margin: 0,
                  flex: 1
                }}>
                  {object.title}
                </h3>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteObject(object.id);
                  }}
                  style={{
                    background: "rgba(239, 68, 68, 0.8)",
                    border: "none",
                    color: "white",
                    borderRadius: "50%",
                    width: "28px",
                    height: "28px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "16px",
                    marginLeft: "12px",
                    transition: "all 0.2s"
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = "rgba(239, 68, 68, 1)";
                    e.currentTarget.style.transform = "scale(1.1)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = "rgba(239, 68, 68, 0.8)";
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                  title="Удалить объект"
                >
                  ×
                </button>
              </div>

              {/* Описание объекта */}
              {object.description && (
                <p style={{
                  fontSize: "0.9rem",
                  color: "rgba(255,255,255,0.8)",
                  marginBottom: "12px",
                  fontFamily: "Arial, sans-serif"
                }}>
                  {object.description}
                </p>
              )}

              {/* Адрес объекта */}
              {object.address && (
                <p style={{
                  fontSize: "0.9rem",
                  color: "rgba(255,255,255,0.7)",
                  marginBottom: "12px",
                  fontFamily: "Arial, sans-serif"
                }}>
                  📍 {object.address}
                </p>
              )}

              {/* Статус и дата создания */}
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px"
              }}>
                <div style={{
                  backgroundColor: getStatusColor(object.status),
                  color: "white",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  fontSize: "0.75rem",
                  fontFamily: "Arial, sans-serif",
                  fontWeight: "600"
                }}>
                  {object.status}
                </div>
                <div style={{
                  fontSize: "0.75rem",
                  color: "rgba(255,255,255,0.6)",
                  fontFamily: "Arial, sans-serif"
                }}>
                  {formatDate(object.createdAt)}
                </div>
              </div>

              {/* Статистика */}
              <div style={{
                borderTop: "1px solid rgba(255,255,255,0.2)",
                paddingTop: "16px"
              }}>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "8px"
                }}>
                  <div style={{
                    fontSize: "0.85rem",
                    color: "rgba(255,255,255,0.8)",
                    fontFamily: "Arial, sans-serif"
                  }}>
                    Проектов: {object.projectsCount}
                  </div>
                  <div style={{
                    fontSize: "0.85rem",
                    color: "rgba(255,255,255,0.8)",
                    fontFamily: "Arial, sans-serif"
                  }}>
                    Фото: {object.photosCount}
                  </div>
                  <div style={{
                    fontSize: "0.85rem",
                    color: "rgba(255,255,255,0.8)",
                    fontFamily: "Arial, sans-serif"
                  }}>
                    Документов: {object.documentsCount}
                  </div>
                  <div style={{
                    fontSize: "0.85rem",
                    color: "rgba(255,255,255,0.8)",
                    fontFamily: "Arial, sans-serif"
                  }}>
                    Сообщений: {object.messagesCount}
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
