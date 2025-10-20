import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const objectId = parseInt(id);
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ success: false, message: "Email обязателен" }, { status: 400 });
    }

    // Найти объект с полной информацией
    const object = await prisma.object.findFirst({
      where: { 
        id: objectId,
        user: { email }
      },
      include: {
        projects: {
          include: {
            documents: true, // Включаем документы проектов
            stages: {
              include: {
                photos: {
                  where: {
                    isVisibleToCustomer: true
                  }
                }
              }
            },
            photos: {
              where: {
                isVisibleToCustomer: true
              }
            },
            _count: {
              select: {
                photos: true,
                documents: true,
                messages: true
              }
            }
          }
        },
        photos: {
          where: {
            isVisibleToCustomer: true
          },
          include: {
            folder: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        documents: true,
        messages: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!object) {
      return NextResponse.json({ success: false, message: "Объект не найден" }, { status: 404 });
    }

    // Считаем непрочитанные сообщения от админа для заказчика
    const unreadMessagesCount = await prisma.message.count({
      where: {
        objectId: objectId,
        isAdminMessage: true,
        isReadByCustomer: false
      }
    });

    // Считаем непрочитанные комментарии от админа
    const photoIds = object.photos.map(p => p.id);
    let unreadCommentsCount = 0;
    let totalCommentsCount = 0;

    if (photoIds.length > 0) {
      unreadCommentsCount = await prisma.photoComment.count({
        where: {
          photoId: { in: photoIds },
          isAdminComment: true,
          isReadByCustomer: false
        }
      });

      totalCommentsCount = await prisma.photoComment.count({
        where: { photoId: { in: photoIds } }
      });
    }

    // Считаем общее количество
    const totalMessagesCount = await prisma.message.count({
      where: { objectId: objectId }
    });

    // Для каждого фото считаем непрочитанные комментарии
    const photosWithUnreadComments = await Promise.all(object.photos.map(async (photo) => {
      const unreadPhotoComments = await prisma.photoComment.count({
        where: {
          photoId: photo.id,
          isAdminComment: true,
          isReadByCustomer: false
        }
      });

      return {
        ...photo,
        unreadCommentsCount: unreadPhotoComments
      };
    }));

    return NextResponse.json({ 
      success: true, 
      object: {
        ...object,
        photos: photosWithUnreadComments,
        unreadMessagesCount,
        unreadCommentsCount,
        totalMessagesCount,
        totalCommentsCount
      }
    });

  } catch (error) {
    console.error('Ошибка загрузки объекта:', error);
    return NextResponse.json({ 
      success: false, 
      message: "Внутренняя ошибка сервера" 
    }, { status: 500 });
  }
}
