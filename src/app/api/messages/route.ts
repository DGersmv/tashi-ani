import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/userManagement';

export async function POST(request: NextRequest) {
  try {
    const { content, objectId, projectId, isAdminMessage } = await request.json();

    if (!content || (!objectId && !projectId)) {
      return NextResponse.json({ 
        success: false, 
        message: 'Содержимое сообщения и ID объекта/проекта обязательны' 
      }, { status: 400 });
    }

    // Проверяем авторизацию
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        success: false, 
        message: 'Токен авторизации не предоставлен' 
      }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const userData = verifyToken(token);

    if (!userData) {
      return NextResponse.json({ 
        success: false, 
        message: 'Недействительный токен авторизации' 
      }, { status: 401 });
    }

    // Создаем сообщение
    const message = await prisma.message.create({
      data: {
        content,
        objectId: objectId || null,
        projectId: projectId || null,
        userId: userData.userId,
        isAdminMessage: isAdminMessage || false
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
      message: 'Сообщение отправлено',
      data: message
    });

  } catch (error: any) {
    console.error('Ошибка отправки сообщения:', error);
    return NextResponse.json({
      success: false,
      message: 'Внутренняя ошибка сервера',
      error: error.message
    }, { status: 500 });
  }
}

