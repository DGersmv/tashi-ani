"use client";

export default function CesiumMap({ onLoaded }: { onLoaded?: () => void }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        minWidth: "100%",
        minHeight: "100%",
        position: "relative",
        borderRadius: "inherit",
        background: "transparent",
      }}
    >
      <iframe
        title="tashi-ani story"
        src="https://ion.cesium.com/stories/viewer/?id=49cbb9c8-d365-4aa1-a3e0-55193165462f"
        width="100%"
        height="100%"
        style={{
          border: "none",
          borderRadius: "inherit",
          minHeight: "100%",
          minWidth: "100%",
        }}
        allowFullScreen
        onLoad={() => onLoaded && onLoaded()}
      />
    </div>
  );
}
