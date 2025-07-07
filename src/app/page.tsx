"use client";
import GlassMapPanel from "@/components/GlassMapPanel";

export default function Home() {
  return (
    <main style={{ position: "relative", minHeight: "100vh", overflow: "hidden" }}>
      {/* HeaderMenu и SiteLogo подключаются уже в RootLayout! */}
      <GlassMapPanel />
      <div style={{
        marginTop: 130,
        textAlign: 'center',
        position: 'relative',
        zIndex: 2,
      }}>
        <h1 style={{
          fontSize: '2.3em',
          marginBottom: 30,
          fontWeight: 900,
          letterSpacing: '0.04em',
          fontFamily: "'ChinaCyr', Arial, Helvetica, sans-serif",
        }}>
          ПРОВЕРКА РАБОТЫ
        </h1>
        <div style={{
          fontSize: '2em',
          background: '#333',
          color: '#fff',
          borderRadius: '20px',
          padding: '24px',
          margin: '40px auto',
          maxWidth: 680,
          fontFamily: "'ChinaCyr', Arial, Helvetica, sans-serif",
        }}>
          Я вижу этот текст!
        </div>
      </div>
    </main>
  );
}
