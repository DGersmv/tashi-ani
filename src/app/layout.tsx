import "./globals.css";
import Header from "@/components/Header";
import { Montserrat_Alternates } from "next/font/google";
import { ViewModeProvider } from "@/components/ui/ViewMode";
import { LoginFlowProvider } from "@/components/ui/LoginFlowContext";
import { SiteSettingsProvider } from "@/components/ui/SiteSettingsContext";
import { OpenSiteSettingsProvider } from "@/components/ui/OpenSiteSettingsContext";
import { AuthProvider } from "@/components/ui/AuthContext";
import ModeSync from "@/components/ui/ModeSync";           // ← синхронизация режима по URL
import HtmlModeClass from "@/components/ui/HtmlModeClass"; // ← класс на <html> для глобальных стилей
import { getSiteSettings, buildFontStack } from "@/lib/siteSettings";

const montserrat = Montserrat_Alternates({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-montserrat",
  display: "swap",
});

export const metadata = {
  title: "tashi-ani.ru",
  description: "Ландшафтная архитектура, портфолио и проекты",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const initialSettings = await getSiteSettings();
  const fontMenu = buildFontStack(initialSettings.menuFont || "ChinaCyr");
  const fontHeading = buildFontStack(initialSettings.headingFont || "ChinaCyr");
  const fontMainHeading = buildFontStack(initialSettings.mainPageHeadingFont || "ChinaCyr");
  const fontMainText = buildFontStack(initialSettings.mainPageTextFont || "ChinaCyr");

  return (
    <html lang="ru" className={montserrat.variable}>
      <head>
        {/* Предзагрузка первого фона как плейсхолдера, чтобы не было «чёрного кадра» */}
        <link rel="preload" as="image" href="/portfolio/01.jpg" />
        {/* Шрифты меню, заголовков и главной страницы с первого кадра (без мерцания) */}
        <style
          dangerouslySetInnerHTML={{
            __html: `:root{--font-menu:${fontMenu};--font-heading:${fontHeading};--font-main-heading:${fontMainHeading};--font-main-text:${fontMainText};}`,
          }}
        />
      </head>
      <body
        className="min-h-screen bg-black"
        style={{
          // статичный бэкграунд-плейсхолдер до старта слайдшоу
          backgroundImage: "url('/portfolio/01.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          // Важно: без backgroundAttachment: 'fixed' — на ряде устройств даёт дёрганья
        }}
      >
        <ViewModeProvider>
          <LoginFlowProvider>
            <OpenSiteSettingsProvider>
            <SiteSettingsProvider initialSettings={initialSettings}>
            <AuthProvider>
            {/* синхронизация режима по маршруту + глобальный data-атрибут на <html> */}
            <ModeSync />
            <HtmlModeClass />

            {/* Один общий Header для всего приложения */}
            <Header />

            {/* контент страниц */}
            <div className="main-content">
              {children}
            </div>
            </AuthProvider>
            </SiteSettingsProvider>
            </OpenSiteSettingsProvider>
          </LoginFlowProvider>
        </ViewModeProvider>
      </body>
    </html>
  );
}
