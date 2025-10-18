"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface LoginPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (email: string, isAdmin?: boolean) => void;
}

export default function LoginPanel({ isOpen, onClose, onLoginSuccess }: LoginPanelProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isHuman, setIsHuman] = useState(false);
  const [step, setStep] = useState<"email" | "code" | "password">("email");
  const [verificationCode, setVerificationCode] = useState("");
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

  // Автоматическое скрытие сообщений через 5 секунд (кроме success, которые скрываются сами)
  useEffect(() => {
    if (message && message.type !== "success") {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === "email") {
      if (!email || !isHuman) return;
      
      setIsSubmitting(true);
      setMessage(null);
      
      try {
        // Проверяем, является ли это мастер-админом
        if (email === "2277277@bk.ru") {
          setStep("password");
          setMessage({ type: "info", text: "Введите пароль для мастер-админа" });
          setIsSubmitting(false);
          return;
        }
        
        setMessage({ type: "info", text: "Отправляем код на ваш email..." });
        
        // Отправляем код на email
        const response = await fetch("/api/auth/send-code", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        });

        if (response.ok) {
          const result = await response.json();
          setMessage({ type: "success", text: "Код отправлен! Проверьте ваш email или консоль браузера." });
          setIsCodeSent(true);
          setStep("code");
        } else {
          setMessage({ type: "error", text: "Ошибка отправки кода. Попробуйте еще раз." });
        }
      } catch (error) {
        setMessage({ type: "error", text: "Ошибка подключения. Проверьте интернет-соединение." });
      } finally {
        setIsSubmitting(false);
      }
    } else if (step === "password") {
      // Проверяем пароль мастер-админа
      if (!password || !isHuman) return;
      
      setIsSubmitting(true);
      setMessage(null);
      
      try {
        setMessage({ type: "info", text: "Проверяем пароль..." });
        
        const response = await fetch("/api/auth/master-login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        });

        const result = await response.json();
        
        if (result.success) {
          setMessage({ type: "success", text: "Успешный вход в админ панель!" });
          // Сохраняем токен для админа
          if (result.token) {
            localStorage.setItem('adminToken', result.token);
          }
          setTimeout(() => {
            onClose();
            onLoginSuccess(email, true);
          }, 1500);
        } else {
          setMessage({ type: "error", text: result.message || "Неверный пароль" });
        }
      } catch (error) {
        setMessage({ type: "error", text: "Ошибка подключения. Проверьте интернет-соединение." });
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Проверяем код
      if (!verificationCode) return;
      
      setIsSubmitting(true);
      setMessage(null);
      
      try {
        setMessage({ type: "info", text: "Проверяем код..." });
        
        const response = await fetch("/api/auth/verify-code", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, code: verificationCode }),
        });

        if (response.ok) {
          setMessage({ type: "success", text: "Успешная аутентификация! Переходим в личный кабинет..." });
          setTimeout(() => {
            onClose();
            onLoginSuccess(email, false);
          }, 1500);
        } else {
          const errorData = await response.json();
          setMessage({ type: "error", text: errorData.error || "Неверный код. Попробуйте еще раз." });
        }
      } catch (error) {
        setMessage({ type: "error", text: "Ошибка подключения. Проверьте интернет-соединение." });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleBackToEmail = () => {
    setStep("email");
    setVerificationCode("");
    setPassword("");
    setIsCodeSent(false);
    setMessage(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
          onClick={handleBackdropClick}
        >
          {/* Затемняющий фон */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(4px)"
            }}
          />

          {/* Панель входа */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 30,
              duration: 0.4 
            }}
            style={{
              position: "relative",
              width: "100%",
              maxWidth: "400px",
              margin: "0 16px"
            }}
          >
            <div
              style={{
                position: "relative",
                width: "100%",
                aspectRatio: "1 / 1.41",
                borderRadius: 16,
                overflow: "hidden",
                background: "rgba(255,255,255,0.15)",
                backdropFilter: "blur(28px)",
                border: "2.5px solid rgba(211,163,115,0.6)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 8px 24px rgba(0,0,0,.25), inset 0 0 0 1px rgba(255,255,255,.22)"
              }}
            >
              {/* Кнопка закрытия */}
              <button
                onClick={onClose}
                style={{
                  position: "absolute",
                  top: 16,
                  right: 16,
                  width: 32,
                  height: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "rgba(255,255,255,0.7)",
                  backgroundColor: "transparent",
                  border: "none",
                  borderRadius: "50%",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  zIndex: 10
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "white";
                  e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "rgba(255,255,255,0.7)";
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>

              {/* Содержимое панели */}
              <div
                style={{
                  position: "relative",
                  zIndex: 2,
                  width: "100%",
                  padding: "24px 20px",
                  color: "white",
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                  height: "100%",
                  justifyContent: "center"
                }}
              >
                {/* Заголовок */}
                <div style={{ textAlign: "center" }}>
                  <h2 
                    style={{ 
                      fontFamily: "ChinaCyr, sans-serif",
                      fontWeight: 800,
                      fontSize: "1.25rem",
                      lineHeight: 1.2,
                      margin: "0 0 8px 0",
                      color: "white"
                    }}
                  >
                    {step === "email" ? "Вход в систему" : "Подтверждение кода"}
                  </h2>
                  <p style={{ 
                    fontSize: "14px",
                    color: "rgba(255,255,255,0.8)",
                    margin: 0
                  }}>
                    {step === "email" 
                      ? "Введите ваш email для входа" 
                      : `Код отправлен на ${email}`
                    }
                  </p>
                </div>

                {/* Сообщения */}
                <AnimatePresence>
                  {message && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      style={{
                        padding: "12px 16px",
                        borderRadius: "8px",
                        fontSize: "14px",
                        fontFamily: "Arial, sans-serif",
                        background: message.type === "success" 
                          ? "rgba(34, 197, 94, 0.2)" 
                          : message.type === "error" 
                          ? "rgba(239, 68, 68, 0.2)" 
                          : "rgba(59, 130, 246, 0.2)",
                        border: `1px solid ${
                          message.type === "success" 
                            ? "rgba(34, 197, 94, 0.5)" 
                            : message.type === "error" 
                            ? "rgba(239, 68, 68, 0.5)" 
                            : "rgba(59, 130, 246, 0.5)"
                        }`,
                        color: message.type === "success" 
                          ? "#22c55e" 
                          : message.type === "error" 
                          ? "#ef4444" 
                          : "#3b82f6",
                        position: "relative",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between"
                      }}
                    >
                      <span style={{ flex: 1, textAlign: "center" }}>
                        {message.text}
                      </span>
                      {message.type === "error" && (
                        <button
                          onClick={() => setMessage(null)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "inherit",
                            cursor: "pointer",
                            padding: "0",
                            marginLeft: "8px",
                            fontSize: "16px",
                            opacity: 0.7,
                            transition: "opacity 0.2s"
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
                          onMouseLeave={(e) => e.currentTarget.style.opacity = "0.7"}
                        >
                          ×
                        </button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Форма */}
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {step === "email" ? (
                    <div>
                      <label 
                        htmlFor="email"
                        style={{
                          display: "block",
                          color: "rgba(255,255,255,0.9)",
                          fontSize: "14px",
                          fontWeight: 500,
                          marginBottom: "8px"
                        }}
                      >
                        Электронная почта
                      </label>
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="example@email.com"
                        required
                        style={{
                          width: "100%",
                          padding: "12px 16px",
                          background: "rgba(255,255,255,0.1)",
                          backdropFilter: "blur(10px)",
                          border: "1px solid rgba(255,255,255,0.2)",
                          borderRadius: 12,
                          color: "white",
                          fontSize: "14px",
                          fontFamily: "Arial, sans-serif",
                          outline: "none"
                        }}
                      />
                    </div>
                  ) : step === "password" ? (
                    <div>
                      <label 
                        htmlFor="password"
                        style={{
                          display: "block",
                          color: "rgba(255,255,255,0.9)",
                          fontSize: "14px",
                          fontWeight: 500,
                          marginBottom: "8px"
                        }}
                      >
                        Пароль мастер-админа
                      </label>
                      <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Введите пароль"
                        required
                        style={{
                          width: "100%",
                          padding: "12px 16px",
                          background: "rgba(255,255,255,0.1)",
                          backdropFilter: "blur(10px)",
                          border: "1px solid rgba(255,255,255,0.2)",
                          borderRadius: 12,
                          color: "white",
                          fontSize: "14px",
                          fontFamily: "Arial, sans-serif",
                          outline: "none"
                        }}
                      />
                    </div>
                  ) : (
                    <div>
                      <label 
                        htmlFor="code"
                        style={{
                          display: "block",
                          color: "rgba(255,255,255,0.9)",
                          fontSize: "14px",
                          fontWeight: 500,
                          marginBottom: "8px"
                        }}
                      >
                        Код подтверждения
                      </label>
                      <input
                        type="text"
                        id="code"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        placeholder="Введите 6-значный код"
                        required
                        maxLength={6}
                        style={{
                          width: "100%",
                          padding: "12px 16px",
                          background: "rgba(255,255,255,0.1)",
                          backdropFilter: "blur(10px)",
                          border: "1px solid rgba(255,255,255,0.2)",
                          borderRadius: 12,
                          color: "white",
                          fontSize: "14px",
                          fontFamily: "Arial, sans-serif",
                          outline: "none",
                          textAlign: "center",
                          letterSpacing: "2px"
                        }}
                      />
                    </div>
                  )}

                  {/* Капча "Я не робот" - только на первом шаге */}
                  {step === "email" && (
                    <div 
                      style={{ 
                        display: "flex", 
                        alignItems: "center", 
                        gap: 12,
                        padding: "12px 16px",
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.15)",
                        borderRadius: 8,
                        cursor: "pointer",
                        transition: "all 0.2s"
                      }}
                      onClick={() => setIsHuman(!isHuman)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                        e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                        e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
                      }}
                    >
                      <input
                        type="checkbox"
                        id="isHuman"
                        checked={isHuman}
                        onChange={(e) => setIsHuman(e.target.checked)}
                        style={{
                          width: 18,
                          height: 18,
                          accentColor: "rgba(211, 163, 115, 0.8)",
                          cursor: "pointer",
                          margin: 0
                        }}
                      />
                      
                      {/* Иконка щита */}
                      <div style={{ 
                        width: 20, 
                        height: 20,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}>
                        <svg 
                          width="16" 
                          height="16" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke={isHuman ? "rgba(211, 163, 115, 0.8)" : "rgba(255,255,255,0.6)"}
                          strokeWidth="2"
                        >
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                          <path d="M9 12l2 2 4-4"/>
                        </svg>
                      </div>

                      <label
                        htmlFor="isHuman"
                        style={{
                          color: "rgba(255,255,255,0.9)",
                          fontSize: "14px",
                          fontFamily: "Arial, sans-serif",
                          cursor: "pointer",
                          userSelect: "none",
                          margin: 0,
                          flex: 1
                        }}
                      >
                        Я не робот
                      </label>

                      {/* Дополнительная иконка */}
                      <div style={{ 
                        fontSize: "12px",
                        color: "rgba(255,255,255,0.5)",
                        fontFamily: "Arial, sans-serif"
                      }}>
                        reCAPTCHA
                      </div>
                    </div>
                  )}

                  {/* Кнопка "Назад" для второго шага */}
                  {(step === "code" || step === "password") && (
                    <button
                      type="button"
                      onClick={handleBackToEmail}
                      style={{
                        width: "100%",
                        padding: "8px 16px",
                        background: "transparent",
                        border: "1px solid rgba(255,255,255,0.3)",
                        borderRadius: 8,
                        color: "rgba(255,255,255,0.8)",
                        fontWeight: 500,
                        fontSize: "14px",
                        fontFamily: "ChinaCyr, sans-serif",
                        cursor: "pointer",
                        transition: "all 0.2s"
                      }}
                    >
                      ← Изменить email
                    </button>
                  )}

                  <button
                    type="submit"
                    disabled={
                      step === "email" 
                        ? (!email || !isHuman || isSubmitting)
                        : step === "password"
                        ? (!password || !isHuman || isSubmitting)
                        : (!verificationCode || isSubmitting)
                    }
                    style={{
                      width: "100%",
                      padding: "12px 24px",
                      background: "rgba(211, 163, 115, 0.8)",
                      border: "none",
                      borderRadius: 12,
                      color: "white",
                      fontWeight: 600,
                      fontSize: "14px",
                      fontFamily: "ChinaCyr, sans-serif",
                      cursor: (
                        step === "email" 
                          ? (email && isHuman && !isSubmitting)
                          : step === "password"
                          ? (password && isHuman && !isSubmitting)
                          : (verificationCode && !isSubmitting)
                      ) ? "pointer" : "not-allowed",
                      opacity: (
                        step === "email" 
                          ? (email && isHuman ? 1 : 0.6)
                          : step === "password"
                          ? (password && isHuman ? 1 : 0.6)
                          : (verificationCode ? 1 : 0.6)
                      ),
                      transition: "all 0.2s"
                    }}
                  >
                    {isSubmitting ? (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                        <div style={{
                          width: "16px",
                          height: "16px",
                          border: "2px solid rgba(255,255,255,0.3)",
                          borderTop: "2px solid white",
                          borderRadius: "50%",
                          animation: "spin 1s linear infinite"
                        }}></div>
                        <span>
                          {step === "email" ? "Отправляем..." : 
                           step === "password" ? "Проверяем пароль..." : 
                           "Проверяем..."}
                        </span>
                      </div>
                    ) : (
                      step === "email" ? "Отправить код" : 
                      step === "password" ? "Войти" : 
                      "Подтвердить"
                    )}
                  </button>
                </form>

                {/* Дополнительная информация */}
                <div style={{ textAlign: "center" }}>
                  <p style={{
                    fontSize: "12px",
                    color: "rgba(255,255,255,0.6)",
                    margin: 0
                  }}>
                    {step === "email" 
                      ? 'Нажимая "Отправить код", вы соглашаетесь с нашими условиями использования'
                      : "Проверьте папку 'Спам', если код не пришел"
                    }
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}