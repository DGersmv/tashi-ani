import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { photoId, content, userEmail } = await request.json();

    if (!photoId || !content || !userEmail) {
      return NextResponse.json({ 
        success: false, 
        message: 'Не все обязательные поля предоставлены' 
      }, { status: 400 });
    }

    // Проверяем, что пользователь существует
    const user = await prisma.user.findUnique({
      where: { email: userEmail }
    });

    if (!user) {
      return NextResponse.json({ 
        success: false, 
        message: 'Пользователь не найден' 
      }, { status: 404 });
    }

    // Проверяем, что фото существует и пользователь имеет к нему доступ
    const photo = await prisma.photo.findFirst({
      where: {
        id: photoId,
        isVisibleToCustomer: true,
        object: {
          user: {
            email: userEmail
          }
        }
      }
    });

    if (!photo) {
      return NextResponse.json({ 
        success: false, 
        message: 'Фото не найдено или нет доступа' 
      }, { status: 404 });
    }

    // Создаем комментарий
    const comment = await prisma.photoComment.create({
      data: {
        photoId: photoId,
        userId: user.id,
        content: content.trim(),
        isAdminComment: false
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      comment: comment
    });

  } catch (error) {
    console.error('Ошибка при создании комментария:', error);
    return NextResponse.json(
      { success: false, message: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}