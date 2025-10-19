import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { verifyToken } from '@/lib/userManagement';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; filename: string }> }
) {
  try {
    // Проверяем авторизацию администратора
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return NextResponse.json({ success: false, message: 'Требуется авторизация' }, { status: 401 });
    }

    const decodedToken = verifyToken(token);
    if (!decodedToken || decodedToken.role !== 'MASTER') {
      return NextResponse.json({ success: false, message: 'Недостаточно прав' }, { status: 403 });
    }

    const resolvedParams = await params;
    const objectId = parseInt(resolvedParams.id);
    const filename = resolvedParams.filename;

    if (isNaN(objectId)) {
      return NextResponse.json({ success: false, message: 'Неверный ID объекта' }, { status: 400 });
    }

    // Проверяем, что фото существует (для админа доступны все фото)
    const photo = await prisma.photo.findFirst({
      where: {
        objectId: objectId,
        filename: filename
      }
    });

    if (!photo) {
      return NextResponse.json({ success: false, message: 'Фото не найдено' }, { status: 404 });
    }

    // Читаем файл
    const filePath = join(process.cwd(), 'public', 'uploads', 'objects', objectId.toString(), filename);
    
    try {
      const fileBuffer = await readFile(filePath);
      
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': photo.mimeType,
          'Content-Length': fileBuffer.length.toString(),
          'Cache-Control': 'public, max-age=31536000',
        },
      });
    } catch (fileError) {
      console.error('Ошибка при чтении файла:', fileError);
      return NextResponse.json({ success: false, message: 'Файл не найден' }, { status: 404 });
    }

  } catch (error) {
    console.error('Ошибка при получении фото:', error);
    return NextResponse.json(
      { success: false, message: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
