"use client";

import { useEffect, useRef, useState } from "react";

interface PdfJsProjectViewerProps {
  pdfUrl: string | null;
  scale: number;
}

export default function PdfJsProjectViewer({ pdfUrl, scale }: PdfJsProjectViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pdfUrl || !containerRef.current) return;

    const container = containerRef.current;
    const url = pdfUrl;
    let cancelled = false;

    async function renderPdf() {
      setLoading(true);
      setError(null);
      container.innerHTML = "";

      try {
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

        const loadingTask = pdfjsLib.getDocument({ url });
        const pdf = await loadingTask.promise;
        if (cancelled) return;

        for (let i = 1; i <= pdf.numPages; i++) {
          if (cancelled) return;
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale });
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) continue;
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.style.display = "block";
          canvas.style.margin = "0 auto 16px";
          canvas.style.maxWidth = "100%";
          canvas.style.height = "auto";
          await page.render({ canvasContext: ctx, viewport, canvas }).promise;
          container.appendChild(canvas);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Не удалось открыть PDF");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    renderPdf();
    return () => {
      cancelled = true;
    };
  }, [pdfUrl, scale]);

  if (!pdfUrl) {
    return null;
  }

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        overflow: "auto",
        backgroundColor: "#525659",
        position: "relative",
      }}
    >
      {loading && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(82, 86, 89, 0.85)",
            zIndex: 2,
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              border: "4px solid rgba(255,255,255,0.2)",
              borderTop: "4px solid white",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
            }}
          />
          <style jsx>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}
      {error && (
        <div
          style={{
            padding: "24px",
            color: "#b91c1c",
            fontFamily: "Arial, sans-serif",
            textAlign: "center",
          }}
        >
          {error}
        </div>
      )}
      <div ref={containerRef} style={{ padding: "16px", minHeight: "100%" }} />
    </div>
  );
}
