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
      
      const unreadMessages = await prisma.message.count({
        where: {
          objectId: obj.id,
          isAdminMessage: true,
          isReadByCustomer: false
        }
      });

      let unreadComments = 0;
      let totalComments = 0;
      
      if (photoIds.length > 0) {
        unreadComments = await prisma.photoComment.count({
          where: {
            photoId: { in: photoIds },
            isAdminComment: true,
            isReadByCustomer: false
          }
        });

        totalComments = await prisma.photoComment.count({
          where: { photoId: { in: photoIds } }
        });
      }

      const totalMessages = obj._count.messages;

      return {
        ...obj,
        unreadMessagesCount: unreadMessages,
        unreadCommentsCount: unreadComments,
        totalMessagesCount: totalMessages,
        totalCommentsCount: totalComments
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
