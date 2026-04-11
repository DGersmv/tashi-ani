import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/userManagement';
import { isValidEmail, sanitizeFilename } from '@/lib/security';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; filename: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const queryToken = searchParams.get('token');
    const authHeader = request.headers.get('Authorization');
    const headerToken = authHeader?.split(' ')[1];
    const token = queryToken || headerToken;

    const { id, filename } = await params;
    const projectId = parseInt(id);
    
    if (isNaN(projectId)) {
      return NextResponse.json({ 
        success: false, 
        message: 'Неверный ID проекта' 
      }, { status: 400 });
    }

    const decodedFilename = decodeURIComponent(filename);
    const safeName = sanitizeFilename(decodedFilename);
    if (!safeName) {
      return NextResponse.json({ success: false, message: 'Неверное имя файла' }, { status: 400 });
    }

    const documentRow = await prisma.document.findFirst({
      where: { projectId, filename: safeName },
      select: { id: true, projectId: true },
    });

    if (!documentRow) {
      return NextResponse.json({ success: false, message: 'Документ не найден' }, { status: 404 });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { objectId: true },
    });

    if (!project) {
      return NextResponse.json({ success: false, message: 'Проект не найден' }, { status: 404 });
    }

    let authorized = false;

    if (token) {
      const decoded = verifyToken(token);
      if (decoded && (decoded.role === 'MASTER' || decoded.role === 'ADMIN')) {
        authorized = true;
      }
    }

    if (!authorized && email && isValidEmail(email)) {
      const user = await prisma.user.findUnique({
        where: { email },
        include: { objects: { where: { id: project.objectId } } },
      });
      if (user && user.objects.length > 0) {
        authorized = true;
      }
    }

    if (!authorized) {
      return NextResponse.json(
        { success: false, message: 'Требуется авторизация' },
        { status: 401 }
      );
    }
    
    // Путь к файлу
    const filePath = path.join(
      process.cwd(),
      'public',
      'uploads',
      'projects',
      projectId.toString(),
      safeName
    );

    // Проверяем существование файла
    try {
      await fs.access(filePath);
    } catch (error) {
      console.error('Файл не найден:', filePath);
      return NextResponse.json({ 
        success: false, 
        message: 'Файл не найден' 
      }, { status: 404 });
    }

    // Читаем файл
    const fileBuffer = await fs.readFile(filePath);
    
    // Определяем MIME тип
    const ext = path.extname(decodedFilename).toLowerCase();
    let mimeType = 'application/octet-stream';
    
    if (ext === '.pdf') {
      mimeType = 'application/pdf';
    } else if (ext === '.jpg' || ext === '.jpeg') {
      mimeType = 'image/jpeg';
    } else if (ext === '.png') {
      mimeType = 'image/png';
    } else if (ext === '.gif') {
      mimeType = 'image/gif';
    } else if (ext === '.webp') {
      mimeType = 'image/webp';
    }

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': `inline; filename="${decodedFilename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('Ошибка получения файла проекта:', error);
    return NextResponse.json({
      success: false,
      message: 'Внутренняя ошибка сервера'
    }, { status: 500 });
  }
}

