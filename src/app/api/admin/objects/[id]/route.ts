import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

// Проверка авторизации админа
async function authenticateAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    if (decoded.email === process.env.MASTER_ADMIN_EMAIL) {
      return decoded;
    }
    return null;
  } catch (error) {
    return null;
  }
}

// GET - получить детальную информацию об объекте
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await authenticateAdmin(request);
    if (!admin) {
      return NextResponse.json({ success: false, message: "Неавторизованный доступ" }, { status: 401 });
    }

    const resolvedParams = await params;
    const objectId = parseInt(resolvedParams.id);

    if (isNaN(objectId)) {
      return NextResponse.json({ success: false, message: "Неверный ID объекта" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: false, message: "ID пользователя обязателен" }, { status: 400 });
    }

    const object = await prisma.object.findFirst({
      where: { 
        id: objectId,
        userId: parseInt(userId)
      },
      include: {
        projects: {
          include: {
            documents: {
              select: {
                id: true,
                filename: true,
                originalName: true,
                mimeType: true,
                fileSize: true,
                uploadedAt: true,
                isPaid: true,
                documentType: true
              },
              orderBy: { uploadedAt: 'desc' }
            },
            _count: {
              select: {
                photos: true,
                documents: true,
                messages: true,
              }
            }
          }
        },
        photos: true,
        documents: true,
        messages: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          }
        }
      }
    });

    if (!object) {
      return NextResponse.json({ success: false, message: "Объект не найден" }, { status: 404 });
    }

    // Добавляем URL для фото
    const objectWithUrls = {
      ...object,
      photos: object.photos.map(photo => ({
        ...photo,
        url: `/uploads/objects/${objectId}/${photo.filename}`
      }))
    };

    return NextResponse.json({ success: true, object: objectWithUrls });
  } catch (error) {
    console.error("Ошибка загрузки деталей объекта:", error);
    return NextResponse.json({ success: false, message: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}
