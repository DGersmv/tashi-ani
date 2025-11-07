import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/userManagement';

// GET - получить детальную информацию об объекте
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, message: "Токен авторизации не предоставлен" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const adminData = verifyToken(token);

    if (!adminData || (adminData.role !== 'ADMIN' && adminData.role !== 'MASTER')) {
      return NextResponse.json({ success: false, message: "Недостаточно прав для просмотра объекта" }, { status: 403 });
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
        photos: {
          include: {
            folder: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: { uploadedAt: 'desc' }
        },
        panoramas: {
          orderBy: { uploadedAt: 'desc' }
        },
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

    // Считаем непрочитанные сообщения от заказчика
    const unreadMessagesCount = await prisma.message.count({
      where: {
        objectId: objectId,
        isAdminMessage: false,
        isReadByAdmin: false
      }
    });

    // Считаем непрочитанные комментарии от заказчика
    const photoIds = object.photos.map(p => p.id);
    const panoramaIds = object.panoramas.map(p => p.id);
    let unreadPhotoCommentsCount = 0;
    let unreadPanoramaCommentsCount = 0;

    if (photoIds.length > 0) {
      unreadPhotoCommentsCount = await prisma.photoComment.count({
        where: {
          photoId: { in: photoIds },
          isAdminComment: false,
          isReadByAdmin: false
        }
      });
    }

    if (panoramaIds.length > 0) {
      unreadPanoramaCommentsCount = await prisma.panoramaComment.count({
        where: {
          panoramaId: { in: panoramaIds },
          isAdminComment: false,
          isReadByAdmin: false
        }
      });
    }

    // Для каждого фото считаем непрочитанные комментарии
    const photosWithUnreadComments = await Promise.all(object.photos.map(async (photo) => {
      const unreadPhotoComments = await prisma.photoComment.count({
        where: {
          photoId: photo.id,
          isAdminComment: false,
          isReadByAdmin: false
        }
      });

      return {
        ...photo,
        url: `/uploads/objects/${objectId}/${photo.filename}`,
        unreadCommentsCount: unreadPhotoComments
      };
    }));

    const panoramasWithUnreadComments = await Promise.all(object.panoramas.map(async (panorama) => {
      const unreadPanoramaComments = await prisma.panoramaComment.count({
        where: {
          panoramaId: panorama.id,
          isAdminComment: false,
          isReadByAdmin: false
        }
      });

      return {
        ...panorama,
        url: `/uploads/objects/${objectId}/panoramas/${panorama.filename}`,
        unreadCommentsCount: unreadPanoramaComments
      };
    }));

    // Добавляем URL для фото
    const objectWithUrls = {
      ...object,
      photos: photosWithUnreadComments,
      panoramas: panoramasWithUnreadComments,
      unreadMessagesCount,
      unreadCommentsCount: unreadPhotoCommentsCount + unreadPanoramaCommentsCount,
      unreadPhotoCommentsCount,
      unreadPanoramaCommentsCount
    };

    return NextResponse.json({ success: true, object: objectWithUrls });
  } catch (error) {
    console.error("Ошибка загрузки деталей объекта:", error);
    return NextResponse.json({ success: false, message: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}
