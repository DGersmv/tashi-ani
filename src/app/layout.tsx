import "./globals.css";
import HeaderMenu from "@/components/HeaderMenu";
import SiteLogo from "@/components/SiteLogo";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Ландшафтный дизайн - Прорыв в современном стиле</title>
        <meta name="description" content="Лучший сайт ландшафтного дизайна с 3D-картами Cesium, стеклянными панелями и персональным кабинетом. Нам доверяют 15 лет!" />
        <link href="https://fonts.googleapis.com/css2?family=Montserrat+Alternates:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-[#111820] min-h-screen flex flex-col antialiased">
        <div className="fixed top-0 left-0 right-0 z-50 h-[150px] bg-gradient-to-b from-[#111820] to-transparent pointer-events-none" />
        <div className="fixed top-0 left-0 right-0 z-[100]">
          <HeaderMenu />
          <SiteLogo />
        </div>
        <main style={{ paddingTop: '22vh' }} className="pb-8 flex-1">
          {children}
        </main>
      </body>
    </html>
  );
}
