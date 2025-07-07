import "./globals.css";
import HeaderMenu from "@/components/HeaderMenu";
import SiteLogo from "@/components/SiteLogo";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <head>
        {/* Подключаем стили Cesium */}
        <link rel="stylesheet" href="/cesium/widgets.css" />
      </head>
      <body className="bg-gradient-to-b from-[#13161c] to-[#222c37] min-h-screen">
        <HeaderMenu />
        <SiteLogo />
        {children}
      </body>
    </html>
  );
}
