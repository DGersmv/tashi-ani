"use client";

import React from "react";
import dynamic from "next/dynamic";
import { MarkersPlugin } from "@photo-sphere-viewer/markers-plugin";

const ReactPhotoSphereViewer = dynamic<any>(
  () =>
    import("react-photo-sphere-viewer").then((mod: any) =>
      mod.ReactPhotoSphereViewer ? mod.ReactPhotoSphereViewer : mod.default
    ),
  { ssr: false }
);

interface PanoramaComment {
  id: number;
  content: string;
  createdAt: string;
  yaw: number | null;
  pitch: number | null;
  isAdminComment: boolean;
  user: {
    name?: string | null;
    email: string;
  };
}

interface Panorama {
  id: number;
  filename: string;
  originalName: string;
  uploadedAt: string;
  mimeType?: string | null;
  url?: string;
  unreadCommentsCount?: number;
  comments?: PanoramaComment[];
}

interface CustomerPanoramasSectionProps {
  objectId: number;
  userEmail: string;
  panoramas: Panorama[];
  onCommentsRead?: (panoramaId: number) => void;
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("ru-RU", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const toDegrees = (radians: number) => {
  return Math.round((radians * 180) / Math.PI);
};

export default function CustomerPanoramasSection({
  objectId,
  userEmail,
  panoramas,
  onCommentsRead,
}: CustomerPanoramasSectionProps) {
  const [panoramaUrls, setPanoramaUrls] = React.useState<Record<string, string>>({});
  const [missingPanoramaIds, setMissingPanoramaIds] = React.useState<Set<number>>(new Set());
  const [panoramasReady, setPanoramasReady] = React.useState(false);
  const [selectedPanorama, setSelectedPanorama] = React.useState<Panorama | null>(null);
  const [panoramaComments, setPanoramaComments] = React.useState<PanoramaComment[]>([]);
  const [newPanoramaComment, setNewPanoramaComment] = React.useState("");
  const [sendingPanoramaComment, setSendingPanoramaComment] = React.useState(false);
  const [pendingPanoramaCoords, setPendingPanoramaCoords] = React.useState<{ yaw: number; pitch: number } | null>(null);
  const [selectedPanoramaCommentId, setSelectedPanoramaCommentId] = React.useState<number | null>(null);
  const panoramaViewerRef = React.useRef<any>(null);
  const [markersPluginInstance, setMarkersPluginInstance] = React.useState<any>(null);
  const panoramaCommentsReadRef = React.useRef<Set<number>>(new Set());

  React.useEffect(() => {
    let isMounted = true;

    const loadPanoramaFiles = async () => {
      setPanoramasReady(false);
      const newUrls: Record<string, string> = {};
      const missing = new Set<number>();

      for (const panorama of panoramas) {
        if (!(panorama.mimeType || "").startsWith("image/")) {
          continue;
        }

        const requestUrl = `/api/uploads/objects/${objectId}/panoramas/${panorama.filename}?email=${encodeURIComponent(userEmail)}`;

        try {
          const response = await fetch(requestUrl, {
            method: "GET",
            cache: "no-store",
          });

          if (!response.ok) {
            console.warn(`Панорама ${panorama.filename} недоступна (status ${response.status}).`);
            missing.add(panorama.id);
            continue;
          }

          const blob = await response.blob();
          const objectUrl = URL.createObjectURL(blob);
          newUrls[panorama.filename] = objectUrl;
        } catch (error) {
          console.error(`Ошибка загрузки панорамы ${panorama.filename}:`, error);
          missing.add(panorama.id);
        }
      }

      if (!isMounted) return;

      setPanoramaUrls((prev) => {
        Object.values(prev).forEach((url) => {
          if (url.startsWith("blob:")) {
            URL.revokeObjectURL(url);
          }
        });
        return newUrls;
      });
      setMissingPanoramaIds(missing);
      setPanoramasReady(true);
    };

    if (panoramas?.length) {
      loadPanoramaFiles();
    } else {
      setPanoramasReady(true);
      setPanoramaUrls((prev) => {
        Object.values(prev).forEach((url) => {
          if (url.startsWith("blob:")) {
            URL.revokeObjectURL(url);
          }
        });
        return {};
      });
      setMissingPanoramaIds(new Set());
    }

    return () => {
      isMounted = false;
    };
  }, [objectId, userEmail, panoramas]);

  React.useEffect(() => {
    return () => {
      Object.values(panoramaUrls).forEach((url) => {
        if (url.startsWith("blob:")) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [panoramaUrls]);

  React.useEffect(() => {
    if (!selectedPanorama) {
      setPanoramaComments([]);
      setNewPanoramaComment("");
      setPendingPanoramaCoords(null);
      setSelectedPanoramaCommentId(null);
      panoramaCommentsReadRef.current.delete(selectedPanorama?.id || -1);
      return;
    }

    const updatedPanorama = panoramas.find((p) => p.id === selectedPanorama.id);
    if (updatedPanorama) {
      setSelectedPanorama((prev) => (prev ? { ...prev, ...updatedPanorama } : updatedPanorama));
    }

    fetchPanoramaComments(selectedPanorama.id);
  }, [selectedPanorama?.id, panoramas]);

  const panoramaMarkers = React.useMemo(() => {
    if (!selectedPanorama) return [];

    return panoramaComments
      .filter((comment) => Number.isFinite(comment.yaw) && Number.isFinite(comment.pitch))
      .map((comment) => ({
        id: `panorama-comment-${comment.id}`,
        longitude: comment.yaw as number,
        latitude: comment.pitch as number,
        position: { yaw: comment.yaw as number, pitch: comment.pitch as number },
        html: `<div style="padding:6px;font-size:12px;max-width:180px;">${comment.isAdminComment ? "<strong>Команда:</strong>" : "<strong>Вы:</strong>"}<br/>${comment.content}</div>`,
        data: { commentId: comment.id },
        size: 32,
      }));
  }, [panoramaComments, selectedPanorama]);

  React.useEffect(() => {
    if (!markersPluginInstance) return;

    markersPluginInstance.clearMarkers();
    markersPluginInstance.addMarkers(panoramaMarkers);

    const handleSelectMarker = (marker: any) => {
      const commentId = marker?.config?.data?.commentId;
      if (commentId) {
        setSelectedPanoramaCommentId(commentId);
        setPendingPanoramaCoords({ yaw: marker.config.longitude, pitch: marker.config.latitude });
      }
    };

    markersPluginInstance.on("select-marker", handleSelectMarker);

    return () => {
      markersPluginInstance.off("select-marker", handleSelectMarker);
    };
  }, [markersPluginInstance, panoramaMarkers]);

  const panoramaViewerPlugins = React.useMemo(() => {
    return [[MarkersPlugin, { markers: panoramaMarkers }]];
  }, [panoramaMarkers]);

  const fetchPanoramaComments = async (panoramaId: number) => {
    try {
      const response = await fetch(`/api/panorama-comments?panoramaId=${panoramaId}`);
      const data = await response.json();
      if (data.success) {
        const normalized = Array.isArray(data.comments)
          ? data.comments.map((comment: any) => {
              const rawYaw = typeof comment?.yaw === "number" ? comment.yaw : Number(comment?.yaw);
              const rawPitch = typeof comment?.pitch === "number" ? comment.pitch : Number(comment?.pitch);
              const hasValidPosition = Number.isFinite(rawYaw) && Number.isFinite(rawPitch);

              return {
                ...comment,
                yaw: hasValidPosition ? rawYaw : null,
                pitch: hasValidPosition ? rawPitch : null,
              } as PanoramaComment;
            })
          : [];

        setPanoramaComments(normalized);
        markPanoramaCommentsAsRead(panoramaId);
      }
    } catch (error) {
      console.error("Ошибка загрузки комментариев к панораме:", error);
    }
  };

  const markPanoramaCommentsAsRead = async (panoramaId: number) => {
    if (!userEmail) return;
    if (panoramaCommentsReadRef.current.has(panoramaId)) return;

    try {
      await fetch(
        `/api/panorama-comments/mark-read?email=${encodeURIComponent(userEmail)}&isAdmin=false&panoramaId=${panoramaId}`,
        {
          method: "PATCH",
        }
      );

      panoramaCommentsReadRef.current.add(panoramaId);
      onCommentsRead?.(panoramaId);
    } catch (error) {
      console.error("Ошибка пометки комментариев панорамы как прочитанных:", error);
    }
  };

  const handlePanoramaReady = React.useCallback((viewer: any) => {
    panoramaViewerRef.current = viewer;
    const plugin = viewer.getPlugin(MarkersPlugin);
    if (plugin) {
      setMarkersPluginInstance(plugin);
    }
  }, []);

  const handlePanoramaContextMenu = React.useCallback((event: React.MouseEvent) => {
    event.preventDefault();
  }, []);

  const handlePanoramaClick = React.useCallback(
    (event: any) => {
      if (!selectedPanorama) return;

      const data = (event && (event.data || {})) || {};
      const originalEvent = data?.originalEvent || event?.originalEvent || event;

      const isRightClick = data.rightclick === true || originalEvent?.button === 2;
      if (!isRightClick) {
        return;
      }

      const longitude = [event?.longitude, event?.yaw, data.longitude, data.yaw]
        .find((value) => typeof value === "number") as number | undefined;
      const latitude = [event?.latitude, event?.pitch, data.latitude, data.pitch]
        .find((value) => typeof value === "number") as number | undefined;

      if (typeof longitude !== "number" || typeof latitude !== "number") {
        return;
      }

      setPendingPanoramaCoords({ yaw: longitude, pitch: latitude });
      setSelectedPanoramaCommentId(null);
    },
    [selectedPanorama]
  );

  const focusOnPanoramaComment = (comment: PanoramaComment) => {
    if (!panoramaViewerRef.current) return;
    if (!Number.isFinite(comment.yaw) || !Number.isFinite(comment.pitch)) return;

    panoramaViewerRef.current.animate({
      yaw: comment.yaw,
      pitch: comment.pitch,
      speed: "2rpm",
    });
  };

  const sendPanoramaComment = async () => {
    if (!newPanoramaComment.trim() || !selectedPanorama || !pendingPanoramaCoords) return;

    const yaw = Number(pendingPanoramaCoords.yaw);
    const pitch = Number(pendingPanoramaCoords.pitch);

    if (!Number.isFinite(yaw) || !Number.isFinite(pitch)) {
      alert("Не удалось определить позицию на панораме. Выберите точку ещё раз.");
      return;
    }

    const userToken = localStorage.getItem("userToken");
    if (!userToken) {
      alert("Не удалось найти токен пользователя. Авторизуйтесь повторно.");
      return;
    }

    setSendingPanoramaComment(true);
    try {
      const response = await fetch("/api/panorama-comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          panoramaId: selectedPanorama.id,
          content: newPanoramaComment.trim(),
          yaw,
          pitch,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setNewPanoramaComment("");
        setPendingPanoramaCoords(null);
        setSelectedPanoramaCommentId(data.comment.id);
        await fetchPanoramaComments(selectedPanorama.id);
      } else {
        console.error("Ошибка отправки комментария к панораме:", data.message);
      }
    } catch (error) {
      console.error("Ошибка отправки комментария к панораме:", error);
    } finally {
      setSendingPanoramaComment(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {!panoramasReady && (
        <div style={{
          textAlign: "center",
          color: "rgba(255,255,255,0.7)",
          fontFamily: "Arial, sans-serif",
          padding: "24px",
        }}>
          Проверяем панорамы...
        </div>
      )}

      {panoramasReady && panoramas.length === 0 && (
        <div style={{
          textAlign: "center",
          color: "rgba(255,255,255,0.6)",
          fontFamily: "Arial, sans-serif",
          padding: "24px",
        }}>
          Панорамы пока не добавлены.
        </div>
      )}

      {panoramasReady && panoramas.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: "16px",
          }}
        >
          {panoramas.map((panorama) => (
            <div
              key={panorama.id}
              style={{
                backgroundColor: "rgba(255,255,255,0.08)",
                borderRadius: "12px",
                border: "1px solid rgba(255,255,255,0.12)",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                position: "relative",
                cursor: missingPanoramaIds.has(panorama.id) ? "not-allowed" : "pointer",
                opacity: missingPanoramaIds.has(panorama.id) ? 0.6 : 1,
              }}
              onClick={() => {
                if (missingPanoramaIds.has(panorama.id)) return;
                setSelectedPanorama(panorama);
                setPendingPanoramaCoords(null);
                setSelectedPanoramaCommentId(null);
                fetchPanoramaComments(panorama.id);
              }}
            >
              <div
                style={{
                  height: "150px",
                  borderRadius: "10px",
                  overflow: "hidden",
                  backgroundColor: "rgba(0,0,0,0.3)",
                  position: "relative",
                }}
              >
                {panoramaUrls[panorama.filename] ? (
                  <img
                    src={panoramaUrls[panorama.filename]}
                    alt={panorama.originalName}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      filter: "blur(0.5px)",
                      transform: "scale(1.05)",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "rgba(255,255,255,0.7)",
                      fontSize: "2rem",
                    }}
                  >
                    🌀
                  </div>
                )}

                <div
                  style={{
                    position: "absolute",
                    top: "8px",
                    left: "8px",
                    backgroundColor: "rgba(17,24,39,0.75)",
                    color: "white",
                    padding: "4px 10px",
                    borderRadius: "999px",
                    fontSize: "0.75rem",
                    fontFamily: "Arial, sans-serif",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  360° Просмотр
                </div>

                {((panorama.unreadCommentsCount || 0) > 0) && (
                  <div
                    style={{
                      position: "absolute",
                      top: "8px",
                      right: "8px",
                      backgroundColor: "rgba(239, 68, 68, 0.95)",
                      color: "white",
                      padding: "6px 10px",
                      borderRadius: "16px",
                      fontSize: "0.75rem",
                      fontFamily: "Arial, sans-serif",
                      fontWeight: 700,
                      boxShadow: "0 2px 8px rgba(239,68,68,0.5)",
                    }}
                  >
                    💬 {panorama.unreadCommentsCount}
                  </div>
                )}

                {missingPanoramaIds.has(panorama.id) && (
                  <div
                    style={{
                      position: "absolute",
                      bottom: "8px",
                      left: "8px",
                      backgroundColor: "rgba(239,68,68,0.9)",
                      color: "white",
                      padding: "4px 10px",
                      borderRadius: "8px",
                      fontSize: "0.7rem",
                      fontFamily: "Arial, sans-serif",
                    }}
                  >
                    Файл отсутствует
                  </div>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <p
                  style={{
                    fontFamily: "Arial, sans-serif",
                    fontSize: "0.95rem",
                    color: "white",
                    margin: 0,
                  }}
                >
                  {panorama.originalName}
                </p>
                <p
                  style={{
                    fontFamily: "Arial, sans-serif",
                    fontSize: "0.8rem",
                    color: "rgba(255,255,255,0.6)",
                    margin: 0,
                  }}
                >
                  Загрузка: {formatDate(panorama.uploadedAt)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedPanorama && (
        <div
          style={{
            position: "fixed",
            top: "80px",
            left: "40px",
            right: "40px",
            bottom: "40px",
            zIndex: 1000,
            backgroundColor: "rgba(10,10,10,0.92)",
            borderRadius: "16px",
            display: "flex",
            flexDirection: "column",
            padding: "24px",
            gap: "20px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <h2
                style={{
                  color: "white",
                  fontSize: "1.5rem",
                  fontFamily: "ChinaCyr, sans-serif",
                  margin: 0,
                }}
              >
                {selectedPanorama.originalName}
              </h2>
              <p
                style={{
                  color: "rgba(255,255,255,0.7)",
                  fontFamily: "Arial, sans-serif",
                  fontSize: "0.85rem",
                  margin: "6px 0 0",
                }}
              >
                Правая кнопка мыши — выбрать точку для комментария.
              </p>
            </div>

            <button
              onClick={() => {
                setSelectedPanorama(null);
                setPanoramaComments([]);
                setNewPanoramaComment("");
                setPendingPanoramaCoords(null);
                setSelectedPanoramaCommentId(null);
                setMarkersPluginInstance(null);
                panoramaViewerRef.current = null;
              }}
              style={{
                background: "none",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "white",
                borderRadius: "50%",
                width: "44px",
                height: "44px",
                fontSize: "1.5rem",
                cursor: "pointer",
              }}
            >
              ×
            </button>
          </div>

            <div
              style={{
                flex: 1,
                display: "flex",
                gap: "20px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  flex: 1,
                  borderRadius: "12px",
                  overflow: "hidden",
                  backgroundColor: "rgba(0,0,0,0.6)",
                }}
                onContextMenu={handlePanoramaContextMenu}
              >
                <ReactPhotoSphereViewer
                  key={selectedPanorama.id}
                  ref={panoramaViewerRef}
                  src={
                    panoramaUrls[selectedPanorama.filename] ||
                    selectedPanorama.url ||
                    `/api/uploads/objects/${objectId}/panoramas/${selectedPanorama.filename}?email=${encodeURIComponent(userEmail)}`
                  }
                  height="100%"
                  width="100%"
                  littlePlanet={false}
                  navbar={["zoom", "fullscreen"]}
                  plugins={panoramaViewerPlugins}
                  onReady={handlePanoramaReady}
                  onClick={handlePanoramaClick}
                />
              </div>

              <div
                style={{
                  width: "360px",
                  backgroundColor: "rgba(255,255,255,0.07)",
                  borderRadius: "12px",
                  border: "1px solid rgba(255,255,255,0.15)",
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                  backdropFilter: "blur(12px)",
                }}
              >
                <div>
                  <h3
                    style={{
                      color: "white",
                      fontSize: "1.1rem",
                      margin: "0 0 10px 0",
                      fontFamily: "ChinaCyr, sans-serif",
                    }}
                  >
                    Комментарии ({panoramaComments.length})
                  </h3>
                  {pendingPanoramaCoords ? (
                    <div
                      style={{
                        fontSize: "0.8rem",
                        color: "rgba(59,130,246,0.95)",
                        background: "rgba(59,130,246,0.18)",
                        padding: "8px",
                        borderRadius: "8px",
                        border: "1px solid rgba(59,130,246,0.35)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <span>
                        Выбранная точка: {toDegrees(pendingPanoramaCoords.yaw)}° / {toDegrees(pendingPanoramaCoords.pitch)}°
                      </span>
                      <button
                        onClick={() => {
                          setPendingPanoramaCoords(null);
                          setSelectedPanoramaCommentId(null);
                        }}
                        style={{
                          background: "rgba(239,68,68,0.18)",
                          border: "1px solid rgba(239,68,68,0.35)",
                          color: "rgba(239,68,68,0.9)",
                          padding: "4px 8px",
                          borderRadius: "6px",
                          fontSize: "0.75rem",
                          cursor: "pointer",
                        }}
                      >
                        Очистить
                      </button>
                    </div>
                  ) : (
                    <div
                      style={{
                        fontSize: "0.8rem",
                        color: "rgba(255,255,255,0.65)",
                        background: "rgba(255,255,255,0.05)",
                        padding: "8px",
                        borderRadius: "8px",
                        border: "1px dashed rgba(255,255,255,0.2)",
                      }}
                    >
                      Точка не выбрана
                    </div>
                  )}
                </div>

                <div
                  style={{
                    flex: 1,
                    overflowY: "auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  {panoramaComments.map((comment) => (
                    <div
                      key={comment.id}
                      style={{
                        backgroundColor: comment.isAdminComment ? "rgba(59, 130, 246, 0.12)" : "rgba(255, 255, 255, 0.12)",
                        borderRadius: "10px",
                        border: `1px solid ${comment.isAdminComment ? "rgba(59,130,246,0.35)" : "rgba(255,255,255,0.18)"}`,
                        padding: "12px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                        boxShadow: selectedPanoramaCommentId === comment.id ? "0 0 0 2px rgba(34,197,94,0.4)" : "none",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                        }}
                      >
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          <p
                            style={{
                              fontFamily: "Arial, sans-serif",
                              fontSize: "0.85rem",
                              color: comment.isAdminComment ? "rgba(59,130,246,1)" : "rgba(34,197,94,1)",
                              margin: 0,
                              fontWeight: 600,
                            }}
                          >
                            {comment.isAdminComment ? "Команда" : comment.user.name || comment.user.email}
                          </p>
                          <p
                            style={{
                              fontFamily: "Arial, sans-serif",
                              fontSize: "0.75rem",
                              color: "rgba(255,255,255,0.65)",
                              margin: 0,
                            }}
                          >
                            {formatDate(comment.createdAt)}
                          </p>
                        </div>
                        {Number.isFinite(comment.yaw) && Number.isFinite(comment.pitch) && (
                          <button
                            onClick={() => {
                              setSelectedPanoramaCommentId(comment.id);
                              setPendingPanoramaCoords({ yaw: comment.yaw as number, pitch: comment.pitch as number });
                              focusOnPanoramaComment(comment);
                            }}
                            style={{
                              background: "rgba(34,197,94,0.18)",
                              border: "1px solid rgba(34,197,94,0.4)",
                              color: "rgba(34,197,94,0.9)",
                              padding: "4px 8px",
                              borderRadius: "6px",
                              fontSize: "0.75rem",
                              cursor: "pointer",
                            }}
                          >
                            Показать точку
                          </button>
                        )}
                      </div>
                      <p
                        style={{
                          fontFamily: "Arial, sans-serif",
                          fontSize: "0.9rem",
                          color: "white",
                          margin: 0,
                          lineHeight: 1.5,
                        }}
                      >
                        {comment.content}
                      </p>
                    </div>
                  ))}

                  {panoramaComments.length === 0 && (
                    <div
                      style={{
                        textAlign: "center",
                        color: "rgba(255,255,255,0.6)",
                        fontFamily: "Arial, sans-serif",
                        fontSize: "0.9rem",
                        padding: "20px",
                      }}
                    >
                      Пока нет комментариев
                    </div>
                  )}
                </div>

                <div
                  style={{
                    borderTop: "1px solid rgba(255,255,255,0.2)",
                    paddingTop: "12px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  <textarea
                    value={newPanoramaComment}
                    onChange={(e) => setNewPanoramaComment(e.target.value)}
                    placeholder={pendingPanoramaCoords ? "Напишите комментарий…" : "Сначала выберите точку на панораме"}
                    disabled={!pendingPanoramaCoords || sendingPanoramaComment}
                    style={{
                      width: "100%",
                      minHeight: "70px",
                      padding: "10px",
                      borderRadius: "8px",
                      border: "1px solid rgba(255,255,255,0.25)",
                      backgroundColor: "rgba(255,255,255,0.1)",
                      color: "white",
                      fontFamily: "Arial, sans-serif",
                      fontSize: "0.9rem",
                      resize: "vertical",
                    }}
                  />
                  <button
                    onClick={sendPanoramaComment}
                    disabled={!newPanoramaComment.trim() || !pendingPanoramaCoords || sendingPanoramaComment}
                    style={{
                      width: "100%",
                      backgroundColor:
                        !newPanoramaComment.trim() || !pendingPanoramaCoords || sendingPanoramaComment
                          ? "rgba(107,114,128,0.45)"
                          : "rgba(34,197,94,0.85)",
                      border: "none",
                      color: "white",
                      padding: "10px",
                      borderRadius: "8px",
                      fontSize: "0.95rem",
                      fontFamily: "Arial, sans-serif",
                      cursor:
                        !newPanoramaComment.trim() || !pendingPanoramaCoords || sendingPanoramaComment
                          ? "not-allowed"
                          : "pointer",
                      transition: "all 0.3s ease",
                    }}
                  >
                    {sendingPanoramaComment ? "Отправка…" : "Отправить комментарий"}
                  </button>
                </div>
              </div>
            </div>
        </div>
      )}
    </div>
  );
}


