import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { readFile } from 'fs/promises';
import { join } from 'path';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; filename: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const resolvedParams = await params;
    const objectId = parseInt(resolvedParams.id);
    const filename = resolvedParams.filename;

    if (!email) {
      return NextResponse.json({ success: false, message: 'Email не предоставлен' }, { status: 400 });
    }

    if (isNaN(objectId)) {
      return NextResponse.json({ success: false, message: 'Неверный ID объекта' }, { status: 400 });
    }

    // Проверяем, что пользователь существует и имеет доступ к объекту
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        objects: {
          where: { id: objectId }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ success: false, message: 'Пользователь не найден' }, { status: 404 });
    }

    if (user.objects.length === 0) {
      return NextResponse.json({ success: false, message: 'Объект не найден или нет доступа' }, { status: 404 });
    }

    // Проверяем, это фото или документ
    // Сначала ищем в фотографиях
    const photo = await prisma.photo.findFirst({
      where: {
        objectId: objectId,
        filename: filename,
        isVisibleToCustomer: true
      }
    });

    if (photo) {
      const relativePath = typeof photo.filePath === 'string' && photo.filePath.trim().length > 0
        ? photo.filePath.replace(/^\/+/, '')
        : ['uploads', 'objects', objectId.toString(), photo.filename].join('/');
      const filePath = join(process.cwd(), 'public', relativePath);
      
      try {
        const fileBuffer = await readFile(filePath);
        
        return new NextResponse(fileBuffer, {
          headers: {
            'Content-Type': photo.mimeType || 'application/octet-stream',
            'Content-Length': fileBuffer.length.toString(),
            'Cache-Control': 'public, max-age=31536000',
          },
        });
      } catch (fileError) {
        console.error('Ошибка при чтении фото:', fileError);
        return NextResponse.json({ success: false, message: 'Файл не найден на диске' }, { status: 404 });
      }
    }

    // Если не фото, проверяем документы
    const document = await prisma.document.findFirst({
      where: {
        objectId: objectId,
        filename: filename
      }
    });

    if (document) {
      const relativePath = typeof document.filePath === 'string' && document.filePath.trim().length > 0
        ? document.filePath.replace(/^\/+/, '')
        : ['uploads', 'objects', objectId.toString(), document.filename].join('/');
      const filePath = join(process.cwd(), 'public', relativePath);
      
      try {
        const fileBuffer = await readFile(filePath);
        
        return new NextResponse(fileBuffer, {
          headers: {
            'Content-Type': document.mimeType || 'application/octet-stream',
            'Content-Length': fileBuffer.length.toString(),
            'Cache-Control': 'public, max-age=31536000',
          },
        });
      } catch (fileError) {
        console.error('Ошибка при чтении документа:', fileError);
        return NextResponse.json({ success: false, message: 'Файл не найден на диске' }, { status: 404 });
      }
    }

    // Файл не найден ни в фото, ни в документах
    return NextResponse.json({ success: false, message: 'Файл не найден или нет доступа' }, { status: 404 });

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