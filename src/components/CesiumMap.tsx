"use client";

export default function CesiumMap({ onLoaded }: { onLoaded?: () => void }) {
  return (
    <div style={{ width: "100%", height: "100%", position: "relative", borderRadius: "inherit" }}>
      <iframe
        title="test"
        src="https://www.google.com/maps/@59.9839277,29.6637482,262571m/data=!3m1!1e3?entry=ttu&g_ep=EgoyMDI1MDcwOS4wIKXMDSoASAFQAw%3D%3D"
        width="100%"
        height="100%"
        style={{ border: "none", borderRadius: "inherit" }}
        allowFullScreen
        onLoad={() => onLoaded && onLoaded()}
      />
    </div>
  );
}