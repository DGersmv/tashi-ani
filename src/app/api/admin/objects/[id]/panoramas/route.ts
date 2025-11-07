import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/userManagement';
import { mkdir, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

const MAX_FILE_SIZE_MB = 50;
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

const buildPanoramaUrl = (objectId: number, panorama: any) => {
  const baseUrl = `/uploads/objects/${objectId}/panoramas/${panorama.filename}`;
  const uploadedAt = panorama?.uploadedAt ? new Date(panorama.uploadedAt) : new Date();
  const cacheBuster = Number.isFinite(uploadedAt.getTime()) ? uploadedAt.getTime() : Date.now();
  return `${baseUrl}?v=${cacheBuster}`;
};

const ensureAdminAccess = (request: NextRequest) => {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: NextResponse.json({ success: false, message: 'Не авторизован' }, { status: 401 }) };
  }

  const token = authHeader.split(' ')[1];
  const adminData = verifyToken(token);

  if (!adminData || (adminData.role !== 'ADMIN' && adminData.role !== 'MASTER')) {
    return { error: NextResponse.json({ success: false, message: 'Доступ запрещен' }, { status: 403 }) };
  }

  return { adminData };
};

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const access = ensureAdminAccess(request);
    if (access.error) return access.error;

    const resolvedParams = await params;
    const objectId = parseInt(resolvedParams.id, 10);

    if (Number.isNaN(objectId)) {
      return NextResponse.json({ success: false, message: 'Неверный ID объекта' }, { status: 400 });
    }
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const isVisibleToCustomer = formData.get('isVisibleToCustomer') === 'true';

    if (!file) {
      return NextResponse.json({ success: false, message: 'Файл не найден' }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ success: false, message: 'Неподдерживаемый тип файла' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      return NextResponse.json({ success: false, message: `Файл слишком большой (максимум ${MAX_FILE_SIZE_MB}MB)` }, { status: 400 });
    }

    const fileExtension = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExtension}`;

    const uploadDir = join(process.cwd(), 'public', 'uploads', 'objects', objectId.toString(), 'panoramas');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const filePath = join(uploadDir, fileName);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    const panorama = await prisma.panorama.create({
      data: {
        objectId,
        filename: fileName,
        originalName: file.name,
        filePath: `/uploads/objects/${objectId}/panoramas/${fileName}`,
        fileSize: file.size,
        mimeType: file.type,
        isVisibleToCustomer,
        uploadedAt: new Date(),
      },
    });

    const url = buildPanoramaUrl(objectId, panorama);

    return NextResponse.json({
      success: true,
      panorama: {
        ...panorama,
        uploadedAt: panorama.uploadedAt.toISOString(),
        url,
      },
    });
  } catch (error) {
    console.error('Ошибка загрузки панорамы:', error);
    return NextResponse.json({ success: false, message: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const access = ensureAdminAccess(request);
    if (access.error) return access.error;

    const resolvedParams = await params;
    const objectId = parseInt(resolvedParams.id, 10);

    if (Number.isNaN(objectId)) {
      return NextResponse.json({ success: false, message: 'Неверный ID объекта' }, { status: 400 });
    }
    const { panoramaId, isVisibleToCustomer } = await request.json();

    if (!panoramaId || typeof isVisibleToCustomer !== 'boolean') {
      return NextResponse.json({ success: false, message: 'Неверные параметры' }, { status: 400 });
    }

    const updatedPanorama = await prisma.panorama.update({
      where: {
        id: panoramaId,
        objectId,
      },
      data: { isVisibleToCustomer },
    });

    return NextResponse.json({
      success: true,
      panorama: {
        ...updatedPanorama,
        url: buildPanoramaUrl(objectId, updatedPanorama),
      },
    });
  } catch (error) {
    console.error('Ошибка обновления панорамы:', error);
    return NextResponse.json({ success: false, message: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const access = ensureAdminAccess(request);
    if (access.error) return access.error;

    const resolvedParams = await params;
    const objectId = parseInt(resolvedParams.id, 10);

    if (Number.isNaN(objectId)) {
      return NextResponse.json({ success: false, message: 'Неверный ID объекта' }, { status: 400 });
    }
    const { panoramaId } = await request.json();

    if (!panoramaId) {
      return NextResponse.json({ success: false, message: 'ID панорамы обязателен' }, { status: 400 });
    }

    const panorama = await prisma.panorama.findFirst({
      where: {
        id: panoramaId,
        objectId,
      },
    });

    if (!panorama) {
      return NextResponse.json({ success: false, message: 'Панорама не найдена' }, { status: 404 });
    }

    const publicPath = panorama.filePath.replace(/^\/+/, '');
    const absolutePath = join(process.cwd(), 'public', publicPath);

    if (existsSync(absolutePath)) {
      await import('fs/promises').then((fs) => fs.unlink(absolutePath));
    }

    await prisma.panorama.delete({ where: { id: panoramaId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Ошибка удаления панорамы:', error);
    return NextResponse.json({ success: false, message: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}

