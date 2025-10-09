import fs from "fs";
import path from "path";
import Image from "next/image";

export default function ServicesPage() {
  // Берём абсолютный путь к папке /public/pdf-pages
  const dir = path.join(process.cwd(), "public/pdf-pages");

  // Читаем файлы из папки
  let images: string[] = [];
  try {
    const files = fs.readdirSync(dir);
    images = files.filter((f) => /\.(jpg|jpeg|png|webp|gif)$/i.test(f));
  } catch {
    // если папка пустая или нет — ничего не рендерим
    images = [];
  }

  return (
    <main className="relative p-8">
      <h1 className="text-3xl font-bold text-white mb-6">Наши услуги</h1>

      {images.length === 0 ? (
        <p className="text-gray-400">Нет файлов в папке /public/pdf-pages</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {images.map((file, i) => (
            <div key={i} className="relative w-full h-80">
              <Image
                src={`/pdf-pages/${file}`}
                alt={`Услуга ${i + 1}`}
                fill
                className="object-contain rounded-xl shadow-lg"
              />
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
