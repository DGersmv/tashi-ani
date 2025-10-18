"use client";

import React, { useState, useEffect } from "react";

interface User {
  id: number;
  email: string;
  name?: string;
  role: "MASTER" | "USER";
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  lastLogin?: string;
}

interface AdminUserListProps {
  token: string;
}

export default function AdminUserList({ token }: AdminUserListProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [isAddingUser, setIsAddingUser] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/users", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error("Ошибка загрузки пользователей");
      }

      const data = await response.json();
      if (data.success) {
        setUsers(data.users);
      } else {
        setError(data.message || "Ошибка загрузки пользователей");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Неизвестная ошибка");
    } finally {
      setLoading(false);
    }
  };

  const addUser = async () => {
    if (!newUserEmail.trim()) {
      setError("Email обязателен");
      return;
    }

    try {
      setIsAddingUser(true);
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: newUserEmail,
          name: newUserName || undefined
        })
      });

      const data = await response.json();
      if (data.success) {
        setNewUserEmail("");
        setNewUserName("");
        await fetchUsers(); // Обновляем список
        setError(null);
      } else {
        setError(data.message || "Ошибка добавления пользователя");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Неизвестная ошибка");
    } finally {
      setIsAddingUser(false);
    }
  };

  const deleteUser = async (userId: number) => {
    if (!confirm("Вы уверены, что хотите удалить этого пользователя?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users?id=${userId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      const data = await response.json();
      if (data.success) {
        await fetchUsers(); // Обновляем список
        setError(null);
      } else {
        setError(data.message || "Ошибка удаления пользователя");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Неизвестная ошибка");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ru-RU", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (loading) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "200px",
        color: "white"
      }}>
        <div style={{
          width: "40px",
          height: "40px",
          border: "4px solid rgba(255,255,255,0.3)",
          borderTop: "4px solid white",
          borderRadius: "50%",
          animation: "spin 1s linear infinite"
        }}></div>
      </div>
    );
  }

  return (
    <div style={{ color: "white" }}>
      <h2 style={{
        fontFamily: "ChinaCyr, sans-serif",
        fontSize: "2rem",
        marginBottom: "24px",
        textAlign: "center"
      }}>
        Управление пользователями
      </h2>

      {error && (
        <div style={{
          backgroundColor: "rgba(239, 68, 68, 0.1)",
          border: "1px solid rgba(239, 68, 68, 0.3)",
          borderRadius: "8px",
          padding: "12px",
          marginBottom: "20px",
          color: "#fca5a5"
        }}>
          {error}
        </div>
      )}

      {/* Форма добавления пользователя */}
      <div style={{
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        borderRadius: "12px",
        padding: "20px",
        marginBottom: "24px",
        backdropFilter: "blur(10px)"
      }}>
        <h3 style={{
          fontFamily: "ChinaCyr, sans-serif",
          fontSize: "1.2rem",
          marginBottom: "16px"
        }}>
          Добавить пользователя
        </h3>
        
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <input
            type="email"
            placeholder="Email пользователя"
            value={newUserEmail}
            onChange={(e) => setNewUserEmail(e.target.value)}
            style={{
              flex: "1",
              minWidth: "200px",
              padding: "10px 12px",
              borderRadius: "6px",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              color: "white",
              fontFamily: "Arial, sans-serif"
            }}
          />
          <input
            type="text"
            placeholder="Имя (необязательно)"
            value={newUserName}
            onChange={(e) => setNewUserName(e.target.value)}
            style={{
              flex: "1",
              minWidth: "200px",
              padding: "10px 12px",
              borderRadius: "6px",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              color: "white",
              fontFamily: "Arial, sans-serif"
            }}
          />
          <button
            onClick={addUser}
            disabled={isAddingUser || !newUserEmail.trim()}
            style={{
              padding: "10px 20px",
              borderRadius: "6px",
              border: "none",
              backgroundColor: isAddingUser ? "rgba(255, 255, 255, 0.3)" : "rgba(211, 163, 115, 0.8)",
              color: "white",
              fontFamily: "ChinaCyr, sans-serif",
              fontWeight: "600",
              cursor: isAddingUser ? "not-allowed" : "pointer",
              transition: "all 0.2s ease"
            }}
          >
            {isAddingUser ? "Добавление..." : "Добавить"}
          </button>
        </div>
      </div>

      {/* Список пользователей */}
      <div style={{
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        borderRadius: "12px",
        padding: "20px",
        backdropFilter: "blur(10px)"
      }}>
        <h3 style={{
          fontFamily: "ChinaCyr, sans-serif",
          fontSize: "1.2rem",
          marginBottom: "16px"
        }}>
          Пользователи ({users.length})
        </h3>

        {users.length === 0 ? (
          <p style={{ color: "rgba(255, 255, 255, 0.6)", textAlign: "center" }}>
            Пользователи не найдены
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {users.map((user) => (
              <div
                key={user.id}
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                  padding: "16px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  border: "1px solid rgba(255, 255, 255, 0.1)"
                }}
              >
                <div style={{ flex: "1" }}>
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    marginBottom: "8px"
                  }}>
                    <span style={{
                      fontFamily: "ChinaCyr, sans-serif",
                      fontWeight: "600",
                      fontSize: "1.1rem"
                    }}>
                      {user.name || user.email}
                    </span>
                    <span style={{
                      backgroundColor: user.role === "MASTER" ? "rgba(239, 68, 68, 0.2)" : "rgba(34, 197, 94, 0.2)",
                      color: user.role === "MASTER" ? "#fca5a5" : "#86efac",
                      padding: "2px 8px",
                      borderRadius: "4px",
                      fontSize: "0.8rem",
                      fontFamily: "Arial, sans-serif"
                    }}>
                      {user.role === "MASTER" ? "Админ" : "Пользователь"}
                    </span>
                    <span style={{
                      backgroundColor: user.status === "ACTIVE" ? "rgba(34, 197, 94, 0.2)" : "rgba(107, 114, 128, 0.2)",
                      color: user.status === "ACTIVE" ? "#86efac" : "#9ca3af",
                      padding: "2px 8px",
                      borderRadius: "4px",
                      fontSize: "0.8rem",
                      fontFamily: "Arial, sans-serif"
                    }}>
                      {user.status === "ACTIVE" ? "Активен" : "Неактивен"}
                    </span>
                  </div>
                  <div style={{
                    fontSize: "0.9rem",
                    color: "rgba(255, 255, 255, 0.7)",
                    fontFamily: "Arial, sans-serif"
                  }}>
                    <div>Email: {user.email}</div>
                    <div>Создан: {formatDate(user.createdAt)}</div>
                    {user.lastLogin && (
                      <div>Последний вход: {formatDate(user.lastLogin)}</div>
                    )}
                  </div>
                </div>
                
                {user.role !== "MASTER" && (
                  <button
                    onClick={() => deleteUser(user.id)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: "6px",
                      border: "none",
                      backgroundColor: "rgba(239, 68, 68, 0.8)",
                      color: "white",
                      fontFamily: "Arial, sans-serif",
                      fontWeight: "500",
                      cursor: "pointer",
                      transition: "all 0.2s ease"
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 1)";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.8)";
                    }}
                  >
                    Удалить
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

