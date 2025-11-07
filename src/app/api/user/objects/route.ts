import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ success: false, message: "Email обязателен" }, { status: 400 });
    }

    // Найти пользователя с его объектами
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        objects: {
          include: {
            projects: {
              select: {
                id: true,
                title: true,
                status: true,
                createdAt: true
              }
            },
            photos: {
              where: {
                isVisibleToCustomer: true
              }
            },
            panoramas: {
              where: {
                isVisibleToCustomer: true
              }
            },
            _count: {
              select: {
                documents: true,
                messages: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ success: false, message: "Пользователь не найден" }, { status: 404 });
    }

    // Для каждого объекта считаем статистику непрочитанных
    const objectsWithStats = await Promise.all(user.objects.map(async (obj) => {
      const photoIds = obj.photos.map(p => p.id);
      const panoramaIds = obj.panoramas.map(p => p.id);
      
      const unreadMessages = await prisma.message.count({
        where: {
          objectId: obj.id,
          isAdminMessage: true,
          isReadByCustomer: false
        }
      });

      let unreadPhotoComments = 0;
      let unreadPanoramaComments = 0;
      let totalPhotoComments = 0;
      let totalPanoramaComments = 0;
      
      if (photoIds.length > 0) {
        unreadPhotoComments = await prisma.photoComment.count({
          where: {
            photoId: { in: photoIds },
            isAdminComment: true,
            isReadByCustomer: false
          }
        });

        totalPhotoComments = await prisma.photoComment.count({
          where: { photoId: { in: photoIds } }
        });
      }

      if (panoramaIds.length > 0) {
        unreadPanoramaComments = await prisma.panoramaComment.count({
          where: {
            panoramaId: { in: panoramaIds },
            isAdminComment: true,
            isReadByCustomer: false
          }
        });

        totalPanoramaComments = await prisma.panoramaComment.count({
          where: { panoramaId: { in: panoramaIds } }
        });
      }

      const totalMessages = obj._count.messages;

      return {
        ...obj,
        unreadMessagesCount: unreadMessages,
        unreadCommentsCount: unreadPhotoComments + unreadPanoramaComments,
        unreadPhotoCommentsCount: unreadPhotoComments,
        unreadPanoramaCommentsCount: unreadPanoramaComments,
        totalMessagesCount: totalMessages,
        totalCommentsCount: totalPhotoComments + totalPanoramaComments,
        totalPhotoCommentsCount: totalPhotoComments,
        totalPanoramaCommentsCount: totalPanoramaComments
      };
    }));

    return NextResponse.json({ 
      success: true, 
      objects: objectsWithStats 
    });

  } catch (error) {
    console.error('Ошибка загрузки объектов пользователя:', error);
    return NextResponse.json({ 
      success: false, 
      message: "Внутренняя ошибка сервера" 
    }, { status: 500 });
  }
}
