import "./globals.css";
import SiteLogo from "@/components/SiteLogo";
import HeaderMenu from "@/components/HeaderMenu";
import { Montserrat_Alternates } from "next/font/google";
import { ViewModeProvider } from "@/components/ui/ViewMode";
import HtmlModeClass from "@/components/ui/HtmlModeClass";

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={montserrat.variable}>
      <head>
        <link rel="preload" as="image" href="/portfolio/01.jpg" />
      </head>
      <body
        className="min-h-screen bg-black"
        style={{
          backgroundImage: "url('/portfolio/01.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <ViewModeProvider>
          <HtmlModeClass />

          <SiteLogo />
          <HeaderMenu />

          {children}
        </ViewModeProvider>
      </body>
    </html>
  );
}
