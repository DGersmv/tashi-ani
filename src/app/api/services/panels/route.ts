import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

interface ServicePanel {
  id: string;
  name: string;
  order: number;
  folderPath: string;
  imageCount: number;
  images: string[];
}

export async function GET() {
  try {
    const pdfPagesPath = path.join(process.cwd(), 'public', 'pdf-pages');
    
    // Проверяем существование папки
    if (!fs.existsSync(pdfPagesPath)) {
      return NextResponse.json({ panels: [] });
    }

    const items = fs.readdirSync(pdfPagesPath, { withFileTypes: true });
    const servicePanels: ServicePanel[] = [];

    for (const item of items) {
      if (item.isDirectory()) {
        const folderName = item.name;
        const folderPath = path.join(pdfPagesPath, folderName);
        
        // Получаем все изображения в папке
        const images = fs.readdirSync(folderPath)
          .filter(file => /\.(png|jpg|jpeg|gif|webp)$/i.test(file))
          .map(file => `/pdf-pages/${folderName}/${file}`);

        // Проверяем наличие файла 1.png
        const hasPreview = fs.existsSync(path.join(folderPath, '1.png'));

        // Извлекаем порядковый номер из начала имени папки
        const orderMatch = folderName.match(/^(\d+)/);
        const order = orderMatch ? parseInt(orderMatch[1]) : 999;

        servicePanels.push({
          id: folderName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
          name: folderName,
          order,
          folderPath: `/pdf-pages/${folderName}`,
          imageCount: images.length,
          images,
          hasPreview
        });
      }
    }

    // Сортируем по порядковому номеру
    servicePanels.sort((a, b) => a.order - b.order);

    return NextResponse.json({ panels: servicePanels });
  } catch (error) {
    console.error('Ошибка при сканировании папок услуг:', error);
    return NextResponse.json({ panels: [] });
  }
}
