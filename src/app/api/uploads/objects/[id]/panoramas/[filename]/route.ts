import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; filename: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const resolvedParams = await params;
    const objectId = parseInt(resolvedParams.id, 10);
    const filename = resolvedParams.filename;

    if (!email) {
      return NextResponse.json({ success: false, message: 'Email не предоставлен' }, { status: 400 });
    }

    if (Number.isNaN(objectId)) {
      return NextResponse.json({ success: false, message: 'Неверный ID объекта' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        objects: {
          where: { id: objectId },
          select: { id: true },
        },
      },
    });

    if (!user || user.objects.length === 0) {
      return NextResponse.json({ success: false, message: 'Объект не найден или нет доступа' }, { status: 404 });
    }

    const panorama = await prisma.panorama.findFirst({
      where: {
        objectId,
        filename,
        isVisibleToCustomer: true,
      },
    });

    if (!panorama) {
      return NextResponse.json({ success: false, message: 'Панорама не найдена или скрыта' }, { status: 404 });
    }

    const relativePath = typeof panorama.filePath === 'string' && panorama.filePath.trim().length > 0
      ? panorama.filePath.replace(/^\/+/, '')
      : ['uploads', 'objects', objectId.toString(), 'panoramas', panorama.filename].join('/');

    const filePath = join(process.cwd(), 'public', relativePath);

    try {
      const fileBuffer = await readFile(filePath);

      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': panorama.mimeType || 'application/octet-stream',
          'Content-Length': fileBuffer.length.toString(),
          'Cache-Control': 'no-store',
        },
      });
    } catch (error) {
      console.error('Ошибка при чтении файла панорамы:', error);
      return NextResponse.json({ success: false, message: 'Файл не найден' }, { status: 404 });
    }
  } catch (error) {
    console.error('Ошибка при получении панорамы:', error);
    return NextResponse.json({ success: false, message: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}


