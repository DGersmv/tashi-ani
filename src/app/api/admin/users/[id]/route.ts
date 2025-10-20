import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/userManagement";
import bcrypt from 'bcryptjs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Проверяем авторизацию админа
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        success: false, 
        message: "Требуется авторизация" 
      }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (!decoded || decoded.role !== 'MASTER') {
      return NextResponse.json({ 
        success: false, 
        message: "Доступ запрещен. Требуются права администратора" 
      }, { status: 403 });
    }

    const resolvedParams = await params;
    const userId = parseInt(resolvedParams.id);
    if (isNaN(userId)) {
      return NextResponse.json({ 
        success: false, 
        message: "Неверный ID пользователя" 
      }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        objects: {
          include: {
            projects: true,
            photos: {
              select: { id: true }
            },
            documents: true,
            messages: true,
            _count: {
              select: {
                projects: true,
                photos: true,
                documents: true,
                messages: true
              }
            }
          }
        },
        messages: true,
        photoComments: true
      }
    });

    if (!user) {
      return NextResponse.json({ 
        success: false, 
        message: "Пользователь не найден" 
      }, { status: 404 });
    }

    // Считаем непрочитанные сообщения от заказчика для админа
    const objectIds = user.objects.map(obj => obj.id);
    const unreadMessagesCount = await prisma.message.count({
      where: {
        objectId: { in: objectIds },
        isAdminMessage: false,
        isReadByAdmin: false
      }
    });

    // Считаем непрочитанные комментарии от заказчика
    const unreadCommentsCount = await prisma.photoComment.count({
      where: {
        photo: {
          objectId: { in: objectIds }
        },
        isAdminComment: false,
        isReadByAdmin: false
      }
    });

    // Считаем общее количество сообщений
    const totalMessagesCount = await prisma.message.count({
      where: {
        objectId: { in: objectIds }
      }
    });

    // Считаем общее количество комментариев
    const totalCommentsCount = await prisma.photoComment.count({
      where: {
        photo: {
          objectId: { in: objectIds }
        }
      }
    });

    // Для каждого объекта считаем статистику
    const objectsWithStats = await Promise.all(user.objects.map(async (obj) => {
      const photoIds = obj.photos.map(p => p.id);
      
      const unreadMessages = await prisma.message.count({
        where: {
          objectId: obj.id,
          isAdminMessage: false,
          isReadByAdmin: false
        }
      });

      let unreadComments = 0;
      let totalComments = 0;

      if (photoIds.length > 0) {
        unreadComments = await prisma.photoComment.count({
          where: {
            photoId: { in: photoIds },
            isAdminComment: false,
            isReadByAdmin: false
          }
        });

        totalComments = await prisma.photoComment.count({
          where: { photoId: { in: photoIds } }
        });
      }

      const totalMessages = await prisma.message.count({
        where: { objectId: obj.id }
      });

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
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        metadata: user.metadata,
        objects: objectsWithStats,
        messagesCount: user.messages.length,
        photoCommentsCount: user.photoComments.length,
        unreadMessagesCount,
        unreadCommentsCount,
        totalMessagesCount,
        totalCommentsCount
      }
    });

  } catch (error) {
    console.error("Ошибка получения пользователя:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Ошибка получения данных пользователя" 
    }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Проверяем авторизацию админа
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        success: false, 
        message: "Требуется авторизация" 
      }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (!decoded || decoded.role !== 'MASTER') {
      return NextResponse.json({ 
        success: false, 
        message: "Доступ запрещен. Требуются права администратора" 
      }, { status: 403 });
    }

    const resolvedParams = await params;
    const userId = parseInt(resolvedParams.id);
    if (isNaN(userId)) {
      return NextResponse.json({ 
        success: false, 
        message: "Неверный ID пользователя" 
      }, { status: 400 });
    }

    const { email, name, role, status, password, metadata } = await request.json();

    // Проверяем, существует ли пользователь
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return NextResponse.json({ 
        success: false, 
        message: "Пользователь не найден" 
      }, { status: 404 });
    }

    // Если меняется email, проверяем уникальность
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email }
      });
      
      if (emailExists) {
        return NextResponse.json({ 
          success: false, 
          message: "Пользователь с таким email уже существует" 
        }, { status: 409 });
      }
    }

    // Подготавливаем данные для обновления
    const updateData: any = {};
    
    if (email !== undefined) updateData.email = email;
    if (name !== undefined) updateData.name = name;
    if (role !== undefined) updateData.role = role;
    if (status !== undefined) updateData.status = status;
    if (metadata !== undefined) updateData.metadata = metadata;
    
    // Если указан новый пароль, хешируем его
    if (password) {
      if (password.length < 6) {
        return NextResponse.json({ 
          success: false, 
          message: "Пароль должен содержать минимум 6 символов" 
        }, { status: 400 });
      }
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      message: "Пользователь успешно обновлен",
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        status: updatedUser.status,
        createdAt: updatedUser.createdAt,
        lastLogin: updatedUser.lastLogin,
        metadata: updatedUser.metadata
      }
    });

  } catch (error) {
    console.error("Ошибка обновления пользователя:", error);
    return NextResponse.json({ 
      success: false, 
      message: "Ошибка обновления пользователя" 
    }, { status: 500 });
  }
}