"use client";

import React from "react";
import dynamic from "next/dynamic";
import { MarkersPlugin } from "@photo-sphere-viewer/markers-plugin";
import "@photo-sphere-viewer/markers-plugin/index.css";
import { classifyPanoramaProjection, getPanoramaViewerPanoData } from "@/lib/panoramaUtils";

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
  originalWidth?: number | null;
  originalHeight?: number | null;
  projectionType?: string | null;
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
  const [panoramaOriginalUrls, setPanoramaOriginalUrls] = React.useState<Record<string, string>>({});
  const panoramaOriginalUrlsRef = React.useRef<Record<string, string>>({});
  const [loadingPanoramaIds, setLoadingPanoramaIds] = React.useState<Set<number>>(new Set());
  const loadingPanoramaIdsRef = React.useRef<Set<number>>(new Set());
  const [panoramaFetchErrors, setPanoramaFetchErrors] = React.useState<Record<number, string>>({});
  const panoramaFetchErrorsRef = React.useRef<Record<number, string>>({});
  const [panoramaPreviewErrors, setPanoramaPreviewErrors] = React.useState<Record<number, string>>({});
  const [panoramasReady, setPanoramasReady] = React.useState(true);
  const [selectedPanorama, setSelectedPanorama] = React.useState<Panorama | null>(null);
  const [panoramaComments, setPanoramaComments] = React.useState<PanoramaComment[]>([]);
  const [newPanoramaComment, setNewPanoramaComment] = React.useState("");
  const [sendingPanoramaComment, setSendingPanoramaComment] = React.useState(false);
  const [pendingPanoramaCoords, setPendingPanoramaCoords] = React.useState<{ yaw: number; pitch: number } | null>(null);
  const [selectedPanoramaCommentId, setSelectedPanoramaCommentId] = React.useState<number | null>(null);
  const panoramaViewerRef = React.useRef<any>(null);
  const panoramaViewerLoaderCleanupRef = React.useRef<(() => void) | null>(null);
  const [markersPluginInstance, setMarkersPluginInstance] = React.useState<any>(null);
  const panoramaCommentsReadRef = React.useRef<Set<number>>(new Set());

  React.useEffect(() => {
    panoramaOriginalUrlsRef.current = panoramaOriginalUrls;
  }, [panoramaOriginalUrls]);

  React.useEffect(() => {
    loadingPanoramaIdsRef.current = loadingPanoramaIds;
  }, [loadingPanoramaIds]);

  React.useEffect(() => {
    panoramaFetchErrorsRef.current = panoramaFetchErrors;
  }, [panoramaFetchErrors]);

  React.useEffect(() => {
    setPanoramasReady(true);
    setPanoramaPreviewErrors({});
  }, [panoramas]);

  React.useEffect(() => {
    return () => {
      Object.values(panoramaOriginalUrlsRef.current).forEach((url) => {
        if (url.startsWith("blob:")) {
          URL.revokeObjectURL(url);
        }
      });
      panoramaViewerLoaderCleanupRef.current?.();
      panoramaViewerLoaderCleanupRef.current = null;
    };
  }, []);

  const panoramaThumbnailUrls = React.useMemo(() => {
    const map: Record<string, string> = {};
    (panoramas || []).forEach((panorama) => {
      if ((panorama.mimeType || '').startsWith('image/')) {
        if ((panorama as any).thumbnailUrl) {
          map[panorama.filename] = (panorama as any).thumbnailUrl as string;
        } else if (panorama.url) {
          map[panorama.filename] = panorama.url;
        }
      }
    });
    return map;
  }, [panoramas]);

  const panoramaErrorIds = React.useMemo(() => {
    return new Set(Object.keys(panoramaFetchErrors).map((id) => Number(id)));
  }, [panoramaFetchErrors]);

  React.useEffect(() => {
    const keep = new Set((panoramas || []).map((panorama) => panorama.filename));
    setPanoramaOriginalUrls((prev) => {
      const next: Record<string, string> = {};
      Object.entries(prev).forEach(([filename, url]) => {
        if (keep.has(filename)) {
          next[filename] = url;
        } else if (url.startsWith("blob:")) {
          URL.revokeObjectURL(url);
        }
      });
      return next;
    });
  }, [panoramas]);

  const fetchPanoramaOriginal = React.useCallback(async (panorama: Panorama) => {
    if (!panorama) return;
    if (!(panorama.mimeType || "").startsWith("image/")) return;
    if (panoramaOriginalUrlsRef.current[panorama.filename]) return;
    if (loadingPanoramaIdsRef.current.has(panorama.id)) return;

    setPanoramaFetchErrors((prev) => {
      if (!(panorama.id in prev)) return prev;
      const next = { ...prev };
      delete next[panorama.id];
      return next;
    });

    loadingPanoramaIdsRef.current.add(panorama.id);
    setLoadingPanoramaIds(new Set(loadingPanoramaIdsRef.current));

    try {
      const requestUrl = `/api/uploads/objects/${objectId}/panoramas/${panorama.filename}?email=${encodeURIComponent(userEmail)}`;
      const staticUrl = `/uploads/objects/${objectId}/panoramas/${panorama.filename}`;
      let response = await fetch(requestUrl, {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        // Fallback to static path when API access fails (e.g. large files or auth edge cases)
        const fallbackResponse = await fetch(staticUrl, { method: "GET", cache: "no-store" });
        if (!fallbackResponse.ok) {
          console.warn(`Панорама ${panorama.filename} недоступна (status ${response.status}).`);
          const fallbackMessage = response.status === 404
            ? "Файл панорамы не найден или доступ ограничен."
            : `Не удалось загрузить панораму (статус ${response.status}).`;
          setPanoramaFetchErrors((prev) => ({
            ...prev,
            [panorama.id]: fallbackMessage,
          }));
          return;
        }
        response = fallbackResponse;
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      setPanoramaOriginalUrls((prev) => {
        const existing = prev[panorama.filename];
        if (existing && existing.startsWith("blob:")) {
          URL.revokeObjectURL(existing);
        }
        return { ...prev, [panorama.filename]: objectUrl };
      });
      setPanoramaFetchErrors((prev) => {
        if (!(panorama.id in prev)) return prev;
        const next = { ...prev };
        delete next[panorama.id];
        return next;
      });

      const needsAnalysis =
        !panorama.originalWidth ||
        !panorama.originalHeight ||
        !panorama.projectionType ||
        panorama.projectionType === "UNKNOWN";

      if (needsAnalysis) {
        const analysisImage = new Image();
        analysisImage.onload = () => {
          const width = analysisImage.naturalWidth;
          const height = analysisImage.naturalHeight;
          if (!width || !height) {
            return;
          }

          const inferredProjection = classifyPanoramaProjection(width, height);

          setSelectedPanorama((prev) => {
            if (!prev || prev.id !== panorama.id) {
              return prev;
            }

            const nextWidth = prev.originalWidth ?? width;
            const nextHeight = prev.originalHeight ?? height;
            const nextProjection =
              prev.projectionType && prev.projectionType !== "UNKNOWN"
                ? prev.projectionType
                : inferredProjection;

            return {
              ...prev,
              originalWidth: nextWidth,
              originalHeight: nextHeight,
              projectionType: nextProjection,
            };
          });
        };
        analysisImage.src = objectUrl;
      }
    } catch (error) {
      console.error(`Ошибка загрузки панорамы ${panorama.filename}:`, error);
      const message = error instanceof Error ? error.message : "Не удалось загрузить панораму.";
      setPanoramaFetchErrors((prev) => ({
        ...prev,
        [panorama.id]: message,
      }));
    } finally {
      loadingPanoramaIdsRef.current.delete(panorama.id);
      setLoadingPanoramaIds(new Set(loadingPanoramaIdsRef.current));
    }
  }, [objectId, userEmail]);

  const retryPanoramaFetch = React.useCallback(() => {
    if (!selectedPanorama) return;
    fetchPanoramaOriginal(selectedPanorama);
  }, [selectedPanorama, fetchPanoramaOriginal]);

  React.useEffect(() => {
    if (selectedPanorama) {
      fetchPanoramaOriginal(selectedPanorama);
    }
  }, [selectedPanorama, fetchPanoramaOriginal]);

  React.useEffect(() => {
    if (!selectedPanorama) {
      setPanoramaComments([]);
      setNewPanoramaComment("");
      setPendingPanoramaCoords(null);
      setSelectedPanoramaCommentId(null);
      panoramaCommentsReadRef.current.delete(-1);
      return;
    }

    const updatedPanorama = panoramas.find((p) => p.id === selectedPanorama.id);
    if (updatedPanorama) {
      setSelectedPanorama((prev) => (prev ? { ...prev, ...updatedPanorama } : updatedPanorama));
    }

    fetchPanoramaComments(selectedPanorama.id);
  }, [selectedPanorama?.id, panoramas]);

  const panoramaMarkers = React.useMemo(() => {
    if (!selectedPanorama) return [] as any[];

    const markers: any[] = [];

    panoramaComments
      .filter((comment) => Number.isFinite(comment.yaw) && Number.isFinite(comment.pitch))
      .forEach((comment) => {
        const isActive = selectedPanoramaCommentId === comment.id;
        const size = isActive ? 22 : 16;
        const color = comment.isAdminComment ? "#38bdf8" : "#f97316";
        const border = isActive ? "3px solid rgba(255,255,255,0.95)" : "2px solid rgba(255,255,255,0.85)";
        const description = `${comment.isAdminComment ? "Команда" : "Вы"} • ${comment.content}`;

        markers.push({
          type: "html",
          anchor: "bottom center",
          id: `panorama-comment-${comment.id}`,
          longitude: comment.yaw as number,
          latitude: comment.pitch as number,
          position: { yaw: comment.yaw as number, pitch: comment.pitch as number },
          html: `<div title="${description.replace(/"/g, '&quot;')}" style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:${border};box-shadow:0 0 12px rgba(0,0,0,0.45);"></div>`,
          data: { commentId: comment.id },
          tooltip: comment.content,
          size: 32,
        });
      });

    if (pendingPanoramaCoords) {
      const { yaw, pitch } = pendingPanoramaCoords;
      if (Number.isFinite(yaw) && Number.isFinite(pitch)) {
        markers.push({
          type: "html",
          anchor: "bottom center",
          id: "pending-panorama-comment",
          longitude: yaw,
          latitude: pitch,
          position: { yaw, pitch },
          html: `<div style="width:22px;height:22px;border-radius:50%;background:rgba(59,130,246,0.75);border:2px dashed rgba(59,130,246,0.95);box-shadow:0 0 14px rgba(59,130,246,0.6);"></div>`,
          data: { pending: true },
        });
      }
    }

    return markers;
  }, [panoramaComments, selectedPanoramaCommentId, pendingPanoramaCoords]);

  React.useEffect(() => {
    if (!markersPluginInstance) return;

    const pluginAny = markersPluginInstance as any;
    const safeMarkers = panoramaMarkers.filter(
      (marker) =>
        typeof marker.longitude === "number" &&
        Number.isFinite(marker.longitude) &&
        typeof marker.latitude === "number" &&
        Number.isFinite(marker.latitude)
    );

    if (typeof pluginAny.setMarkers === "function") {
      pluginAny.setMarkers(safeMarkers);
    } else {
      if (typeof pluginAny.clearMarkers === "function") {
        pluginAny.clearMarkers();
      }

      if (typeof pluginAny.addMarker === "function") {
        safeMarkers.forEach((marker) => {
          try {
            pluginAny.addMarker(marker);
          } catch (error) {
            console.error("Не удалось добавить маркер панорамы", marker, error);
          }
        });
      }
    }

    if (typeof pluginAny.on === "function" && typeof pluginAny.off === "function") {
      const handleSelectMarker = (marker: any) => {
        const commentId = marker?.config?.data?.commentId;
        if (commentId) {
          setSelectedPanoramaCommentId(commentId);
          setPendingPanoramaCoords({ yaw: marker.config.longitude, pitch: marker.config.latitude });
        }
      };

      pluginAny.on("select-marker", handleSelectMarker);

      return () => {
        pluginAny.off("select-marker", handleSelectMarker);
      };
    }
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

  const hidePhotoSphereLoader = React.useCallback((viewer: any) => {
    if (!viewer) return;

    // Hide internal PSV loader overlay if the library keeps it visible after aborted loads
    try {
      const internalLoader = (viewer as any).loader;
      if (internalLoader?.hide) {
        internalLoader.hide();
      }
    } catch (error) {
      console.warn("Не удалось скрыть встроенный загрузчик панорамы через API:", error);
    }

    try {
      const loaderContainer: HTMLElement | null =
        viewer.container?.querySelector?.(".psv-loader-container") ?? null;
      if (loaderContainer) {
        loaderContainer.classList.remove("psv-loader--undefined");
        loaderContainer.style.display = "none";
      }
    } catch (error) {
      console.warn("Не удалось скрыть встроенный загрузчик панорамы через DOM:", error);
    }
  }, []);

  const handlePanoramaReady = React.useCallback(
    (viewer: any) => {
      panoramaViewerRef.current = viewer;

      if (panoramaViewerLoaderCleanupRef.current) {
        panoramaViewerLoaderCleanupRef.current();
        panoramaViewerLoaderCleanupRef.current = null;
      }

      const hideLoaderHandler = () => hidePhotoSphereLoader(viewer);

      const eventsToWatch = ["panorama-loaded", "panorama-load-progress", "ready"] as const;
      eventsToWatch.forEach((eventName) => {
        try {
          viewer.addEventListener(eventName, hideLoaderHandler);
        } catch (error) {
          console.warn(`Не удалось подписаться на событие ${eventName}:`, error);
        }
      });

      panoramaViewerLoaderCleanupRef.current = () => {
        eventsToWatch.forEach((eventName) => {
          try {
            viewer.removeEventListener(eventName, hideLoaderHandler);
          } catch {
            // noop
          }
        });
      };

      hideLoaderHandler();

      const plugin = viewer.getPlugin(MarkersPlugin);
      if (plugin) {
        setMarkersPluginInstance(plugin);
      }
    },
    [hidePhotoSphereLoader]
  );

  const handlePanoramaContextMenu = React.useCallback((event: React.MouseEvent) => {
    event.preventDefault();
  }, []);

  const handlePanoramaClick = React.useCallback(
    (event: any) => {
      if (!selectedPanorama) return;
      const panoData = getPanoramaViewerPanoData(selectedPanorama as any);
      if (panoData) {
        return;
      }

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
    const trimmed = newPanoramaComment.trim();
    if (!trimmed || !selectedPanorama) return;

    let yaw: number | undefined;
    let pitch: number | undefined;

    if (coordinatesRequired) {
      if (!pendingPanoramaCoords) {
        alert("Сначала выберите точку на панораме.");
        return;
      }

      const rawYaw = Number(pendingPanoramaCoords.yaw);
      const rawPitch = Number(pendingPanoramaCoords.pitch);

      if (!Number.isFinite(rawYaw) || !Number.isFinite(rawPitch)) {
        alert("Не удалось определить позицию на панораме. Выберите точку ещё раз.");
        return;
      }

      yaw = rawYaw;
      pitch = rawPitch;
    }

    const userToken = localStorage.getItem("userToken");
    if (!userToken) {
      alert("Не удалось найти токен пользователя. Авторизуйтесь повторно.");
      return;
    }

    setSendingPanoramaComment(true);
    try {
      const payload: Record<string, unknown> = {
        panoramaId: selectedPanorama.id,
        content: trimmed,
      };

      if (typeof yaw === "number" && typeof pitch === "number") {
        payload.yaw = yaw;
        payload.pitch = pitch;
      }

      const response = await fetch("/api/panorama-comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        setNewPanoramaComment("");
        setSelectedPanoramaCommentId(data.comment.id);
        if (coordinatesRequired) {
          setPendingPanoramaCoords(null);
        }
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

  // IMPORTANT: For customers, use ONLY blob URL!
  // Direct paths like /uploads/... and panorama.url require API authorization
  const selectedPanoramaSrc = React.useMemo(() => {
    if (!selectedPanorama) return null;
    // Return only blob URL - it's created after authorized API fetch
    return panoramaOriginalUrls[selectedPanorama.filename] || null;
  }, [selectedPanorama, panoramaOriginalUrls]);

  const selectedPanoramaPanoData = React.useMemo(() => {
    if (!selectedPanorama) {
      return null;
    }
    return getPanoramaViewerPanoData(selectedPanorama as any);
  }, [selectedPanorama]);

  const selectedPanoramaError = selectedPanorama ? panoramaFetchErrors[selectedPanorama.id] : undefined;
  // Viewer is ready ONLY when blob URL exists (starts with blob:)
  const selectedPanoramaIsReady = Boolean(selectedPanoramaSrc) && selectedPanoramaSrc.startsWith('blob:');

  const annotationsEnabled = !selectedPanoramaPanoData;
  const coordinatesRequired = annotationsEnabled;
  const commentTextTrimmed = newPanoramaComment.trim();
  const canSubmitComment =
    !!commentTextTrimmed &&
    !sendingPanoramaComment &&
    (!coordinatesRequired || Boolean(pendingPanoramaCoords));

  React.useEffect(() => {
    if (!selectedPanoramaPanoData) {
      return;
    }

    setPendingPanoramaCoords(null);
    setSelectedPanoramaCommentId(null);
  }, [selectedPanoramaPanoData]);

  // Simple key based only on panorama ID - no panoData dependency to avoid reload loops
  const viewerKey = React.useMemo(() => {
    if (!selectedPanorama) return 'none';
    return `panorama-${selectedPanorama.id}`;
  }, [selectedPanorama?.id]);

  React.useEffect(() => {
    const viewer = panoramaViewerRef.current;
    if (!viewer || typeof viewer.setPanorama !== "function") {
      return;
    }
    if (!selectedPanorama || !selectedPanoramaSrc || !selectedPanoramaPanoData) {
      return;
    }

    let disposed = false;
    const maybePromise = viewer.setPanorama(selectedPanoramaSrc, { panoData: selectedPanoramaPanoData });

    if (maybePromise && typeof (maybePromise as Promise<unknown>).catch === "function") {
      (maybePromise as Promise<unknown>).catch((error: unknown) => {
        if (!disposed) {
          console.error("Не удалось применить параметры панорамы:", error);
        }
      });
    }

    return () => {
      disposed = true;
    };
  }, [selectedPanorama, selectedPanoramaSrc, selectedPanoramaPanoData]);

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
                cursor: "pointer",
              }}
              onClick={() => {
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
                {panoramaThumbnailUrls[panorama.filename] || panorama.url ? (
                  <img
                    src={panoramaThumbnailUrls[panorama.filename] || panorama.url || `/api/uploads/objects/${objectId}/panoramas/${panorama.filename}?email=${encodeURIComponent(userEmail)}`}
                    alt={panorama.originalName}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      filter: "blur(0.5px)",
                      transform: "scale(1.05)",
                    }}
                    onError={(event) => {
                      const target = event.currentTarget;
                      const fallbackSrc = `/api/uploads/objects/${objectId}/panoramas/${panorama.filename}?email=${encodeURIComponent(userEmail)}`;
                      if (target.dataset.fallbackApplied !== "true" && target.src !== fallbackSrc) {
                        target.dataset.fallbackApplied = "true";
                        target.src = fallbackSrc;
                        return;
                      }
                      setPanoramaPreviewErrors((prev) => ({
                        ...prev,
                        [panorama.id]: "Не удалось загрузить превью"
                      }));
                      target.style.display = "none";
                      const placeholder = target.nextElementSibling as HTMLElement | null;
                      if (placeholder) {
                        placeholder.style.display = "flex";
                      }
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
                      fontSize: "0.9rem",
                      padding: "8px",
                      textAlign: "center",
                      flexDirection: "column",
                      gap: "6px",
                    }}
                  >
                    <span>🌀</span>
                    {panoramaPreviewErrors[panorama.id] && (
                      <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.8)" }}>
                        {panoramaPreviewErrors[panorama.id]}
                      </span>
                    )}
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        window.open(`/api/uploads/objects/${objectId}/panoramas/${panorama.filename}?email=${encodeURIComponent(userEmail)}`, "_blank");
                      }}
                      style={{
                        backgroundColor: "rgba(59, 130, 246, 0.8)",
                        border: "none",
                        color: "white",
                        padding: "4px 8px",
                        borderRadius: "6px",
                        fontSize: "0.7rem",
                        cursor: "pointer"
                      }}
                    >
                      Открыть файл
                    </button>
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

                {panoramaErrorIds.has(panorama.id) && (
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
              {annotationsEnabled
                ? "Правая кнопка мыши — выбрать точку для комментария."
                : "Панорама отображается в цилиндрическом режиме — просмотр доступен, привязка точек недоступна."}
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
                panoramaViewerLoaderCleanupRef.current?.();
                panoramaViewerLoaderCleanupRef.current = null;
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
                  position: "relative",
                }}
                onContextMenu={handlePanoramaContextMenu}
              >
                {selectedPanoramaIsReady ? (
                <ReactPhotoSphereViewer
                  key={viewerKey}
                  ref={panoramaViewerRef}
                  src={selectedPanoramaSrc!}
                  height="100%"
                  width="100%"
                  littlePlanet={false}
                  navbar={["zoom", "fullscreen"]}
                  plugins={panoramaViewerPlugins}
                  lang={{ loading: "" }}
                  onReady={handlePanoramaReady}
                  onClick={handlePanoramaClick}
                  loadingTxt=""
                  {...(selectedPanoramaPanoData ? { panoData: selectedPanoramaPanoData } : {})}
                />
                ) : (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "12px",
                      color: "white",
                      fontFamily: "Arial, sans-serif",
                      padding: "24px",
                      textAlign: "center",
                    }}
                  >
                    {!selectedPanoramaError ? (
                      <>
                        <span style={{ fontSize: "1rem", opacity: 0.8 }}>Загружаем панораму…</span>
                        <span style={{ fontSize: "0.85rem", opacity: 0.6 }}>
                          Это может занять до минуты — дождитесь окончания загрузки.
                        </span>
                      </>
                    ) : (
                      <>
                        <span style={{ fontSize: "1rem", color: "rgba(239,68,68,0.9)" }}>
                          Не удалось загрузить панораму
                        </span>
                        <span style={{ fontSize: "0.85rem", opacity: 0.75 }}>
                          {selectedPanoramaError}
                        </span>
                        <button
                          onClick={retryPanoramaFetch}
                          style={{
                            marginTop: "8px",
                            padding: "8px 16px",
                            borderRadius: "999px",
                            border: "1px solid rgba(59,130,246,0.4)",
                            backgroundColor: "rgba(59,130,246,0.15)",
                            color: "rgba(255,255,255,0.9)",
                            cursor: "pointer",
                          }}
                        >
                          Повторить
                        </button>
                      </>
                    )}
                  </div>
                )}
                {loadingPanoramaIds.has(selectedPanorama.id) && !selectedPanoramaError && (
                  <div
                    style={{
                      position: "absolute",
                      top: "16px",
                      right: "16px",
                      backgroundColor: "rgba(17,24,39,0.7)",
                      color: "white",
                      padding: "6px 12px",
                      borderRadius: "999px",
                      fontSize: "0.8rem",
                      fontFamily: "Arial, sans-serif",
                    }}
                  >
                    Загрузка панорамы…
                  </div>
                )}
                {selectedPanoramaError && (
                  <div
                    style={{
                      position: "absolute",
                      top: "16px",
                      right: "16px",
                      backgroundColor: "rgba(239,68,68,0.85)",
                      color: "white",
                      padding: "6px 12px",
                      borderRadius: "999px",
                      fontSize: "0.8rem",
                      fontFamily: "Arial, sans-serif",
                    }}
                  >
                    Ошибка загрузки
                  </div>
                )}
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
                  {annotationsEnabled ? (
                    pendingPanoramaCoords ? (
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
                    )
                  ) : (
                    <div
                      style={{
                        fontSize: "0.8rem",
                        color: "rgba(255,255,255,0.78)",
                        background: "rgba(59,130,246,0.12)",
                        padding: "8px",
                        borderRadius: "8px",
                        border: "1px solid rgba(59,130,246,0.35)",
                      }}
                    >
                      Эта панорама в цилиндрическом формате: комментарий сохранится без привязки к точке.
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
                        {annotationsEnabled && Number.isFinite(comment.yaw) && Number.isFinite(comment.pitch) && (
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
                    placeholder={
                      annotationsEnabled
                        ? pendingPanoramaCoords
                          ? "Напишите комментарий…"
                          : "Сначала выберите точку на панораме"
                        : "Напишите комментарий… (будет без привязки к точке)"
                    }
                    disabled={(coordinatesRequired && !pendingPanoramaCoords) || sendingPanoramaComment}
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
                    disabled={!canSubmitComment}
                    style={{
                      width: "100%",
                      backgroundColor: canSubmitComment ? "rgba(34,197,94,0.85)" : "rgba(107,114,128,0.45)",
                      border: "none",
                      color: "white",
                      padding: "10px",
                      borderRadius: "8px",
                      fontSize: "0.95rem",
                      fontFamily: "Arial, sans-serif",
                    cursor: canSubmitComment ? "pointer" : "not-allowed",
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


